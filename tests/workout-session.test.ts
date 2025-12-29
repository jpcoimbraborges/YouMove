/**
 * YOUMOVE - Workout Session Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
    };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });
Object.defineProperty(global, 'window', { value: { localStorage: localStorageMock } });

// Import after mocking
import {
    startSession,
    pauseSession,
    resumeSession,
    completeSession,
    cancelSession,
    completeSet,
    skipSet,
    updateSet,
    skipExercise,
    getActiveSession,
    clearActiveSession,
    getSessionProgress,
    getCurrentExercise,
    getElapsedTime,
    formatTime,
    getPendingSync,
} from '../frontend/src/lib/workout-session';

describe('Workout Session Management', () => {
    beforeEach(() => {
        localStorageMock.clear();
    });

    describe('startSession', () => {
        it('should create a new session', () => {
            const session = startSession({
                user_id: 'user_123',
                workout_name: 'Push Day',
                exercises: [
                    {
                        exercise_id: 'bench_press',
                        exercise_name: 'Supino',
                        muscle_group: 'chest',
                        sets: [
                            { set_type: 'working', target_reps: 10, target_weight_kg: 80, target_rest_seconds: 90 },
                            { set_type: 'working', target_reps: 10, target_weight_kg: 80, target_rest_seconds: 90 },
                        ],
                    },
                ],
            });

            expect(session.id).toBeDefined();
            expect(session.user_id).toBe('user_123');
            expect(session.workout_name).toBe('Push Day');
            expect(session.status).toBe('in_progress');
            expect(session.started_at).toBeDefined();
            expect(session.exercises.length).toBe(1);
            expect(session.exercises[0].sets.length).toBe(2);
        });

        it('should save to localStorage', () => {
            startSession({
                user_id: 'user_123',
                workout_name: 'Test',
                exercises: [],
            });

            const stored = getActiveSession();
            expect(stored).not.toBeNull();
        });

        it('should add to pending sync', () => {
            startSession({
                user_id: 'user_123',
                workout_name: 'Test',
                exercises: [],
            });

            const pending = getPendingSync();
            expect(pending.length).toBeGreaterThan(0);
        });
    });

    describe('pauseSession / resumeSession', () => {
        it('should pause and resume correctly', () => {
            startSession({
                user_id: 'user_123',
                workout_name: 'Test',
                exercises: [],
            });

            const paused = pauseSession();
            expect(paused?.status).toBe('paused');
            expect(paused?.paused_at).toBeDefined();

            // Wait a bit
            vi.useFakeTimers();
            vi.advanceTimersByTime(5000);

            const resumed = resumeSession();
            expect(resumed?.status).toBe('in_progress');
            expect(resumed?.paused_at).toBeNull();
            expect(resumed?.total_pause_seconds).toBeGreaterThanOrEqual(0);

            vi.useRealTimers();
        });
    });

    describe('completeSet', () => {
        it('should record set data', () => {
            const session = startSession({
                user_id: 'user_123',
                workout_name: 'Test',
                exercises: [
                    {
                        exercise_id: 'bench_press',
                        exercise_name: 'Supino',
                        muscle_group: 'chest',
                        sets: [
                            { set_type: 'working', target_reps: 10, target_weight_kg: 80, target_rest_seconds: 90 },
                        ],
                    },
                ],
            });

            const exerciseId = session.exercises[0].id;

            const updated = completeSet(exerciseId, 1, {
                actual_reps: 10,
                actual_weight_kg: 80,
                rpe: 8,
                difficulty: 'moderate',
            });

            expect(updated).not.toBeNull();
            const set = updated!.exercises[0].sets[0];
            expect(set.completed).toBe(true);
            expect(set.actual_reps).toBe(10);
            expect(set.actual_weight_kg).toBe(80);
            expect(set.rpe).toBe(8);
        });

        it('should calculate volume correctly', () => {
            const session = startSession({
                user_id: 'user_123',
                workout_name: 'Test',
                exercises: [
                    {
                        exercise_id: 'squat',
                        exercise_name: 'Agachamento',
                        muscle_group: 'quadriceps',
                        sets: [
                            { set_type: 'working', target_reps: 5, target_weight_kg: 100, target_rest_seconds: 180 },
                        ],
                    },
                ],
            });

            const exerciseId = session.exercises[0].id;

            const updated = completeSet(exerciseId, 1, {
                actual_reps: 5,
                actual_weight_kg: 100,
            });

            expect(updated!.total_volume_kg).toBe(500); // 5 * 100
            expect(updated!.total_reps_completed).toBe(5);
            expect(updated!.total_sets_completed).toBe(1);
        });
    });

    describe('skipSet', () => {
        it('should mark set as skipped', () => {
            const session = startSession({
                user_id: 'user_123',
                workout_name: 'Test',
                exercises: [
                    {
                        exercise_id: 'deadlift',
                        exercise_name: 'Levantamento Terra',
                        muscle_group: 'back',
                        sets: [
                            { set_type: 'working', target_reps: 5, target_weight_kg: 140, target_rest_seconds: 180 },
                        ],
                    },
                ],
            });

            const exerciseId = session.exercises[0].id;

            const updated = skipSet(exerciseId, 1, 'Dor nas costas');

            expect(updated).not.toBeNull();
            const set = updated!.exercises[0].sets[0];
            expect(set.skipped).toBe(true);
            expect(set.completed).toBe(false);
            expect(set.notes).toBe('Dor nas costas');
        });
    });

    describe('skipExercise', () => {
        it('should skip entire exercise', () => {
            const session = startSession({
                user_id: 'user_123',
                workout_name: 'Test',
                exercises: [
                    {
                        exercise_id: 'pull_ups',
                        exercise_name: 'Barra',
                        muscle_group: 'back',
                        sets: [
                            { set_type: 'working', target_reps: 10, target_weight_kg: 0, target_rest_seconds: 90 },
                            { set_type: 'working', target_reps: 10, target_weight_kg: 0, target_rest_seconds: 90 },
                        ],
                    },
                ],
            });

            const exerciseId = session.exercises[0].id;

            const updated = skipExercise(exerciseId, 'Equipamento ocupado');

            expect(updated).not.toBeNull();
            const exercise = updated!.exercises[0];
            expect(exercise.skipped).toBe(true);
            expect(exercise.sets.every(s => s.skipped)).toBe(true);
        });
    });

    describe('completeSession', () => {
        it('should mark session as completed', () => {
            const session = startSession({
                user_id: 'user_123',
                workout_name: 'Test',
                exercises: [],
            });

            const completed = completeSession(7);

            expect(completed).not.toBeNull();
            expect(completed!.status).toBe('completed');
            expect(completed!.completed_at).toBeDefined();
            expect(completed!.average_rpe).toBe(7);
        });

        it('should calculate duration', () => {
            vi.useFakeTimers();

            startSession({
                user_id: 'user_123',
                workout_name: 'Test',
                exercises: [],
            });

            vi.advanceTimersByTime(30 * 60 * 1000); // 30 minutes

            const completed = completeSession(7);

            expect(completed!.actual_duration_minutes).toBe(30);

            vi.useRealTimers();
        });

        it('should clear active session', () => {
            startSession({
                user_id: 'user_123',
                workout_name: 'Test',
                exercises: [],
            });

            completeSession(7);

            expect(getActiveSession()).toBeNull();
        });
    });

    describe('cancelSession', () => {
        it('should cancel session', () => {
            startSession({
                user_id: 'user_123',
                workout_name: 'Test',
                exercises: [],
            });

            const canceled = cancelSession('Não estava me sentindo bem');

            expect(canceled).not.toBeNull();
            expect(canceled!.status).toBe('cancelled');
        });
    });
});

describe('Session Progress Calculations', () => {
    beforeEach(() => {
        localStorageMock.clear();
    });

    it('should calculate progress correctly', () => {
        const session = startSession({
            user_id: 'user_123',
            workout_name: 'Test',
            exercises: [
                {
                    exercise_id: 'ex1',
                    exercise_name: 'Exercise 1',
                    muscle_group: 'chest',
                    sets: [
                        { set_type: 'working', target_reps: 10, target_weight_kg: 50, target_rest_seconds: 60 },
                        { set_type: 'working', target_reps: 10, target_weight_kg: 50, target_rest_seconds: 60 },
                    ],
                },
            ],
        });

        expect(getSessionProgress(session)).toBe(0);

        const exerciseId = session.exercises[0].id;
        const updated = completeSet(exerciseId, 1, {
            actual_reps: 10,
            actual_weight_kg: 50,
        });

        expect(getSessionProgress(updated!)).toBe(50);
    });

    it('should find current exercise', () => {
        const session = startSession({
            user_id: 'user_123',
            workout_name: 'Test',
            exercises: [
                {
                    exercise_id: 'ex1',
                    exercise_name: 'First',
                    muscle_group: 'chest',
                    sets: [{ set_type: 'working', target_reps: 10, target_weight_kg: 50, target_rest_seconds: 60 }],
                },
                {
                    exercise_id: 'ex2',
                    exercise_name: 'Second',
                    muscle_group: 'back',
                    sets: [{ set_type: 'working', target_reps: 10, target_weight_kg: 50, target_rest_seconds: 60 }],
                },
            ],
        });

        expect(getCurrentExercise(session)?.exercise_name).toBe('First');
    });
});

describe('Utility Functions', () => {
    it('should format time correctly', () => {
        expect(formatTime(0)).toBe('0:00');
        expect(formatTime(30)).toBe('0:30');
        expect(formatTime(60)).toBe('1:00');
        expect(formatTime(90)).toBe('1:30');
        expect(formatTime(3600)).toBe('1:00:00');
        expect(formatTime(3661)).toBe('1:01:01');
    });
});
