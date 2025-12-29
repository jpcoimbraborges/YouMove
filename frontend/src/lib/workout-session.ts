/**
 * YOUMOVE - Workout Session Service
 * 
 * Complete workout execution flow with:
 * - Session management
 * - Set/rep/weight logging
 * - RPE tracking
 * - Offline-first storage
 * - Sync queue
 * - Zero data loss guarantee
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================
// MUSCLE GROUP MAPPING
// Maps frontend values to Supabase enum values
// Valid DB enums: chest, back, shoulders, biceps, triceps, forearms,
//                 core, quadriceps, hamstrings, glutes, calves, hip_flexors, full_body
// ============================================
function mapMuscleGroup(muscle: string): string {
    const mapping: Record<string, string> = {
        // Direct mappings
        'chest': 'chest',
        'back': 'back',
        'shoulders': 'shoulders',
        'biceps': 'biceps',
        'triceps': 'triceps',
        'forearms': 'forearms',
        'core': 'core',
        'abs': 'core',
        'abdomen': 'core',
        'quadriceps': 'quadriceps',
        'hamstrings': 'hamstrings',
        'glutes': 'glutes',
        'calves': 'calves',
        'hip_flexors': 'hip_flexors',
        'full_body': 'full_body',

        // Frontend to DB mappings
        'legs': 'quadriceps',      // 'legs' -> 'quadriceps'
        'pernas': 'quadriceps',
        'peito': 'chest',
        'costas': 'back',
        'ombros': 'shoulders',
        'braços': 'biceps',
        'bracos': 'biceps',
        'arms': 'biceps',
        'general': 'full_body',
        'geral': 'full_body',
    };

    const normalized = muscle.toLowerCase().trim();
    return mapping[normalized] || 'full_body'; // Default to full_body if unknown
}


// ============================================
// TYPES
// ============================================

export interface WorkoutSession {
    id: string;
    user_id: string;
    workout_id: string | null;
    workout_name: string;
    scheduled_date: string;
    status: SessionStatus;

    // Timing
    started_at: string | null;
    completed_at: string | null;
    paused_at: string | null;
    total_pause_seconds: number;

    // Content
    exercises: SessionExercise[];

    // Metrics (calculated)
    total_volume_kg: number;
    total_sets_completed: number;
    total_reps_completed: number;
    actual_duration_minutes: number | null;
    average_rpe: number | null;

    // Sync
    synced: boolean;
    last_modified_at: string;
    version: number;
}

export type SessionStatus =
    | 'scheduled'
    | 'in_progress'
    | 'paused'
    | 'completed'
    | 'cancelled';

export interface SessionExercise {
    id: string;
    exercise_id: string;
    exercise_name: string;
    muscle_group: string;
    order: number;
    sets: SessionSet[];
    notes: string | null;
    completed: boolean;
    skipped: boolean;
}

export interface SessionSet {
    id: string;
    set_number: number;
    set_type: SetType;

    // Targets (from plan)
    target_reps: number | null;
    target_weight_kg: number | null;
    target_rest_seconds: number;

    // Actuals (user input)
    actual_reps: number | null;
    actual_weight_kg: number | null;
    actual_rest_seconds: number | null;

    // Feedback
    rpe: number | null; // 1-10
    difficulty: 'easy' | 'moderate' | 'hard' | null;
    notes: string | null;

    // Timing
    started_at: string | null;
    completed_at: string | null;

    // Status
    completed: boolean;
    skipped: boolean;
}

export type SetType = 'warmup' | 'working' | 'drop' | 'failure' | 'backoff';

// ============================================
// SESSION EVENTS (for undo/redo)
// ============================================

export interface SessionEvent {
    id: string;
    timestamp: string;
    type: SessionEventType;
    data: unknown;
}

export type SessionEventType =
    | 'session_started'
    | 'session_paused'
    | 'session_resumed'
    | 'session_completed'
    | 'session_cancelled'
    | 'set_started'
    | 'set_completed'
    | 'set_skipped'
    | 'set_updated'
    | 'exercise_completed'
    | 'exercise_skipped'
    | 'rpe_recorded'
    | 'note_added';

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
    ACTIVE_SESSION: 'youmove_active_session',
    SESSION_EVENTS: 'youmove_session_events',
    PENDING_SYNC: 'youmove_pending_sync',
    SESSION_BACKUP: 'youmove_session_backup',
};

// ============================================
// ACTIVE SESSION MANAGEMENT
// ============================================

/**
 * Get the current active session (if any)
 */
