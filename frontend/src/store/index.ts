'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// AUTH STORE
// ============================================

interface User {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
}

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isLoading: true,
            isAuthenticated: false,
            setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
            setLoading: (isLoading) => set({ isLoading }),
            logout: () => set({ user: null, isAuthenticated: false }),
        }),
        { name: 'youmove-auth' }
    )
);

// ============================================
// APP STATE STORE
// ============================================

interface AppState {
    isOnline: boolean;
    isOfflineBannerVisible: boolean;
    setOnline: (online: boolean) => void;
    showOfflineBanner: () => void;
    hideOfflineBanner: () => void;
}

export const useAppStore = create<AppState>()((set) => ({
    isOnline: true,
    isOfflineBannerVisible: false,
    setOnline: (isOnline) => set({ isOnline, isOfflineBannerVisible: !isOnline }),
    showOfflineBanner: () => set({ isOfflineBannerVisible: true }),
    hideOfflineBanner: () => set({ isOfflineBannerVisible: false }),
}));

// ============================================
// WORKOUT SESSION STORE
// ============================================

interface WorkoutSet {
    set_number: number;
    target_reps: number | null;
    target_weight_kg: number | null;
    actual_reps: number | null;
    actual_weight_kg: number | null;
    completed: boolean;
    rest_seconds: number;
}

interface WorkoutExercise {
    id: string;
    exercise_id: string;
    name: string;
    sets: WorkoutSet[];
}

interface ActiveWorkout {
    session_id: string;
    name: string;
    exercises: WorkoutExercise[];
    current_exercise_index: number;
    current_set_index: number;
    started_at: string;
    is_resting: boolean;
    rest_time_remaining: number;
}

interface WorkoutState {
    activeWorkout: ActiveWorkout | null;
    startWorkout: (session: Omit<ActiveWorkout, 'current_exercise_index' | 'current_set_index' | 'started_at' | 'is_resting' | 'rest_time_remaining'>) => void;
    completeSet: (reps: number, weight: number) => void;
    skipSet: () => void;
    nextExercise: () => void;
    previousExercise: () => void;
    startRest: (seconds: number) => void;
    updateRestTime: (seconds: number) => void;
    endRest: () => void;
    endWorkout: () => void;
}

export const useWorkoutStore = create<WorkoutState>()(
    persist(
        (set, get) => ({
            activeWorkout: null,

            startWorkout: (session) => set({
                activeWorkout: {
                    ...session,
                    current_exercise_index: 0,
                    current_set_index: 0,
                    started_at: new Date().toISOString(),
                    is_resting: false,
                    rest_time_remaining: 0,
                },
            }),

            completeSet: (reps, weight) => {
                const { activeWorkout } = get();
                if (!activeWorkout) return;

                const exercises = [...activeWorkout.exercises];
                const currentExercise = exercises[activeWorkout.current_exercise_index];
                const currentSet = currentExercise.sets[activeWorkout.current_set_index];

                currentSet.actual_reps = reps;
                currentSet.actual_weight_kg = weight;
                currentSet.completed = true;

                const isLastSet = activeWorkout.current_set_index >= currentExercise.sets.length - 1;
                const isLastExercise = activeWorkout.current_exercise_index >= exercises.length - 1;

                if (isLastSet && isLastExercise) {
                    // Workout complete
                    set({ activeWorkout: { ...activeWorkout, exercises } });
                } else if (isLastSet) {
                    // Move to next exercise
                    set({
                        activeWorkout: {
                            ...activeWorkout,
                            exercises,
                            current_exercise_index: activeWorkout.current_exercise_index + 1,
                            current_set_index: 0,
                        },
                    });
                } else {
                    // Move to next set
                    set({
                        activeWorkout: {
                            ...activeWorkout,
                            exercises,
                            current_set_index: activeWorkout.current_set_index + 1,
                            is_resting: true,
                            rest_time_remaining: currentSet.rest_seconds,
                        },
                    });
                }
            },

            skipSet: () => {
                const { activeWorkout } = get();
                if (!activeWorkout) return;

                const exercises = [...activeWorkout.exercises];
                const currentExercise = exercises[activeWorkout.current_exercise_index];

                const isLastSet = activeWorkout.current_set_index >= currentExercise.sets.length - 1;
                const isLastExercise = activeWorkout.current_exercise_index >= exercises.length - 1;

                if (isLastSet && !isLastExercise) {
                    set({
                        activeWorkout: {
                            ...activeWorkout,
                            current_exercise_index: activeWorkout.current_exercise_index + 1,
                            current_set_index: 0,
                        },
                    });
                } else if (!isLastSet) {
                    set({
                        activeWorkout: {
                            ...activeWorkout,
                            current_set_index: activeWorkout.current_set_index + 1,
                        },
                    });
                }
            },

            nextExercise: () => {
                const { activeWorkout } = get();
                if (!activeWorkout) return;

                if (activeWorkout.current_exercise_index < activeWorkout.exercises.length - 1) {
                    set({
                        activeWorkout: {
                            ...activeWorkout,
                            current_exercise_index: activeWorkout.current_exercise_index + 1,
                            current_set_index: 0,
                        },
                    });
                }
            },

            previousExercise: () => {
                const { activeWorkout } = get();
                if (!activeWorkout) return;

                if (activeWorkout.current_exercise_index > 0) {
                    set({
                        activeWorkout: {
                            ...activeWorkout,
                            current_exercise_index: activeWorkout.current_exercise_index - 1,
                            current_set_index: 0,
                        },
                    });
                }
            },

            startRest: (seconds) => {
                const { activeWorkout } = get();
                if (!activeWorkout) return;

                set({
                    activeWorkout: {
                        ...activeWorkout,
                        is_resting: true,
                        rest_time_remaining: seconds,
                    },
                });
            },

            updateRestTime: (seconds) => {
                const { activeWorkout } = get();
                if (!activeWorkout) return;

                set({
                    activeWorkout: {
                        ...activeWorkout,
                        rest_time_remaining: seconds,
                    },
                });
            },

            endRest: () => {
                const { activeWorkout } = get();
                if (!activeWorkout) return;

                set({
                    activeWorkout: {
                        ...activeWorkout,
                        is_resting: false,
                        rest_time_remaining: 0,
                    },
                });
            },

            endWorkout: () => set({ activeWorkout: null }),
        }),
        { name: 'youmove-workout' }
    )
);
