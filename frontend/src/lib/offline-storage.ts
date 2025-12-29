/**
 * YOUMOVE - Offline Storage (IndexedDB)
 * Local database for offline-first functionality
 */

const DB_NAME = 'youmove-offline';
const DB_VERSION = 1;

// Store names
export const STORES = {
    WORKOUTS: 'workouts',
    EXERCISES: 'exercises',
    SESSIONS: 'sessions',
    WORKOUT_LOGS: 'workout_logs',
    SYNC_QUEUE: 'sync_queue',
    USER_PROFILE: 'user_profile',
} as const;

type StoreName = typeof STORES[keyof typeof STORES];

// ============================================
// DATABASE INITIALIZATION
// ============================================

let dbPromise: Promise<IDBDatabase> | null = null;

export function getDB(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Workouts store
            if (!db.objectStoreNames.contains(STORES.WORKOUTS)) {
                const workoutStore = db.createObjectStore(STORES.WORKOUTS, { keyPath: 'id' });
                workoutStore.createIndex('user_id', 'user_id', { unique: false });
                workoutStore.createIndex('updated_at', 'updated_at', { unique: false });
            }

            // Exercises store
            if (!db.objectStoreNames.contains(STORES.EXERCISES)) {
                const exerciseStore = db.createObjectStore(STORES.EXERCISES, { keyPath: 'id' });
                exerciseStore.createIndex('primary_muscle', 'primary_muscle', { unique: false });
                exerciseStore.createIndex('name', 'name', { unique: false });
            }

            // Active sessions store
            if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
                const sessionStore = db.createObjectStore(STORES.SESSIONS, { keyPath: 'id' });
                sessionStore.createIndex('user_id', 'user_id', { unique: false });
                sessionStore.createIndex('scheduled_date', 'scheduled_date', { unique: false });
            }

            // Workout logs store
            if (!db.objectStoreNames.contains(STORES.WORKOUT_LOGS)) {
                const logStore = db.createObjectStore(STORES.WORKOUT_LOGS, { keyPath: 'id' });
                logStore.createIndex('session_id', 'session_id', { unique: false });
                logStore.createIndex('synced', 'synced', { unique: false });
            }

            // Sync queue store
            if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
                const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
                syncStore.createIndex('timestamp', 'timestamp', { unique: false });
                syncStore.createIndex('type', 'type', { unique: false });
            }

            // User profile store
            if (!db.objectStoreNames.contains(STORES.USER_PROFILE)) {
                db.createObjectStore(STORES.USER_PROFILE, { keyPath: 'id' });
            }
        };
    });

    return dbPromise;
}

// ============================================
// GENERIC CRUD OPERATIONS
// ============================================

export async function getAll<T>(storeName: StoreName): Promise<T[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function getById<T>(storeName: StoreName, id: string): Promise<T | undefined> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function put<T extends { id: string }>(storeName: StoreName, item: T): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function putMany<T extends { id: string }>(storeName: StoreName, items: T[]): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);

        items.forEach(item => store.put(item));

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

export async function remove(storeName: StoreName, id: string): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function clear(storeName: StoreName): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ============================================
// SYNC QUEUE OPERATIONS
// ============================================

export interface SyncQueueItem {
    id?: number;
    type: 'workout_log' | 'session_update' | 'profile_update';
    action: 'create' | 'update' | 'delete';
    data: unknown;
    timestamp: number;
    retries: number;
}

export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
        const store = transaction.objectStore(STORES.SYNC_QUEUE);
        const request = store.add({
            ...item,
            timestamp: Date.now(),
            retries: 0,
        });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
    return getAll<SyncQueueItem>(STORES.SYNC_QUEUE);
}

export async function removeFromSyncQueue(id: number): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
        const store = transaction.objectStore(STORES.SYNC_QUEUE);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function incrementRetry(id: number): Promise<void> {
    const db = await getDB();
    return new Promise(async (resolve, reject) => {
        const item = await getById<SyncQueueItem>(STORES.SYNC_QUEUE, String(id));
        if (!item) return resolve();

        const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
        const store = transaction.objectStore(STORES.SYNC_QUEUE);
        const request = store.put({ ...item, retries: item.retries + 1 });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ============================================
// SPECIFIC HELPERS
// ============================================

export async function getUnsyncedLogs(): Promise<unknown[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.WORKOUT_LOGS, 'readonly');
        const store = transaction.objectStore(STORES.WORKOUT_LOGS);
        const index = store.index('synced');
        const request = index.getAll(IDBKeyRange.only(false));

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function markLogAsSynced(id: string): Promise<void> {
    const log = await getById<{ id: string; synced: boolean }>(STORES.WORKOUT_LOGS, id);
    if (log) {
        await put(STORES.WORKOUT_LOGS, { ...log, synced: true });
    }
}

// ============================================
// STORAGE STATS
// ============================================

export async function getStorageStats(): Promise<{ used: number; quota: number; percent: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const quota = estimate.quota || 0;
        return {
            used,
            quota,
            percent: quota > 0 ? (used / quota) * 100 : 0,
        };
    }
    return { used: 0, quota: 0, percent: 0 };
}