export function getActiveSession(): WorkoutSession | null {
    if (typeof window === 'undefined') return null;

    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    if (!stored) return null;

    try {
        return JSON.parse(stored);
    } catch {
        return null;
    }
}

/**
 * Save session to local storage with backup
 */
export function saveSession(session: WorkoutSession): void {
    if (typeof window === 'undefined') return;

    // Update metadata
    session.last_modified_at = new Date().toISOString();
    session.version += 1;
    session.synced = false;

    // Recalculate metrics
    session.total_volume_kg = calculateTotalVolume(session);
    session.total_sets_completed = countCompletedSets(session);
    session.total_reps_completed = countTotalReps(session);
    session.average_rpe = calculateAverageRPE(session);

    // Save with backup
    const backup = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    if (backup) {
        localStorage.setItem(STORAGE_KEYS.SESSION_BACKUP, backup);
    }

    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));

    // Record event for sync
    addToPendingSync(session);
}

/**
 * Clear active session
 */
export function clearActiveSession(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    localStorage.removeItem(STORAGE_KEYS.SESSION_EVENTS);
}

/**
 * Restore from backup if main session is corrupted
 */
export function restoreFromBackup(): WorkoutSession | null {
    if (typeof window === 'undefined') return null;

    const backup = localStorage.getItem(STORAGE_KEYS.SESSION_BACKUP);
    if (!backup) return null;

    try {
        const session = JSON.parse(backup);
        localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, backup);
        return session;
    } catch {
        return null;
    }
}

// ============================================
// SESSION LIFECYCLE
// ============================================

/**
 * Start a new workout session
 */
export function startSession(params: {
    user_id: string;
    workout_id?: string;
    workout_name: string;
    exercises: Array<{
        exercise_id: string;
        exercise_name: string;
        muscle_group: string;
        sets: Array<{
            set_type: SetType;
            target_reps: number | null;
            target_weight_kg: number | null;
            target_rest_seconds: number;
        }>;
    }>;
}): WorkoutSession {
    const now = new Date().toISOString();

    const session: WorkoutSession = {
        id: uuidv4(),
        user_id: params.user_id,
        workout_id: params.workout_id || null,
        workout_name: params.workout_name,
        scheduled_date: now.split('T')[0],
        status: 'in_progress',

        started_at: now,
        completed_at: null,
        paused_at: null,
        total_pause_seconds: 0,

        exercises: params.exercises.map((ex, i) => ({
            id: uuidv4(),
            exercise_id: ex.exercise_id,
            exercise_name: ex.exercise_name,
            muscle_group: mapMuscleGroup(ex.muscle_group || 'full_body'),
            order: i + 1,
            sets: ex.sets.map((set, j) => ({
                id: uuidv4(),
                set_number: j + 1,
                set_type: set.set_type,
                target_reps: set.target_reps,
                target_weight_kg: set.target_weight_kg,
                target_rest_seconds: set.target_rest_seconds,
                actual_reps: null,
                actual_weight_kg: set.target_weight_kg, // Pre-fill with target
                actual_rest_seconds: null,
                rpe: null,
                difficulty: null,
                notes: null,
                started_at: null,
                completed_at: null,
                completed: false,
                skipped: false,
            })),
            notes: null,
            completed: false,
            skipped: false,
        })),

        total_volume_kg: 0,
        total_sets_completed: 0,
        total_reps_completed: 0,
        actual_duration_minutes: null,
        average_rpe: null,

        synced: false,
        last_modified_at: now,
        version: 1,
    };

    // Save and log event
    saveSession(session);
    logEvent('session_started', { session_id: session.id });

    return session;
}

/**
 * Pause the current session
 */
export function pauseSession(): WorkoutSession | null {
    const session = getActiveSession();
    if (!session || session.status !== 'in_progress') return null;

    session.status = 'paused';
    session.paused_at = new Date().toISOString();

    saveSession(session);
    logEvent('session_paused', { session_id: session.id });

    return session;
}

/**
 * Resume a paused session
 */
