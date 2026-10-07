/**
 * SyncQueue — the offline-first write path for Planik.
 *
 * Before this existed, every store action called `supabase.from(...)` directly.
 * That works only while the device is online: on a flaky gym Wi-Fi or in
 * airplane mode the request rejects and the user's set / meal / water log is
 * silently lost.
 *
 * The model now is a durable outbox:
 *
 *   UI action -> optimistic state update
 *             -> mirror into IndexedDB
 *             -> SyncQueue.send()
 *                  online  : try the write now, enqueue if it fails
 *                  offline : enqueue immediately
 *             -> replay() drains the outbox in order on reconnect
 *
 * Why client-generated UUIDs? An offline insert needs an `id` before the
 * server ever sees the row, otherwise the UI has nothing stable to key on and
 * a later delete can't target it. Every affected table defaults `id` to
 * `gen_random_uuid()`, so sending our own UUID is legal and makes replay
 * idempotent — re-sending the same insert after a partial failure upserts on
 * the primary key instead of creating a duplicate.
 *
 * Conflict resolution is last-write-wins, evaluated at replay time: if the
 * server row was touched more recently than the queued mutation, the queued
 * update is dropped. Deletes always win over pending updates for the same id.
 *
 * Privacy note: queued mutations live only in this device's IndexedDB and are
 * replayed through the authenticated Supabase client, so the existing
 * `auth.uid()` RLS policies still scope every write to its owner — a queued
 * row can never be replayed into someone else's account.
 */
import { supabase } from '@/integrations/supabase/client';
import { offlineStorage, type OutboxEntry, type OutboxOperation } from '@/services/OfflineStorage';

/** Tables the offline queue is allowed to write to. */
export type SyncTable =
  | 'workout_plans'
  | 'exercises'
  | 'workout_sessions'
  | 'completed_exercises'
  | 'personal_records'
  | 'food_items'
  | 'water_intake'
  | 'daily_steps';

export interface Mutation {
  table: SyncTable;
  op: OutboxOperation;
  /** Row payload for insert/update. */
  payload?: Record<string, any>;
  /** Equality filters for update/delete (e.g. `{ id }`). */
  match?: Record<string, any>;
  /** Conflict target for idempotent upserts. */
  onConflict?: string;
  /**
   * Column holding the row's last-modified timestamp. Used for the
   * last-write-wins check on replay. Defaults to `updated_at` when present.
   */
  timestampColumn?: string;
}

/**
 * Foreign-key children: if a write to the key table fails, writes to the
 * listed tables may reference the missing parent row and must wait.
 */
const DEPENDENTS: Partial<Record<SyncTable, SyncTable[]>> = {
  workout_plans: ['exercises', 'workout_sessions', 'completed_exercises'],
  workout_sessions: ['completed_exercises'],
};

/** Give up on an entry after this many failed replay attempts. */

const MAX_ATTEMPTS = 5;

type Listener = (pending: number) => void;
const listeners = new Set<Listener>();
let pendingCount = 0;
let replaying = false;

/** Generate a UUID that Postgres will accept for a primary key. */
export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for older WebViews that lack crypto.randomUUID.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

async function notify() {
  pendingCount = await offlineStorage.countOutbox();
  listeners.forEach((l) => l(pendingCount));
}

/** Execute a single mutation against Supabase. Throws on failure. */
async function execute(mutation: Mutation): Promise<void> {
  const { table, op, payload, match, onConflict } = mutation;

  // The queue is table-agnostic by design, so the generated per-table types
  // can't narrow here — `db` is the untyped view of the same client.
  const db = supabase as any;

  if (op === 'insert') {
    // Upsert (not insert) so a replayed entry with a known id is idempotent.
    const { error } = await db
      .from(table)
      .upsert(payload, onConflict ? { onConflict } : undefined);
    if (error) throw error;
    return;
  }

  if (op === 'update') {
    let query = db.from(table).update(payload);
    for (const [column, value] of Object.entries(match ?? {})) {
      query = query.eq(column, value);
    }
    const { error } = await query;
    if (error) throw error;
    return;
  }

  let query = db.from(table).delete();
  for (const [column, value] of Object.entries(match ?? {})) {
    query = query.eq(column, value);
  }
  const { error } = await query;
  if (error) throw error;
}

/**
 * Last-write-wins guard. Returns true when the queued update should be
 * skipped because the server copy is newer than the queued change.
 */
