/**
 * YOUMOVE - Offline Workout Service
 * Enables full workout execution while offline
 */

import {
    getById,
    put,
    getAll,
    addToSyncQueue,
    STORES,
} from './offline-storage';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// TYPES
// ============================================

interface WorkoutSet {
    set_number: number;
    set_type: string;
    target_reps: number | null;
    target_weight_kg: number | null;
    actual_reps: number | null;
    actual_weight_kg: number | null;
    completed: boolean;
    skipped: boolean;
    rest_seconds: number;
}

interface WorkoutExercise {
    id: string;
    exercise_id: string;
    name: string;
    order: number;
    sets: WorkoutSet[];
}

interface WorkoutSession {
    id: string;
    user_id: string;
    workout_id: string | null;
    scheduled_date: string;
    name: string;
    exercises: WorkoutExercise[];
    status: 'scheduled' | 'in_progress' | 'completed' | 'skipped';
    started_at: string | null;
    completed_at: string | null;
    actual_duration_minutes: number | null;
    total_volume_kg: number;
    total_sets_completed: number;
    total_reps_completed: number;
}

interface WorkoutLog {
    id: string;
    user_id: string;
    session_id: string;
    exercise_id: string;
    exercise_order: number;
    sets: WorkoutSet[];
    total_volume_kg: number;
    total_reps: number;
    max_weight_kg: number | null;
    synced: boolean;
    created_at: string;
}

// ============================================
// SESSION MANAGEMENT
// ============================================

export async function startOfflineSession(
    session: Omit<WorkoutSession, 'started_at' | 'status'>
): Promise<WorkoutSession> {
    const activeSession: WorkoutSession = {
        ...session,
        status: 'in_progress',
        started_at: new Date().toISOString(),
    };

    await put(STORES.SESSIONS, activeSession);

    console.log('[Offline] Session started:', activeSession.id);
    return activeSession;
}

export async function getActiveSession(): Promise<WorkoutSession | null> {
    const sessions = await getAll<WorkoutSession>(STORES.SESSIONS);
    return sessions.find(s => s.status === 'in_progress') || null;
}

export async function updateSession(
    sessionId: string,
    updates: Partial<WorkoutSession>
): Promise<void> {
    const session = await getById<WorkoutSession>(STORES.SESSIONS, sessionId);
    if (!session) {
        throw new Error('Session not found');
    }

    const updated = { ...session, ...updates };
    await put(STORES.SESSIONS, updated);

    // Queue for sync
    await addToSyncQueue({
        type: 'session_update',
        action: 'update',
        data: { id: sessionId, ...updates },
    });
}

export async function completeSession(sessionId: string): Promise<void> {
    const session = await getById<WorkoutSession>(STORES.SESSIONS, sessionId);
    if (!session) {
        throw new Error('Session not found');
    }

    const completedAt = new Date().toISOString();
    const startedAt = new Date(session.started_at!);
    const duration = Math.round((new Date(completedAt).getTime() - startedAt.getTime()) / 60000);

    // Calculate totals from exercises
    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;

    session.exercises.forEach(ex => {
        ex.sets.forEach(set => {
            if (set.completed && set.actual_reps && set.actual_weight_kg) {
                totalVolume += set.actual_reps * set.actual_weight_kg;
                totalSets++;
                totalReps += set.actual_reps;
            }
        });
    });

    const updates: Partial<WorkoutSession> = {
        status: 'completed',
        completed_at: completedAt,
        actual_duration_minutes: duration,
        total_volume_kg: totalVolume,
        total_sets_completed: totalSets,
        total_reps_completed: totalReps,
    };

    await updateSession(sessionId, updates);
    console.log('[Offline] Session completed:', sessionId);
}

// ============================================
// SET LOGGING
// ============================================

export async function logSet(
    sessionId: string,
    exerciseId: string,
    exerciseOrder: number,
    set: WorkoutSet,
    userId: string
): Promise<void> {
    // Create or update workout log
    const logId = `${sessionId}_${exerciseId}`;
    let log = await getById<WorkoutLog>(STORES.WORKOUT_LOGS, logId);

    if (!log) {
        log = {
            id: logId,
            user_id: userId,
            session_id: sessionId,
            exercise_id: exerciseId,
            exercise_order: exerciseOrder,
            sets: [],
            total_volume_kg: 0,
            total_reps: 0,
            max_weight_kg: null,
            synced: false,
            created_at: new Date().toISOString(),
        };
    }

    // Update or add set
    const existingIndex = log.sets.findIndex(s => s.set_number === set.set_number);
    if (existingIndex >= 0) {
        log.sets[existingIndex] = set;
    } else {
        log.sets.push(set);
    }

    // Recalculate totals
    log.total_volume_kg = log.sets.reduce((acc, s) => {
        if (s.completed && s.actual_reps && s.actual_weight_kg) {
            return acc + (s.actual_reps * s.actual_weight_kg);
        }
        return acc;
    }, 0);

    log.total_reps = log.sets.reduce((acc, s) => {
        return acc + (s.actual_reps || 0);
    }, 0);

    log.max_weight_kg = Math.max(
        ...log.sets.filter(s => s.actual_weight_kg).map(s => s.actual_weight_kg!)
    ) || null;

    log.synced = false;

    await put(STORES.WORKOUT_LOGS, log);

    // Queue for sync
    await addToSyncQueue({
        type: 'workout_log',
        action: log.sets.length === 1 ? 'create' : 'update',
        data: log,
    });

    console.log('[Offline] Set logged:', set.set_number, 'for exercise:', exerciseId);
}

// ============================================
// EXERCISE CACHE
// ============================================

export async function cacheExercises(exercises: unknown[]): Promise<void> {
    const { getDB } = await import('./offline-storage');
    const db = await getDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.EXERCISES, 'readwrite');
        const store = tx.objectStore(STORES.EXERCISES);

        exercises.forEach(ex => store.put(ex));

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function getCachedExercise(id: string): Promise<unknown | null> {
    return getById(STORES.EXERCISES, id);
}

export async function getAllCachedExercises(): Promise<unknown[]> {
    return getAll(STORES.EXERCISES);
}

// ============================================
// WORKOUT CACHE
// ============================================

export async function cacheWorkouts(workouts: unknown[]): Promise<void> {
    const { getDB } = await import('./offline-storage');
    const db = await getDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.WORKOUTS, 'readwrite');
        const store = tx.objectStore(STORES.WORKOUTS);

        workouts.forEach(w => store.put(w));

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function getCachedWorkout(id: string): Promise<unknown | null> {
    return getById(STORES.WORKOUTS, id);
}

export async function getAllCachedWorkouts(): Promise<unknown[]> {
    return getAll(STORES.WORKOUTS);
}

// ============================================
// OFFLINE STATUS CHECK
// ============================================

export function isOfflineCapable(): boolean {
    return 'indexedDB' in window && 'serviceWorker' in navigator;
}

export async function getOfflineDataStatus(): Promise<{
    exercises: number;
    workouts: number;
    pendingLogs: number;
    pendingSync: number;
}> {
    const exercises = await getAll(STORES.EXERCISES);
    const workouts = await getAll(STORES.WORKOUTS);
    const logs = await getAll(STORES.WORKOUT_LOGS);
    const syncQueue = await getAll(STORES.SYNC_QUEUE);

    return {
        exercises: exercises.length,
        workouts: workouts.length,
        pendingLogs: logs.filter((l: any) => !l.synced).length,
        pendingSync: syncQueue.length,
    };
}