export function resumeSession(): WorkoutSession | null {
    const session = getActiveSession();
    if (!session || session.status !== 'paused') return null;

    // Calculate pause duration
    if (session.paused_at) {
        const pauseStart = new Date(session.paused_at).getTime();
        const pauseEnd = Date.now();
        session.total_pause_seconds += Math.floor((pauseEnd - pauseStart) / 1000);
    }

    session.status = 'in_progress';
    session.paused_at = null;

    saveSession(session);
    logEvent('session_resumed', { session_id: session.id });

    return session;
}

/**
 * Complete the session
 */
export function completeSession(finalRPE?: number): WorkoutSession | null {
    const session = getActiveSession();
    if (!session) return null;

    const now = new Date().toISOString();

    session.status = 'completed';
    session.completed_at = now;

    // Calculate duration
    if (session.started_at) {
        const start = new Date(session.started_at).getTime();
        const end = new Date(now).getTime();
        const totalSeconds = Math.floor((end - start) / 1000) - session.total_pause_seconds;
        session.actual_duration_minutes = Math.round(totalSeconds / 60);
    }

    // Set overall RPE if provided
    if (finalRPE !== undefined) {
        // We could store this separately or use it as override
        session.average_rpe = finalRPE;
    }

    saveSession(session);
    logEvent('session_completed', {
        session_id: session.id,
        duration: session.actual_duration_minutes,
        volume: session.total_volume_kg,
    });

    // Clear active session (but keep in pending sync)
    clearActiveSession();

    return session;
}

/**
 * Cancel the session
 */
export function cancelSession(reason?: string): WorkoutSession | null {
    const session = getActiveSession();
    if (!session) return null;

    session.status = 'cancelled';
    session.completed_at = new Date().toISOString();

    saveSession(session);
    logEvent('session_cancelled', { session_id: session.id, reason });

    clearActiveSession();

    return session;
}

// ============================================
// SET OPERATIONS
// ============================================

/**
 * Start a set (for timing)
 */
export function startSet(
    exerciseId: string,
    setNumber: number
): WorkoutSession | null {
    const session = getActiveSession();
    if (!session) return null;

    const exercise = session.exercises.find(e => e.id === exerciseId);
    if (!exercise) return null;

    const set = exercise.sets.find(s => s.set_number === setNumber);
    if (!set) return null;

    set.started_at = new Date().toISOString();

    saveSession(session);
    logEvent('set_started', { exercise_id: exerciseId, set_number: setNumber });

    return session;
}

/**
 * Complete a set with data
 */
export function completeSet(
    exerciseId: string,
    setNumber: number,
    data: {
        actual_reps: number;
        actual_weight_kg: number;
        rpe?: number;
        difficulty?: 'easy' | 'moderate' | 'hard';
        notes?: string;
    }
): WorkoutSession | null {
    const session = getActiveSession();
    if (!session) return null;

    const exercise = session.exercises.find(e => e.id === exerciseId);
    if (!exercise) return null;

    const set = exercise.sets.find(s => s.set_number === setNumber);
    if (!set) return null;

    // Update set data
    set.actual_reps = data.actual_reps;
    set.actual_weight_kg = data.actual_weight_kg;
    set.rpe = data.rpe || null;
    set.difficulty = data.difficulty || null;
    set.notes = data.notes || null;
    set.completed_at = new Date().toISOString();
    set.completed = true;
    set.skipped = false;

    // Calculate rest time if started
    if (set.started_at) {
        const start = new Date(set.started_at).getTime();
        const end = new Date(set.completed_at).getTime();
        set.actual_rest_seconds = Math.floor((end - start) / 1000);
    }

    // Check if exercise is complete
    const allSetsComplete = exercise.sets.every(s => s.completed || s.skipped);
    if (allSetsComplete) {
        exercise.completed = true;
        logEvent('exercise_completed', { exercise_id: exerciseId });
    }

    // saveSession handles recalculating totals (volume, sets, reps, RPE)
    saveSession(session);

    logEvent('set_completed', {
        exercise_id: exerciseId,
        set_number: setNumber,
        reps: data.actual_reps,
        weight: data.actual_weight_kg,
        rpe: data.rpe,
    });

    return session;
}

/**
 * Skip a set
 */
