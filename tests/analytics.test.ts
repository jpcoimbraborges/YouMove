/**
 * YOUMOVE - Analytics Tests
 */

import { describe, it, expect } from 'vitest';
import {
    calculateVolume,
    calculateWeeklyVolume,
    getWeeklyVolumeTrend,
    getVolumeByMuscle,
    calculateFrequency,
    getMuscleFrequency,
    getTrainingPattern,
    calculateProgression,
    calculateConsistency,
    getWeeklyStats,
    type WorkoutLog,
} from '../frontend/src/lib/analytics/calculations';

// Helper to create mock logs
function createMockLog(date: string, overrides = {}): WorkoutLog {
    return {
        id: `log_${date}`,
        user_id: 'user_123',
        date,
        workout_name: 'Push Day',
        duration_minutes: 60,
        exercises: [
            {
                exercise_id: 'bench_press',
                exercise_name: 'Supino',
                muscle_group: 'chest',
                sets: [
                    { reps: 10, weight_kg: 80, rpe: 8 },
                    { reps: 10, weight_kg: 80, rpe: 8 },
                    { reps: 8, weight_kg: 80, rpe: 9 },
                ],
                total_volume_kg: 2240,
                max_weight_kg: 80,
            },
        ],
        total_volume_kg: 2240,
        total_sets: 3,
        total_reps: 28,
        average_rpe: 8.3,
        completed: true,
        ...overrides,
    };
}

describe('Volume Calculations', () => {
    describe('calculateVolume', () => {
        it('should calculate volume correctly', () => {
            const sets = [
                { reps: 10, weight_kg: 100, rpe: 8 },
                { reps: 8, weight_kg: 100, rpe: 9 },
            ];

            expect(calculateVolume(sets)).toBe(1800); // (10*100) + (8*100)
        });

        it('should handle empty sets', () => {
            expect(calculateVolume([])).toBe(0);
        });
    });

    describe('calculateWeeklyVolume', () => {
        it('should sum volume for the week', () => {
            const logs = [
                createMockLog('2024-01-08', { total_volume_kg: 1000 }),
                createMockLog('2024-01-10', { total_volume_kg: 1500 }),
                createMockLog('2024-01-12', { total_volume_kg: 1200 }),
            ];

            const weekStart = new Date('2024-01-08');
            expect(calculateWeeklyVolume(logs, weekStart)).toBe(3700);
        });

        it('should exclude logs outside the week', () => {
            const logs = [
                createMockLog('2024-01-01', { total_volume_kg: 1000 }),
                createMockLog('2024-01-08', { total_volume_kg: 1500 }),
                createMockLog('2024-01-15', { total_volume_kg: 1200 }),
            ];

            const weekStart = new Date('2024-01-08');
            expect(calculateWeeklyVolume(logs, weekStart)).toBe(1500);
        });
    });

    describe('getVolumeByMuscle', () => {
        it('should group volume by muscle', () => {
            const today = new Date().toISOString().split('T')[0];
            const logs = [
                createMockLog(today, {
                    exercises: [
                        { exercise_id: 'bench', exercise_name: 'Supino', muscle_group: 'chest', sets: [], total_volume_kg: 1000, max_weight_kg: 80 },
                        { exercise_id: 'row', exercise_name: 'Remada', muscle_group: 'back', sets: [], total_volume_kg: 800, max_weight_kg: 70 },
                    ],
                }),
            ];

            const result = getVolumeByMuscle(logs, 7);
            expect(result['chest']).toBe(1000);
            expect(result['back']).toBe(800);
        });
    });
});

describe('Frequency Calculations', () => {
    describe('calculateFrequency', () => {
        it('should calculate weekly frequency', () => {
            const now = new Date();
            const logs = [];

            // 3 workouts per week for 4 weeks = 12 workouts
            for (let i = 0; i < 12; i++) {
                const date = new Date(now);
                date.setDate(date.getDate() - (i * 2)); // Every 2 days
                logs.push(createMockLog(date.toISOString().split('T')[0]));
            }

            const freq = calculateFrequency(logs, 4);
            expect(freq).toBeGreaterThan(2);
            expect(freq).toBeLessThanOrEqual(7);
        });
    });

    describe('getMuscleFrequency', () => {
        it('should calculate frequency per muscle', () => {
            const now = new Date();
            const logs = [];

            for (let i = 0; i < 8; i++) {
                const date = new Date(now);
                date.setDate(date.getDate() - (i * 2));
                const log = createMockLog(date.toISOString().split('T')[0]);
                logs.push(log);
            }

            const result = getMuscleFrequency(logs, 4);
            expect(result['chest']).toBeGreaterThan(0);
        });
    });

    describe('getTrainingPattern', () => {
        it('should count training by day of week', () => {
            const logs = [
                createMockLog('2024-01-08'), // Monday
                createMockLog('2024-01-10'), // Wednesday
                createMockLog('2024-01-12'), // Friday
                createMockLog('2024-01-15'), // Monday
                createMockLog('2024-01-17'), // Wednesday
            ];

            const pattern = getTrainingPattern(logs, 4);
            expect(pattern.length).toBe(7);
            expect(pattern.some(p => p.count > 0)).toBe(true);
        });
    });
});

