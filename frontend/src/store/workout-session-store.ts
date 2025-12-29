/**
 * YOUMOVE - Workout Session Store (Zustand)
 * 
 * Reactive state management for workout execution.
 */

import { create } from 'zustand';
import {
    getActiveSession,
    startSession,
    pauseSession,
    resumeSession,
    completeSession,
    cancelSession,
    completeSet,
    skipSet,
    updateSet,
    skipExercise,
    recordSetRPE,
    recordSessionRPE,
    getSessionProgress,
    getCurrentExercise,
    getCurrentSet,
    getElapsedTime,
    type WorkoutSession,
    type SessionExercise,
    type SessionSet,
    type SetType,
} from '@/lib/workout-session';
import { syncWorkoutSessions } from '@/lib/workout-sync';

// ============================================
// TYPES
// ============================================

interface WorkoutSessionState {
    // Session data
    session: WorkoutSession | null;
    isActive: boolean;
    isPaused: boolean;

    // Current position
    currentExerciseIndex: number;
    currentSetIndex: number;

    // Timer
    elapsedSeconds: number;
    restTimeRemaining: number;
    isResting: boolean;

    // UI state
    showExitModal: boolean;
    showRPEModal: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    initSession: () => void;
    startNewSession: (params: StartSessionParams) => void;
    pause: () => void;
    resume: () => void;
    complete: (finalRPE?: number) => void;
    cancel: (reason?: string) => void;

    // Set actions
    logSet: (data: LogSetData) => void;
    skip: () => void;
    updateCurrentSet: (updates: Partial<LogSetData>) => void;

    // Exercise actions
    skipCurrentExercise: (reason?: string) => void;
    goToExercise: (index: number) => void;
    goToSet: (exerciseIndex: number, setIndex: number) => void;

    // Timer actions
    startRestTimer: (seconds: number) => void;
    skipRestTimer: () => void;
    tickTimer: () => void;

    // RPE
    setRPE: (rpe: number) => void;
    setSessionRPE: (rpe: number) => void;

    // UI
    setShowExitModal: (show: boolean) => void;
    setShowRPEModal: (show: boolean) => void;

    // Sync
    syncNow: () => Promise<void>;
}

interface StartSessionParams {
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
}

interface LogSetData {
    actual_reps: number;
    actual_weight_kg: number;
    rpe?: number;
    difficulty?: 'easy' | 'moderate' | 'hard';
    notes?: string;
}

// ============================================
// STORE
// ============================================

