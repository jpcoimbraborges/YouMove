/**
 * YOUMOVE - Workout Sync Service
 * 
 * Handles synchronization between local storage and Supabase.
 * Ensures zero data loss with conflict resolution.
 */

import { supabase } from './supabase';
import {
    getPendingSync,
    removePendingSync,
    updatePendingSyncStatus,
    type WorkoutSession,
} from './workout-session';

// ============================================
// TYPES
// ============================================

export interface SyncResult {
    success: boolean;
    synced: number;
    failed: number;
    errors: SyncError[];
}

export interface SyncError {
    session_id: string;
    error: string;
    retriable: boolean;
}

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

// ============================================
// SYNC STATUS MANAGEMENT
// ============================================

let currentStatus: SyncStatus = 'idle';
let listeners: Array<(status: SyncStatus) => void> = [];

export function getSyncStatus(): SyncStatus {
    return currentStatus;
}

export function onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
    listeners.push(callback);
    return () => {
        listeners = listeners.filter(l => l !== callback);
    };
}

function setStatus(status: SyncStatus): void {
    currentStatus = status;
    listeners.forEach(l => l(status));
}

// ============================================
// MAIN SYNC FUNCTION
// ============================================

export async function syncWorkoutSessions(): Promise<SyncResult> {
    // Check if online
    if (!navigator.onLine) {
        return { success: false, synced: 0, failed: 0, errors: [] };
    }

    // Check if already syncing
    if (currentStatus === 'syncing') {
        return { success: false, synced: 0, failed: 0, errors: [] };
    }

    setStatus('syncing');

    const pending = getPendingSync();
    const result: SyncResult = {
        success: true,
        synced: 0,
        failed: 0,
        errors: [],
    };

    for (const item of pending) {
        // Skip if too many attempts
        if (item.attempts >= 5) {
            result.errors.push({
                session_id: item.session_id,
                error: 'Max retry attempts reached',
                retriable: false,
            });
            result.failed++;
            continue;
        }

        try {
            await syncSingleSession(item.session_data);
            removePendingSync(item.session_id);
            result.synced++;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const retriable = isRetriableError(error);

            updatePendingSyncStatus(item.session_id, errorMessage);

            result.errors.push({
                session_id: item.session_id,
                error: errorMessage,
                retriable,
            });
            result.failed++;
        }
    }

    result.success = result.failed === 0;
    setStatus(result.success ? 'success' : 'error');

    // Reset status after delay
    setTimeout(() => setStatus('idle'), 3000);

    return result;
}

// ============================================
// SINGLE SESSION SYNC
// ============================================

async function syncSingleSession(session: WorkoutSession): Promise<void> {
    const { user_id, id: session_id } = session;

    // Calculate duration in SECONDS (DB uses seconds, not minutes)
    const durationSeconds = (session.actual_duration_minutes || 0) * 60;

    // Calculate calories burned (rough estimate: ~5 kcal per kg of volume)
    const caloriesEstimate = Math.round((session.total_volume_kg || 0) * 0.05);

    // =====================================================
    // IMPORTANT: These are the ACTUAL production DB columns
    // Based on debug page inspection:
    // id, user_id, workout_id, workout_name, started_at, completed_at,
    // duration_seconds, total_sets, total_reps, total_volume,
    // exercises_log, notes, rating, created_at
    // =====================================================
    const sessionData: Record<string, any> = {
        id: session_id,
        user_id,
        workout_id: session.workout_id || null,
        workout_name: session.workout_name || 'Treino',
        started_at: session.started_at,
        completed_at: session.completed_at,
        duration_seconds: durationSeconds,                    // SECONDS not minutes!
        total_sets: session.total_sets_completed || 0,        // Column is "total_sets"
        total_reps: session.total_reps_completed || 0,        // Column is "total_reps"  
        total_volume: session.total_volume_kg || 0,           // Column is "total_volume"
        notes: null,
        // rating: session.average_rpe ? Math.round(session.average_rpe / 2) : null, // RPE 1-10 -> Rating 1-5
    };

    console.log('🔄 Syncing session to Supabase:', {
        id: session_id,
        name: sessionData.workout_name,
        duration: sessionData.duration_seconds,
        volume: sessionData.total_volume,
        sets: sessionData.total_sets,
        reps: sessionData.total_reps,
    });

    // 1. Upsert workout session
    const { error: sessionError } = await supabase
        .from('workout_sessions')
        .upsert(sessionData, {
            onConflict: 'id',
        });

    if (sessionError) {
        console.error('❌ Session sync error:', sessionError);
        throw new Error(`Session sync failed: ${sessionError.message}`);
    }

    console.log('✅ Session synced successfully');

    // 2. Upsert workout logs for each exercise
    for (const exercise of session.exercises) {
        if (exercise.skipped) continue;

        const completedSets = exercise.sets.filter(s => s.completed);
        if (completedSets.length === 0) continue;

        const setData = completedSets.map(set => ({
            set_number: set.set_number,
            set_type: set.set_type,
            target_reps: set.target_reps,
            target_weight_kg: set.target_weight_kg,
            actual_reps: set.actual_reps,
            actual_weight_kg: set.actual_weight_kg,
            rpe: set.rpe,
            rest_seconds: set.actual_rest_seconds || set.target_rest_seconds,
            completed: set.completed,
            skipped: set.skipped,
        }));

        const totalVolume = completedSets.reduce((acc, set) => {
            if (set.actual_reps && set.actual_weight_kg) {
                return acc + (set.actual_reps * set.actual_weight_kg);
            }
            return acc;
        }, 0);

        const maxWeight = Math.max(
            ...completedSets
                .filter(s => s.actual_weight_kg !== null)
                .map(s => s.actual_weight_kg!)
        ) || null;

        const { error: logError } = await supabase
            .from('workout_logs')
            .upsert({
                id: exercise.id, // Using exercise id as log id
                session_id,
                user_id,
                exercise_id: exercise.exercise_id,
                exercise_order: exercise.order,
                sets_data: setData,
                total_volume_kg: totalVolume,
                total_reps: completedSets.reduce((a, s) => a + (s.actual_reps || 0), 0),
                max_weight_kg: maxWeight,
                notes: exercise.notes,
            }, {
                onConflict: 'id',
            });

        if (logError) {
            throw new Error(`Log sync failed for ${exercise.exercise_name}: ${logError.message}`);
        }
    }

    // Note: Session totals are now included in the initial upsert, no separate update needed
}