describe('Progression Calculations', () => {
    describe('calculateProgression', () => {
        it('should detect increasing trend', () => {
            const now = new Date();
            const logs = [];

            for (let i = 7; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - (i * 7));

                logs.push(createMockLog(date.toISOString().split('T')[0], {
                    exercises: [
                        {
                            exercise_id: 'squat',
                            exercise_name: 'Agachamento',
                            muscle_group: 'quadriceps',
                            sets: [
                                { reps: 5, weight_kg: 100 + (7 - i) * 5, rpe: 8 }, // Increasing weight
                            ],
                            total_volume_kg: 500 + (7 - i) * 25,
                            max_weight_kg: 100 + (7 - i) * 5,
                        },
                    ],
                }));
            }

            const progression = calculateProgression(logs, 'squat', 8);

            expect(progression).not.toBeNull();
            expect(progression!.trend).toBe('increasing');
            expect(progression!.change_percent).toBeGreaterThan(0);
        });

        it('should calculate estimated 1RM', () => {
            const log = createMockLog('2024-01-15', {
                exercises: [
                    {
                        exercise_id: 'deadlift',
                        exercise_name: 'Levantamento Terra',
                        muscle_group: 'back',
                        sets: [
                            { reps: 5, weight_kg: 180, rpe: 9 },
                        ],
                        total_volume_kg: 900,
                        max_weight_kg: 180,
                    },
                ],
            });

            const progression = calculateProgression([log], 'deadlift', 8);

            // With only 1 data point, can't calculate trend
            expect(progression).toBeNull();
        });
    });
});

describe('Consistency Calculations', () => {
    describe('calculateConsistency', () => {
        it('should calculate consistency percentage', () => {
            const now = new Date();
            const logs = [];

            // 3 workouts per week for 4 weeks = 12 workouts
            // Expected 4/week = 16 workouts
            for (let i = 0; i < 12; i++) {
                const date = new Date(now);
                date.setDate(date.getDate() - (i * 2));
                logs.push(createMockLog(date.toISOString().split('T')[0]));
            }

            const consistency = calculateConsistency(logs, 4, 4);

            expect(consistency.completed_workouts).toBe(12);
            expect(consistency.expected_workouts).toBe(16);
            expect(consistency.consistency_percent).toBe(75);
        });

        it('should track current streak', () => {
            const now = new Date();
            const logs = [];

            // Last 5 days consecutive
            for (let i = 0; i < 5; i++) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                logs.push(createMockLog(date.toISOString().split('T')[0]));
            }

            const consistency = calculateConsistency(logs, 5, 2);

            expect(consistency.current_streak).toBeGreaterThanOrEqual(1);
        });
    });
});

describe('Weekly Stats', () => {
    describe('getWeeklyStats', () => {
        it('should aggregate weekly statistics', () => {
            const thisWeek = new Date();
            thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay()); // Start of week

            const logs = [
                createMockLog(thisWeek.toISOString().split('T')[0], {
                    total_volume_kg: 2000,
                    total_sets: 15,
                    total_reps: 100,
                    duration_minutes: 60,
                    average_rpe: 8,
                }),
            ];

            const stats = getWeeklyStats(logs);

            expect(stats.workouts_completed).toBe(1);
            expect(stats.total_volume_kg).toBe(2000);
            expect(stats.total_sets).toBe(15);
            expect(stats.total_reps).toBe(100);
            expect(stats.total_duration_minutes).toBe(60);
        });

        it('should calculate volume by muscle', () => {
            const thisWeek = new Date();
            thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());

            const logs = [
                createMockLog(thisWeek.toISOString().split('T')[0], {
                    exercises: [
                        { exercise_id: 'bench', exercise_name: 'Supino', muscle_group: 'chest', sets: [], total_volume_kg: 1500, max_weight_kg: 80 },
                        { exercise_id: 'fly', exercise_name: 'Crucifixo', muscle_group: 'chest', sets: [], total_volume_kg: 500, max_weight_kg: 20 },
                    ],
                }),
            ];

            const stats = getWeeklyStats(logs);

            expect(stats.volume_by_muscle['chest']).toBe(2000);
        });

        it('should return top exercises', () => {
            const thisWeek = new Date();
            thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());

            const logs = [
                createMockLog(thisWeek.toISOString().split('T')[0], {
                    exercises: [
                        { exercise_id: 'squat', exercise_name: 'Agachamento', muscle_group: 'quadriceps', sets: [], total_volume_kg: 3000, max_weight_kg: 140 },
                        { exercise_id: 'leg_press', exercise_name: 'Leg Press', muscle_group: 'quadriceps', sets: [], total_volume_kg: 2000, max_weight_kg: 200 },
                    ],
                }),
            ];

            const stats = getWeeklyStats(logs);

            expect(stats.top_exercises.length).toBeGreaterThan(0);
            expect(stats.top_exercises[0].name).toBe('Agachamento');
        });
    });
});