export function skipSet(
    exerciseId: string,
    setNumber: number,
    reason?: string
): WorkoutSession | null {
    const session = getActiveSession();
    if (!session) return null;

    const exercise = session.exercises.find(e => e.id === exerciseId);
    if (!exercise) return null;

    const set = exercise.sets.find(s => s.set_number === setNumber);
    if (!set) return null;

    set.skipped = true;
    set.completed = false;
    set.notes = reason || 'Pulado';

    saveSession(session);
    logEvent('set_skipped', { exercise_id: exerciseId, set_number: setNumber, reason });

    return session;
}

/**
 * Update a completed set
 */
export function updateSet(
    exerciseId: string,
    setNumber: number,
    updates: Partial<{
        actual_reps: number;
        actual_weight_kg: number;
        rpe: number;
        notes: string;
    }>
): WorkoutSession | null {
    const session = getActiveSession();
    if (!session) return null;

    const exercise = session.exercises.find(e => e.id === exerciseId);
    if (!exercise) return null;

    const set = exercise.sets.find(s => s.set_number === setNumber);
    if (!set) return null;

    if (updates.actual_reps !== undefined) set.actual_reps = updates.actual_reps;
    if (updates.actual_weight_kg !== undefined) set.actual_weight_kg = updates.actual_weight_kg;
    if (updates.rpe !== undefined) set.rpe = updates.rpe;
    if (updates.notes !== undefined) set.notes = updates.notes;

    saveSession(session);
    logEvent('set_updated', { exercise_id: exerciseId, set_number: setNumber, updates });

    return session;
}

/**
 * Skip entire exercise
 */
export function skipExercise(exerciseId: string, reason?: string): WorkoutSession | null {
    const session = getActiveSession();
    if (!session) return null;

    const exercise = session.exercises.find(e => e.id === exerciseId);
    if (!exercise) return null;

    exercise.skipped = true;
    exercise.completed = false;
    exercise.notes = reason || 'Exercício pulado';
    exercise.sets.forEach(s => {
        s.skipped = true;
        s.completed = false;
    });

    saveSession(session);
    logEvent('exercise_skipped', { exercise_id: exerciseId, reason });

    return session;
}

// ============================================
// RPE RECORDING
// ============================================

/**
 * Record RPE for a set
 */
export function recordSetRPE(
    exerciseId: string,
    setNumber: number,
    rpe: number
): WorkoutSession | null {
    if (rpe < 1 || rpe > 10) return null;

    return updateSet(exerciseId, setNumber, { rpe });
}

/**
 * Record overall session RPE
 */
export function recordSessionRPE(rpe: number): WorkoutSession | null {
    if (rpe < 1 || rpe > 10) return null;

    const session = getActiveSession();
    if (!session) return null;

    session.average_rpe = rpe;

    saveSession(session);
    logEvent('rpe_recorded', { session_id: session.id, rpe });

    return session;
}

// ============================================
// CALCULATIONS
// ============================================

function calculateTotalVolume(session: WorkoutSession): number {
    return session.exercises.reduce((total, ex) => {
        return total + ex.sets.reduce((setTotal, set) => {
            if (set.completed && !set.skipped && set.actual_reps) {
                // Use actual weight, or target weight as fallback, or 0 if bodyweight exercise
                const weight = set.actual_weight_kg ?? set.target_weight_kg ?? 0;
                return setTotal + (set.actual_reps * weight);
            }
            return setTotal;
        }, 0);
    }, 0);
}

function countCompletedSets(session: WorkoutSession): number {
    return session.exercises.reduce((total, ex) => {
        return total + ex.sets.filter(s => s.completed).length;
    }, 0);
}

function countTotalReps(session: WorkoutSession): number {
    return session.exercises.reduce((total, ex) => {
        return total + ex.sets.reduce((setTotal, set) => {
            // Only count reps from completed sets
            if (set.completed && !set.skipped) {
                return setTotal + (set.actual_reps || 0);
            }
            return setTotal;
        }, 0);
    }, 0);
}

function calculateAverageRPE(session: WorkoutSession): number | null {
    const rpeValues: number[] = [];

    session.exercises.forEach(ex => {
        ex.sets.forEach(set => {
            if (set.rpe !== null) {
                rpeValues.push(set.rpe);
            }
        });
    });

    if (rpeValues.length === 0) return null;

    return Math.round(
        (rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length) * 10
    ) / 10;
}