// ============================================
// CONFLICT RESOLUTION
// ============================================

export async function resolveConflict(
    localSession: WorkoutSession,
    remoteSession: WorkoutSession
): Promise<WorkoutSession> {
    // Strategy: Last-write-wins based on last_modified_at
    const localTime = new Date(localSession.last_modified_at).getTime();
    const remoteTime = new Date(remoteSession.last_modified_at).getTime();

    if (localTime > remoteTime) {
        // Local is newer, push to remote
        await syncSingleSession(localSession);
        return localSession;
    } else {
        // Remote is newer, use remote
        return remoteSession;
    }
}

// ============================================
// FETCH REMOTE SESSION
// ============================================

export async function fetchSessionFromServer(
    sessionId: string
): Promise<WorkoutSession | null> {
    const { data: sessionData, error: sessionError } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

    if (sessionError || !sessionData) return null;

    const { data: logsData, error: logsError } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('session_id', sessionId)
        .order('exercise_order');

    if (logsError) return null;

    // Reconstruct session from server data
    // This is a simplified reconstruction
    return {
        id: sessionData.id,
        user_id: sessionData.user_id,
        workout_id: sessionData.workout_id,
        workout_name: sessionData.workout_name || 'Treino',
        scheduled_date: sessionData.scheduled_date,
        status: sessionData.status,
        started_at: sessionData.started_at,
        completed_at: sessionData.completed_at,
        paused_at: null,
        total_pause_seconds: 0,
        exercises: (logsData || []).map((log: any) => ({
            id: log.id,
            exercise_id: log.exercise_id,
            exercise_name: log.exercise_name || 'Exercício',
            muscle_group: log.muscle_group || '',
            order: log.exercise_order,
            sets: log.sets_data || [],
            notes: log.notes,
            completed: true,
            skipped: false,
        })),
        total_volume_kg: sessionData.total_volume_kg || 0,
        total_sets_completed: sessionData.total_sets_completed || 0,
        total_reps_completed: sessionData.total_reps_completed || 0,
        actual_duration_minutes: sessionData.actual_duration_minutes,
        average_rpe: sessionData.average_rpe,
        synced: true,
        last_modified_at: sessionData.updated_at || sessionData.created_at,
        version: 1,
    };
}

// ============================================
// HELPERS
// ============================================

function isRetriableError(error: unknown): boolean {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();

        // Network errors are retriable
        if (message.includes('network') || message.includes('fetch')) {
            return true;
        }

        // Rate limiting is retriable
        if (message.includes('rate limit') || message.includes('429')) {
            return true;
        }

        // Server errors are retriable
        if (message.includes('500') || message.includes('502') || message.includes('503')) {
            return true;
        }
    }

    return false;
}

// ============================================
// AUTO-SYNC
// ============================================

let syncInterval: ReturnType<typeof setInterval> | null = null;

export function startAutoSync(intervalMs = 30000): void {
    if (syncInterval) return;

    // Sync when coming online
    window.addEventListener('online', () => {
        console.log('[Sync] Back online, syncing...');
        syncWorkoutSessions();
    });

    // Periodic sync
    syncInterval = setInterval(() => {
        if (navigator.onLine) {
            syncWorkoutSessions();
        }
    }, intervalMs);

    // Initial sync
    if (navigator.onLine) {
        syncWorkoutSessions();
    }
}

export function stopAutoSync(): void {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
    }
}

// ============================================
// EXPORTS
// ============================================

export {
    syncSingleSession,
};