export const useWorkoutSessionStore = create<WorkoutSessionState>((set, get) => ({
    // Initial state
    session: null,
    isActive: false,
    isPaused: false,

    currentExerciseIndex: 0,
    currentSetIndex: 0,

    elapsedSeconds: 0,
    restTimeRemaining: 0,
    isResting: false,

    showExitModal: false,
    showRPEModal: false,
    isLoading: false,
    error: null,

    // ==========================================
    // SESSION ACTIONS
    // ==========================================

    initSession: () => {
        const session = getActiveSession();

        if (session) {
            // Find current position
            let exerciseIndex = 0;
            let setIndex = 0;

            for (let i = 0; i < session.exercises.length; i++) {
                const exercise = session.exercises[i];
                if (!exercise.completed && !exercise.skipped) {
                    exerciseIndex = i;
                    for (let j = 0; j < exercise.sets.length; j++) {
                        if (!exercise.sets[j].completed && !exercise.sets[j].skipped) {
                            setIndex = j;
                            break;
                        }
                    }
                    break;
                }
            }

            set({
                session,
                isActive: session.status === 'in_progress',
                isPaused: session.status === 'paused',
                currentExerciseIndex: exerciseIndex,
                currentSetIndex: setIndex,
                elapsedSeconds: getElapsedTime(session),
            });
        }
    },

    startNewSession: (params) => {
        const session = startSession(params);

        set({
            session,
            isActive: true,
            isPaused: false,
            currentExerciseIndex: 0,
            currentSetIndex: 0,
            elapsedSeconds: 0,
            restTimeRemaining: 0,
            isResting: false,
            error: null,
        });
    },

    pause: () => {
        const session = pauseSession();
        if (session) {
            set({ session, isPaused: true });
        }
    },

    resume: () => {
        const session = resumeSession();
        if (session) {
            set({ session, isPaused: false });
        }
    },

    complete: (finalRPE) => {
        // Show RPE modal if not provided
        if (finalRPE === undefined) {
            set({ showRPEModal: true });
            return;
        }

        const session = completeSession(finalRPE);
        if (session) {
            set({
                session,
                isActive: false,
                isPaused: false,
                showRPEModal: false,
            });

            // Trigger sync
            get().syncNow();
        }
    },

    cancel: (reason) => {
        const confirmed = get().showExitModal;

        if (!confirmed) {
            set({ showExitModal: true });
            return;
        }

        const session = cancelSession(reason);
        if (session) {
            set({
                session: null,
                isActive: false,
                isPaused: false,
                showExitModal: false,
            });
        }
    },

    // ==========================================
    // SET ACTIONS
    // ==========================================

    logSet: (data) => {
        const { session, currentExerciseIndex, currentSetIndex } = get();
        if (!session) return;

        const exercise = session.exercises[currentExerciseIndex];
        if (!exercise) return;

        const currentSet = exercise.sets[currentSetIndex];
        if (!currentSet) return;

        const updated = completeSet(exercise.id, currentSet.set_number, data);
        if (!updated) return;

        // Determine next position
        let nextExerciseIndex = currentExerciseIndex;
        let nextSetIndex = currentSetIndex + 1;

        // Check if exercise is done
        if (nextSetIndex >= exercise.sets.length) {
            nextSetIndex = 0;
            nextExerciseIndex++;

            // Check if workout is done
            if (nextExerciseIndex >= updated.exercises.length) {
                // All done - show RPE modal
                set({
                    session: updated,
                    showRPEModal: true,
                });
                return;
            }
        }

        // Start rest timer
        const restSeconds = currentSet.target_rest_seconds;

        set({
            session: updated,
            currentExerciseIndex: nextExerciseIndex,
            currentSetIndex: nextSetIndex,
            restTimeRemaining: restSeconds,
            isResting: restSeconds > 0,
        });
    },

    skip: () => {
        const { session, currentExerciseIndex, currentSetIndex } = get();
        if (!session) return;

        const exercise = session.exercises[currentExerciseIndex];
        if (!exercise) return;

        const currentSet = exercise.sets[currentSetIndex];
        if (!currentSet) return;

        const updated = skipSet(exercise.id, currentSet.set_number);
        if (!updated) return;

        // Move to next set
        let nextSetIndex = currentSetIndex + 1;
        let nextExerciseIndex = currentExerciseIndex;

        if (nextSetIndex >= exercise.sets.length) {
            nextSetIndex = 0;
            nextExerciseIndex++;
        }

        set({
            session: updated,
            currentExerciseIndex: nextExerciseIndex,
            currentSetIndex: nextSetIndex,
        });
    },

    updateCurrentSet: (updates) => {
        const { session, currentExerciseIndex, currentSetIndex } = get();
        if (!session) return;

        const exercise = session.exercises[currentExerciseIndex];
        if (!exercise) return;

        const currentSet = exercise.sets[currentSetIndex];
        if (!currentSet) return;

        const updated = updateSet(exercise.id, currentSet.set_number, updates);
        if (updated) {
            set({ session: updated });
        }
    },

    // ==========================================
    // EXERCISE ACTIONS
    // ==========================================

    skipCurrentExercise: (reason) => {
        const { session, currentExerciseIndex } = get();
        if (!session) return;

        const exercise = session.exercises[currentExerciseIndex];
        if (!exercise) return;

        const updated = skipExercise(exercise.id, reason);
        if (!updated) return;

        set({
            session: updated,
            currentExerciseIndex: currentExerciseIndex + 1,
            currentSetIndex: 0,
        });
    },

    goToExercise: (index) => {
        const { session } = get();
        if (!session) return;

        if (index >= 0 && index < session.exercises.length) {
            set({
                currentExerciseIndex: index,
                currentSetIndex: 0,
                isResting: false,
                restTimeRemaining: 0,
            });
        }
    },

    goToSet: (exerciseIndex, setIndex) => {
        const { session } = get();
        if (!session) return;

        const exercise = session.exercises[exerciseIndex];
        if (!exercise) return;

        if (setIndex >= 0 && setIndex < exercise.sets.length) {
            set({
                currentExerciseIndex: exerciseIndex,
                currentSetIndex: setIndex,
                isResting: false,
                restTimeRemaining: 0,
            });
        }
    },

    // ==========================================
    // TIMER ACTIONS
    // ==========================================

    startRestTimer: (seconds) => {
        set({
            restTimeRemaining: seconds,
            isResting: true,
        });
    },

    skipRestTimer: () => {
        set({
            restTimeRemaining: 0,
            isResting: false,
        });
    },

    tickTimer: () => {
        const { isActive, isPaused, restTimeRemaining, isResting } = get();

        if (!isActive || isPaused) return;

        // Increment elapsed time
        set(state => ({ elapsedSeconds: state.elapsedSeconds + 1 }));

        // Decrement rest timer
        if (isResting && restTimeRemaining > 0) {
            const newRemaining = restTimeRemaining - 1;
            set({
                restTimeRemaining: newRemaining,
                isResting: newRemaining > 0,
            });
        }
    },

    // ==========================================
    // RPE
    // ==========================================

    setRPE: (rpe) => {
        const { session, currentExerciseIndex, currentSetIndex } = get();
        if (!session) return;

        const exercise = session.exercises[currentExerciseIndex];
        if (!exercise) return;

        const currentSet = exercise.sets[currentSetIndex];
        if (!currentSet) return;

        const updated = recordSetRPE(exercise.id, currentSet.set_number, rpe);
        if (updated) {
            set({ session: updated });
        }
    },

    setSessionRPE: (rpe) => {
        const { session } = get();
        if (!session) return;

        const updated = recordSessionRPE(rpe);
        if (updated) {
            set({ session: updated });
        }

        // If session was waiting for RPE to complete
        if (getSessionProgress(session) >= 100) {
            get().complete(rpe);
        }
    },

    // ==========================================
    // UI
    // ==========================================

    setShowExitModal: (show) => {
        set({ showExitModal: show });
    },

    setShowRPEModal: (show) => {
        set({ showRPEModal: show });
    },

    // ==========================================
    // SYNC
    // ==========================================

    syncNow: async () => {
        set({ isLoading: true });

        try {
            await syncWorkoutSessions();
            set({ isLoading: false, error: null });
        } catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Sync failed'
            });
        }
    },
}));

// ============================================
// TIMER HOOK
// ============================================

export function useWorkoutTimer() {
    const { isActive, isPaused, tickTimer } = useWorkoutSessionStore();

    // This should be called with useEffect in a component
    // that starts an interval when isActive && !isPaused

    return {
        isActive,
        isPaused,
        tick: tickTimer,
    };
}

// ============================================
// SELECTORS (for performance)
// ============================================

export const selectSession = (state: WorkoutSessionState) => state.session;
export const selectCurrentExercise = (state: WorkoutSessionState) => {
    if (!state.session) return null;
    return state.session.exercises[state.currentExerciseIndex] || null;
};
export const selectCurrentSet = (state: WorkoutSessionState) => {
    const exercise = selectCurrentExercise(state);
    if (!exercise) return null;
    return exercise.sets[state.currentSetIndex] || null;
};
export const selectProgress = (state: WorkoutSessionState) => {
    if (!state.session) return 0;
    return getSessionProgress(state.session);
};
export const selectIsResting = (state: WorkoutSessionState) => state.isResting;
export const selectRestTime = (state: WorkoutSessionState) => state.restTimeRemaining;
