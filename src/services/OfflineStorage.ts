/**
 * OfflineStorage — IndexedDB mirror of the user's data plus the durable
 * mutation outbox that powers offline writes.
 *
 * Why IndexedDB and not localStorage?
 *   localStorage caps out at ~5 MB and stores strings only. IndexedDB is
 *   structured, ~hundreds of MB, async, and supports indexes — perfect for
 *   a workout/diet log that can grow large over months of use.
 *
 * Strategy (offline-first):
 *   1. Store actions update Zustand state optimistically and mirror the
 *      resulting snapshot here, so the app renders instantly with no network.
 *   2. The same actions hand the write to `SyncQueue`, which either sends it
 *      now or appends it to the `outbox` store below.
 *   3. On reconnect, `useOfflineSync` drains the outbox in insertion order and
 *      then re-pulls from Supabase so the local mirror catches up with any
 *      changes made on another device.
 *
 * IndexedDB uses an event-based API; we wrap each call in a Promise so the
 * rest of the codebase can use plain async/await.
 */
import { WorkoutPlan, WorkoutSession, PersonalRecord } from "@/stores/useWorkoutStore";

const DB_NAME = 'flexflow-offline';
/**
 * v2 adds the `outbox` (queued mutations) plus `foodItems` and `waterIntake`
 * mirrors — before v2 diet and water data was unavailable offline.
 */
const DB_VERSION = 2;

export type OutboxOperation = 'insert' | 'update' | 'delete';

/** One queued mutation, as persisted on disk. */
export interface OutboxEntry {
  /** Auto-increment key — also the replay order. */
  seq?: number;
  mutation: {
    table: string;
    op: OutboxOperation;
    payload?: Record<string, any>;
    match?: Record<string, any>;
    onConflict?: string;
    timestampColumn?: string;
  };
  /** When the user made the change — the "write time" for last-write-wins. */
  createdAt: number;
  attempts: number;
  /** Set once we give up retrying, so it stops blocking the drain. */
  parked?: boolean;
}

class OfflineStorageService {
  // Cached DB handle — we open it once on first use and reuse it.
  private db: IDBDatabase | null = null;