async function serverIsNewer(entry: OutboxEntry): Promise<boolean> {
  const column = entry.mutation.timestampColumn;
  if (!column || entry.mutation.op !== 'update') return false;

  try {
    let query = (supabase as any).from(entry.mutation.table).select(column);
    for (const [col, value] of Object.entries(entry.mutation.match ?? {})) {
      query = query.eq(col, value);
    }
    const { data, error } = await query.maybeSingle();
    if (error || !data) return false;


    const serverTime = new Date((data as any)[column]).getTime();
    return Number.isFinite(serverTime) && serverTime > entry.createdAt;
  } catch {
    // If we can't read the server timestamp, prefer applying the local change.
    return false;
  }
}

export const syncQueue = {
  /** Current number of unsynced mutations. */
  pending(): number {
    return pendingCount;
  },

  /** Subscribe to pending-count changes (for the header badge). */
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    listener(pendingCount);
    return () => listeners.delete(listener);
  },

  /** Read the count from disk once at app start. */
  async refreshPending(): Promise<void> {
    await notify();
  },

  /**
   * Send a mutation. Tries the network first when online; on any failure the
   * mutation is queued rather than dropped. Never throws for network reasons,
   * so callers can update state optimistically and move on.
   *
   * @returns `true` if the write reached the server, `false` if it was queued.
   */
  async send(mutation: Mutation): Promise<boolean> {
    if (navigator.onLine) {
      try {
        await execute(mutation);
        return true;
      } catch (error) {
        console.warn('SyncQueue: write failed, queueing for replay', error);
      }
    }

    await offlineStorage.enqueue(mutation);
    await notify();
    return false;
  },

  /**
   * Drain the outbox in insertion order, one at a time.
   *
   * Order matters and concurrency must stay at 1: a `workout_sessions` insert
   * has to land before the `completed_exercises` rows that reference it.
   *
   * A failing entry no longer stops the whole drain — it only blocks the
   * entries that could actually depend on it (the same row, and rows in tables
   * that reference it by foreign key). Everything else keeps syncing.
   */
  async replay(): Promise<{ synced: number; failed: number }> {
    if (replaying || !navigator.onLine) return { synced: 0, failed: 0 };
    replaying = true;

    let synced = 0;
    let failed = 0;

    try {
      const entries = await offlineStorage.listOutbox();

      // A queued delete supersedes any earlier queued update for the same row.
      const deletedKeys = new Set(
        entries
          .filter((e) => e.mutation.op === 'delete')
          .map((e) => `${e.mutation.table}:${JSON.stringify(e.mutation.match ?? {})}`)
      );

      /** Tables/rows we must not touch this pass because a parent write failed. */
      const blockedTables = new Set<SyncTable>();
      const blockedKeys = new Set<string>();

      for (const entry of entries) {
        const table = entry.mutation.table as SyncTable;
        const key = `${entry.mutation.table}:${JSON.stringify(entry.mutation.match ?? {})}`;

        if (blockedTables.has(table) || blockedKeys.has(key)) {
          failed++;
          continue;
        }

        if (entry.mutation.op === 'update' && deletedKeys.has(key)) {
          await offlineStorage.removeFromOutbox(entry.seq!);
          continue;
        }

        if (await serverIsNewer(entry)) {
          await offlineStorage.removeFromOutbox(entry.seq!);
          continue;
        }

        try {
          await execute(entry.mutation as Mutation);
          await offlineStorage.removeFromOutbox(entry.seq!);
          synced++;
        } catch (error) {
          console.error('SyncQueue: replay failed', entry.mutation.table, error);
          const attempts = (entry.attempts ?? 0) + 1;
          if (attempts >= MAX_ATTEMPTS) {
            // Park it: keep the data but stop retrying every reconnect.
            await offlineStorage.parkOutboxEntry(entry.seq!);
          } else {
            await offlineStorage.bumpAttempts(entry.seq!, attempts);
          }
          failed++;

          // Skip only what could depend on this write, then carry on.
          blockedKeys.add(key);
          for (const dependent of DEPENDENTS[table] ?? []) {
            blockedTables.add(dependent);
          }
        }
      }
    } finally {
      replaying = false;
      await notify();
    }


    return { synced, failed };
  },

  /** Wipe the queue (used on sign-out). */
  async clear(): Promise<void> {
    await offlineStorage.clearOutbox();
    await notify();
  },
};
