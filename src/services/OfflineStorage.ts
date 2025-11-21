import { WorkoutPlan, WorkoutSession, PersonalRecord } from "@/stores/useWorkoutStore";

const DB_NAME = 'flexflow-offline';
const DB_VERSION = 1;

interface OfflineData {
  workoutPlans: WorkoutPlan[];
  workoutSessions: WorkoutSession[];
  personalRecords: PersonalRecord[];
  lastSync: number;
}

class OfflineStorageService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
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
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  async saveWorkoutPlans(plans: WorkoutPlan[]): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['workoutPlans'], 'readwrite');
    const store = transaction.objectStore('workoutPlans');
    
    // Clear existing and add new
    await store.clear();
    for (const plan of plans) {
      await store.put(plan);
    }
    
    await this.updateLastSync();
  }

  async getWorkoutPlans(): Promise<WorkoutPlan[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['workoutPlans'], 'readonly');
      const store = transaction.objectStore('workoutPlans');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveWorkoutSessions(sessions: WorkoutSession[]): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['workoutSessions'], 'readwrite');
    const store = transaction.objectStore('workoutSessions');
    
    await store.clear();
    for (const session of sessions) {
      await store.put(session);
    }
    
    await this.updateLastSync();
  }

  async getWorkoutSessions(): Promise<WorkoutSession[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['workoutSessions'], 'readonly');
      const store = transaction.objectStore('workoutSessions');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async savePersonalRecords(records: PersonalRecord[]): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['personalRecords'], 'readwrite');
    const store = transaction.objectStore('personalRecords');
    
    await store.clear();
    for (const record of records) {
      await store.put(record);
    }
    
    await this.updateLastSync();
  }

  async getPersonalRecords(): Promise<PersonalRecord[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['personalRecords'], 'readonly');
      const store = transaction.objectStore('personalRecords');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async updateLastSync(): Promise<void> {
    if (!this.db) return;
    
    const transaction = this.db.transaction(['metadata'], 'readwrite');
    const store = transaction.objectStore('metadata');
    await store.put({ key: 'lastSync', value: Date.now() });
  }

  async getLastSync(): Promise<number | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      const request = store.get('lastSync');
      
      request.onsuccess = () => {
        resolve(request.result?.value || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll(): Promise<void> {
    if (!this.db) await this.init();
    
    const stores = ['workoutPlans', 'workoutSessions', 'personalRecords', 'metadata'];
    const transaction = this.db!.transaction(stores, 'readwrite');
    
    for (const storeName of stores) {
      transaction.objectStore(storeName).clear();
    }
  }
}

export const offlineStorage = new OfflineStorageService();