// ============================================
// EVENT LOGGING
// ============================================

function logEvent(type: SessionEventType, data: unknown): void {
    if (typeof window === 'undefined') return;

    const events = getSessionEvents();

    events.push({
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        type,
        data,
    });

    // Keep last 100 events
    const trimmed = events.slice(-100);
    localStorage.setItem(STORAGE_KEYS.SESSION_EVENTS, JSON.stringify(trimmed));
}

function getSessionEvents(): SessionEvent[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(STORAGE_KEYS.SESSION_EVENTS);
    if (!stored) return [];

    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

// ============================================
// SYNC QUEUE
// ============================================

interface PendingSyncItem {
    id: string;
    session_id: string;
    session_data: WorkoutSession;
    queued_at: string;
    attempts: number;
    last_attempt: string | null;
    error: string | null;
}

function addToPendingSync(session: WorkoutSession): void {
    if (typeof window === 'undefined') return;

    const pending = getPendingSync();

    // Update or add
    const existingIndex = pending.findIndex(p => p.session_id === session.id);

    const item: PendingSyncItem = {
        id: existingIndex >= 0 ? pending[existingIndex].id : uuidv4(),
        session_id: session.id,
        session_data: session,
        queued_at: existingIndex >= 0 ? pending[existingIndex].queued_at : new Date().toISOString(),
        attempts: existingIndex >= 0 ? pending[existingIndex].attempts : 0,
        last_attempt: null,
        error: null,
    };

    if (existingIndex >= 0) {
        pending[existingIndex] = item;
    } else {
        pending.push(item);
    }

    localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(pending));
}

export function getPendingSync(): PendingSyncItem[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(STORAGE_KEYS.PENDING_SYNC);
    if (!stored) return [];

    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

export function removePendingSync(sessionId: string): void {
    if (typeof window === 'undefined') return;

    const pending = getPendingSync().filter(p => p.session_id !== sessionId);
    localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(pending));
}

export function updatePendingSyncStatus(
    sessionId: string,
    error?: string
): void {
    if (typeof window === 'undefined') return;

    const pending = getPendingSync();
    const item = pending.find(p => p.session_id === sessionId);

    if (item) {
        item.attempts++;
        item.last_attempt = new Date().toISOString();
        item.error = error || null;

        localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(pending));
    }
}

// ============================================
// UTILITIES
// ============================================

/**
 * Get session progress percentage
 */
export function getSessionProgress(session: WorkoutSession): number {
    const totalSets = session.exercises.reduce((t, e) => t + e.sets.length, 0);
    const completedSets = session.exercises.reduce(
        (t, e) => t + e.sets.filter(s => s.completed || s.skipped).length,
        0
    );

    if (totalSets === 0) return 0;
    return Math.round((completedSets / totalSets) * 100);
}

/**
 * Get current exercise (first incomplete)
 */
export function getCurrentExercise(session: WorkoutSession): SessionExercise | null {
    return session.exercises.find(e => !e.completed && !e.skipped) || null;
}

/**
 * Get current set (first incomplete in current exercise)
 */
export function getCurrentSet(session: WorkoutSession): {
    exercise: SessionExercise;
    set: SessionSet;
} | null {
    const exercise = getCurrentExercise(session);
    if (!exercise) return null;

    const set = exercise.sets.find(s => !s.completed && !s.skipped);
    if (!set) return null;

    return { exercise, set };
}

/**
 * Check if session has unsaved changes
 */
export function hasUnsavedChanges(): boolean {
    const session = getActiveSession();
    return session !== null && !session.synced;
}

/**
 * Get elapsed time in seconds
 */
export function getElapsedTime(session: WorkoutSession): number {
    if (!session.started_at) return 0;

    const start = new Date(session.started_at).getTime();
    const now = session.paused_at
        ? new Date(session.paused_at).getTime()
        : Date.now();

    return Math.floor((now - start) / 1000) - session.total_pause_seconds;
}

/**
 * Format seconds as MM:SS or HH:MM:SS
 */
export function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    return `${m}:${s.toString().padStart(2, '0')}`;
}
