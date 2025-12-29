'use client';

/**
 * YOUMOVE - Workout Session Hook
 * 
 * High-level hook for workout execution UI.
 */

import { useEffect, useCallback, useRef } from 'react';
import {
    useWorkoutSessionStore,
    selectSession,
    selectCurrentExercise,
    selectCurrentSet,
    selectProgress,
} from '@/store/workout-session-store';
import { formatTime } from '@/lib/workout-session';
import { startAutoSync, stopAutoSync } from '@/lib/workout-sync';

export function useWorkoutSession() {
    const store = useWorkoutSessionStore();
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Selectors
    const session = useWorkoutSessionStore(selectSession);
    const currentExercise = useWorkoutSessionStore(selectCurrentExercise);
    const currentSet = useWorkoutSessionStore(selectCurrentSet);
    const progress = useWorkoutSessionStore(selectProgress);

    // Initialize on mount
    useEffect(() => {
        store.initSession();
        startAutoSync();

        return () => {
            stopAutoSync();
        };
    }, []);

    // Timer interval
    useEffect(() => {
        if (store.isActive && !store.isPaused) {
            intervalRef.current = setInterval(() => {
                store.tickTimer();
            }, 1000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [store.isActive, store.isPaused]);

    // Vibrate on rest complete
    useEffect(() => {
        if (store.restTimeRemaining === 0 && !store.isResting) {
            // Rest complete - notify user
            if ('vibrate' in navigator) {
                navigator.vibrate([200, 100, 200]);
            }
        }
    }, [store.isResting, store.restTimeRemaining]);

    // Computed values
    const formattedTime = formatTime(store.elapsedSeconds);
    const formattedRestTime = formatTime(store.restTimeRemaining);

    const isLastSet = currentExercise
        ? store.currentSetIndex === currentExercise.sets.length - 1
        : false;

    const isLastExercise = session
        ? store.currentExerciseIndex === session.exercises.length - 1
        : false;

    const canComplete = session
        ? session.exercises.every(e => e.completed || e.skipped)
        : false;

    // Actions with haptic feedback
    const logSet = useCallback((data: {
        actual_reps: number;
        actual_weight_kg: number;
        rpe?: number;
        difficulty?: 'easy' | 'moderate' | 'hard';
    }) => {
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
        store.logSet(data);
    }, [store]);

    const skipSet = useCallback(() => {
        if ('vibrate' in navigator) {
            navigator.vibrate([30, 30]);
        }
        store.skip();
    }, [store]);

    const adjustWeight = useCallback((delta: number) => {
        if (!currentSet) return;

        const newWeight = (currentSet.actual_weight_kg || currentSet.target_weight_kg || 0) + delta;
        if (newWeight >= 0) {
            store.updateCurrentSet({ actual_weight_kg: newWeight });
        }
    }, [currentSet, store]);

    const adjustReps = useCallback((delta: number) => {
        if (!currentSet) return;

        const newReps = (currentSet.actual_reps || currentSet.target_reps || 0) + delta;
        if (newReps >= 0) {
            store.updateCurrentSet({ actual_reps: newReps });
        }
    }, [currentSet, store]);

    return {
        // State
        session,
        isActive: store.isActive,
        isPaused: store.isPaused,
        isResting: store.isResting,
        isLoading: store.isLoading,
        error: store.error,

        // Current position
        currentExercise,
        currentExerciseIndex: store.currentExerciseIndex,
        currentSet,
        currentSetIndex: store.currentSetIndex,

        // Progress
        progress,
        isLastSet,
        isLastExercise,
        canComplete,

        // Time
        elapsedSeconds: store.elapsedSeconds,
        formattedTime,
        restTimeRemaining: store.restTimeRemaining,
        formattedRestTime,

        // Modals
        showExitModal: store.showExitModal,
        showRPEModal: store.showRPEModal,

        // Session actions
        startSession: store.startNewSession,
        pause: store.pause,
        resume: store.resume,
        complete: store.complete,
        cancel: store.cancel,

        // Set actions
        logSet,
        skipSet,
        adjustWeight,
        adjustReps,

        // Exercise actions
        skipExercise: store.skipCurrentExercise,
        goToExercise: store.goToExercise,
        goToSet: store.goToSet,

        // Timer actions
        skipRest: store.skipRestTimer,

        // RPE
        setRPE: store.setRPE,
        setSessionRPE: store.setSessionRPE,

        // UI actions
        setShowExitModal: store.setShowExitModal,
        setShowRPEModal: store.setShowRPEModal,

        // Sync
        syncNow: store.syncNow,
    };
}

// ============================================
// MINI HOOKS
// ============================================

export function useRestTimer() {
    const isResting = useWorkoutSessionStore(s => s.isResting);
    const remaining = useWorkoutSessionStore(s => s.restTimeRemaining);
    const skip = useWorkoutSessionStore(s => s.skipRestTimer);

    return {
        isResting,
        remaining,
        formatted: formatTime(remaining),
        progress: remaining > 0 ? 100 : 0,
        skip,
    };
}

export function useSessionProgress() {
    const session = useWorkoutSessionStore(selectSession);
    const progress = useWorkoutSessionStore(selectProgress);

    if (!session) {
        return { progress: 0, completed: 0, total: 0 };
    }

    const total = session.exercises.reduce((t, e) => t + e.sets.length, 0);
    const completed = session.exercises.reduce(
        (t, e) => t + e.sets.filter(s => s.completed).length,
        0
    );

    return { progress, completed, total };
}

export function useWorkoutMetrics() {
    const session = useWorkoutSessionStore(selectSession);

    if (!session) {
        return {
            volume: 0,
            sets: 0,
            reps: 0,
            avgRPE: null,
        };
    }

    return {
        volume: session.total_volume_kg,
        sets: session.total_sets_completed,
        reps: session.total_reps_completed,
        avgRPE: session.average_rpe,
    };
}
