/**
 * YOUMOVE - Sync Manager
 * Handles offline → online data synchronization
 */

import {
    getSyncQueue,
    removeFromSyncQueue,
    incrementRetry,
    getUnsyncedLogs,
    markLogAsSynced,
    type SyncQueueItem
} from './offline-storage';
import { supabase } from './supabase';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 1000;

// ============================================
// SYNC STATUS
// ============================================

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'complete';

let syncStatus: SyncStatus = 'idle';
let syncListeners: Array<(status: SyncStatus) => void> = [];

export function getSyncStatus(): SyncStatus {
    return syncStatus;
}

export function onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
    syncListeners.push(callback);
    return () => {
        syncListeners = syncListeners.filter(l => l !== callback);
    };
}

function setSyncStatus(status: SyncStatus) {
    syncStatus = status;
    syncListeners.forEach(l => l(status));
}

// ============================================
// MAIN SYNC FUNCTION
// ============================================

export async function syncOfflineData(): Promise<{ success: number; failed: number }> {
    if (syncStatus === 'syncing') {
        console.log('[Sync] Already syncing, skipping...');
        return { success: 0, failed: 0 };
    }

    if (!navigator.onLine) {
        console.log('[Sync] Offline, skipping sync');
        return { success: 0, failed: 0 };
    }

    setSyncStatus('syncing');
    console.log('[Sync] Starting sync...');

    let success = 0;
    let failed = 0;

    try {
        // Get all pending items
        const queue = await getSyncQueue();
        console.log(`[Sync] ${queue.length} items in queue`);

        // Process each item
        for (const item of queue) {
            try {
                await processQueueItem(item);
                await removeFromSyncQueue(item.id!);
                success++;
                console.log(`[Sync] Synced item ${item.id}`);
            } catch (error) {
                console.error(`[Sync] Failed to sync item ${item.id}:`, error);

                if (item.retries >= MAX_RETRIES) {
                    // Give up after max retries
                    console.log(`[Sync] Max retries reached for item ${item.id}, removing`);
                    await removeFromSyncQueue(item.id!);
                } else {
                    await incrementRetry(item.id!);
                }

                failed++;
            }

            // Small delay between items
            await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        }

        // Sync unsynced workout logs
        const unsyncedLogs = await getUnsyncedLogs();
        for (const log of unsyncedLogs) {
            try {
                await syncWorkoutLog(log);
                await markLogAsSynced((log as { id: string }).id);
                success++;
            } catch (error) {
                console.error('[Sync] Failed to sync workout log:', error);
                failed++;
            }
        }

        setSyncStatus(failed > 0 ? 'error' : 'complete');
        console.log(`[Sync] Complete. Success: ${success}, Failed: ${failed}`);

    } catch (error) {
        console.error('[Sync] Sync error:', error);
        setSyncStatus('error');
    }

    // Reset status after delay
    setTimeout(() => setSyncStatus('idle'), 3000);

    return { success, failed };
}

// ============================================
// PROCESS QUEUE ITEMS
// ============================================

async function processQueueItem(item: SyncQueueItem): Promise<void> {
    switch (item.type) {
        case 'workout_log':
            await syncWorkoutLog(item.data);
            break;
        case 'session_update':
            await syncSessionUpdate(item.data);
            break;
        case 'profile_update':
            await syncProfileUpdate(item.data);
            break;
        default:
            console.warn('[Sync] Unknown item type:', item.type);
    }
}

// ============================================
// SYNC FUNCTIONS
// ============================================

async function syncWorkoutLog(data: unknown): Promise<void> {
    const { error } = await supabase
        .from('workout_logs')
        .upsert(data as Record<string, unknown>);

    if (error) throw error;
}

async function syncSessionUpdate(data: unknown): Promise<void> {
    const { id, ...updates } = data as { id: string;[key: string]: unknown };

    const { error } = await supabase
        .from('workout_sessions')
        .update(updates)
        .eq('id', id);

    if (error) throw error;
}

async function syncProfileUpdate(data: unknown): Promise<void> {
    const { id, ...updates } = data as { id: string;[key: string]: unknown };

    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id);

    if (error) throw error;
}

// ============================================
// AUTO-SYNC ON RECONNECT
// ============================================

export function initAutoSync(): void {
    // Sync when coming online
    window.addEventListener('online', () => {
        console.log('[Sync] Back online, triggering sync...');
        setTimeout(syncOfflineData, 1000);
    });

    // Listen for service worker sync complete
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data?.type === 'SYNC_COMPLETE') {
                console.log('[Sync] Service worker sync complete');
                setSyncStatus('complete');
                setTimeout(() => setSyncStatus('idle'), 3000);
            }
        });
    }

    // Initial sync if online
    if (navigator.onLine) {
        setTimeout(syncOfflineData, 2000);
    }
}

// ============================================
// MANUAL SYNC TRIGGER
// ============================================

export async function triggerBackgroundSync(): Promise<boolean> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        try {
            const registration = await navigator.serviceWorker.ready;
            await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } })
                .sync.register('workout-sync-queue');
            console.log('[Sync] Background sync registered');
            return true;
        } catch (error) {
            console.error('[Sync] Background sync registration failed:', error);
            return false;
        }
    }

    // Fallback to manual sync
    await syncOfflineData();
    return true;
}