  /**
   * Open (or create) the IndexedDB database. Safe to call multiple times;
   * subsequent calls reuse the cached handle.
   */
  async init(): Promise<void> {
    if (this.db) return;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      // Fires only when DB_VERSION is higher than the version on disk —
      // this is where we declare/migrate our object stores (= "tables").
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Each store keys rows by `id` (or `exerciseName` for PRs) so we
        // can upsert with `store.put(record)` without manual lookups.
        if (!db.objectStoreNames.contains('workoutPlans')) {
          db.createObjectStore('workoutPlans', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('workoutSessions')) {
          db.createObjectStore('workoutSessions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('personalRecords')) {
          const recordStore = db.createObjectStore('personalRecords', { keyPath: 'exerciseName' });
          recordStore.createIndex('exerciseName', 'exerciseName', { unique: false });
        }
        // Generic key/value store for metadata like `lastSync` timestamps.
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
        // --- v2 ---
        if (!db.objectStoreNames.contains('outbox')) {
          // autoIncrement gives us a monotonic sequence = replay order.
          db.createObjectStore('outbox', { keyPath: 'seq', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('foodItems')) {
          db.createObjectStore('foodItems', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('waterIntake')) {
          db.createObjectStore('waterIntake', { keyPath: 'id' });
        }
      };
    });
  }

  /** Promise wrapper around a single IDBRequest. */
  private request<T>(req: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  /** Replace a whole object store with the given snapshot. */
  private async replaceStore(storeName: string, rows: any[], keyPath = 'id'): Promise<void> {
    await this.init();
    const transaction = this.db!.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    store.clear();
    for (const row of rows) {
      if (row?.[keyPath] === undefined) continue;
      store.put(row);
    }
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    await this.updateLastSync();
  }

  private async readStore<T>(storeName: string): Promise<T[]> {
    await this.init();
    const transaction = this.db!.transaction([storeName], 'readonly');
    return this.request(transaction.objectStore(storeName).getAll());
  }

  // ---------------------------------------------------------------- snapshots

  async saveWorkoutPlans(plans: WorkoutPlan[]): Promise<void> {
    return this.replaceStore('workoutPlans', plans);
  }

  async getWorkoutPlans(): Promise<WorkoutPlan[]> {
    return this.readStore<WorkoutPlan>('workoutPlans');
  }

  async saveWorkoutSessions(sessions: WorkoutSession[]): Promise<void> {
    return this.replaceStore('workoutSessions', sessions);
  }

  async getWorkoutSessions(): Promise<WorkoutSession[]> {
    return this.readStore<WorkoutSession>('workoutSessions');
  }

  async savePersonalRecords(records: PersonalRecord[]): Promise<void> {
    return this.replaceStore('personalRecords', records, 'exerciseName');
  }

  async getPersonalRecords(): Promise<PersonalRecord[]> {
    return this.readStore<PersonalRecord>('personalRecords');
  }

  /** Mirror diet log rows so the diet tracker works with no network. */
  async saveFoodItems(items: any[]): Promise<void> {
    return this.replaceStore('foodItems', items);
  }

  async getFoodItems(): Promise<any[]> {
    return this.readStore('foodItems');
  }

  /** Mirror water intake rows so the water tracker works with no network. */
  async saveWaterIntake(rows: any[]): Promise<void> {
    return this.replaceStore('waterIntake', rows);
  }

  async getWaterIntake(): Promise<any[]> {
    return this.readStore('waterIntake');
  }

  // ------------------------------------------------------------------ outbox

  /** Append a mutation to the replay queue. */
  async enqueue(mutation: OutboxEntry['mutation']): Promise<void> {
    await this.init();
    const transaction = this.db!.transaction(['outbox'], 'readwrite');
    transaction.objectStore('outbox').add({
      mutation,
      createdAt: Date.now(),
      attempts: 0,
    } as OutboxEntry);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /** All queued mutations that haven't been parked, oldest first. */
  async listOutbox(): Promise<OutboxEntry[]> {
    const all = await this.readStore<OutboxEntry>('outbox');
    return all.filter((e) => !e.parked).sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
  }

  /** Count of live (non-parked) queued mutations — drives the header badge. */
  async countOutbox(): Promise<number> {
    try {
      return (await this.listOutbox()).length;
    } catch {
      return 0;
    }
  }

  async removeFromOutbox(seq: number): Promise<void> {
    await this.init();
    const transaction = this.db!.transaction(['outbox'], 'readwrite');
    transaction.objectStore('outbox').delete(seq);
    await new Promise<void>((resolve) => {
      transaction.oncomplete = () => resolve();
    });
  }

  private async patchOutboxEntry(seq: number, patch: Partial<OutboxEntry>): Promise<void> {
    await this.init();
    const transaction = this.db!.transaction(['outbox'], 'readwrite');
    const store = transaction.objectStore('outbox');
    const existing = await this.request<OutboxEntry>(store.get(seq));
    if (existing) store.put({ ...existing, ...patch });
    await new Promise<void>((resolve) => {
      transaction.oncomplete = () => resolve();
    });
  }

  async bumpAttempts(seq: number, attempts: number): Promise<void> {
    return this.patchOutboxEntry(seq, { attempts });
  }

  /** Stop retrying an entry but keep it on disk for inspection. */
  async parkOutboxEntry(seq: number): Promise<void> {
    return this.patchOutboxEntry(seq, { parked: true });
  }

  async clearOutbox(): Promise<void> {
    await this.init();
    const transaction = this.db!.transaction(['outbox'], 'readwrite');
    transaction.objectStore('outbox').clear();
    await new Promise<void>((resolve) => {
      transaction.oncomplete = () => resolve();
    });
  }

  // ---------------------------------------------------------------- metadata

  private async updateLastSync(): Promise<void> {
    if (!this.db) return;
    const transaction = this.db.transaction(['metadata'], 'readwrite');
    transaction.objectStore('metadata').put({ key: 'lastSync', value: Date.now() });
  }

  async getLastSync(): Promise<number | null> {
    await this.init();
    const transaction = this.db!.transaction(['metadata'], 'readonly');
    const result = await this.request<any>(transaction.objectStore('metadata').get('lastSync'));
    return result?.value ?? null;
  }

  /** Wipe everything, including queued mutations (used on sign-out). */
  async clearAll(): Promise<void> {
    await this.init();
    const stores = [
      'workoutPlans',
      'workoutSessions',
      'personalRecords',
      'foodItems',
      'waterIntake',
      'outbox',
      'metadata',
    ];
    const transaction = this.db!.transaction(stores, 'readwrite');
    for (const storeName of stores) {
      transaction.objectStore(storeName).clear();
    }
    await new Promise<void>((resolve) => {
      transaction.oncomplete = () => resolve();
    });
  }
}

export const offlineStorage = new OfflineStorageService();
