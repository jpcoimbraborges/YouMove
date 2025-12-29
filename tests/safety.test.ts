/**
 * YOUMOVE - Safety Guardrails Tests
 */

import { describe, it, expect } from 'vitest';
import {
    checkWorkoutSafety,
    checkProgressionSafety,
    checkWeeklyVolumeSafety,
    getAgeGroup,
    ABSOLUTE_LIMITS,
    AGE_LIMITS,
    LEVEL_LIMITS,
} from '../shared/validation/safety-guardrails';

describe('Age Group Detection', () => {
    it('should correctly categorize ages', () => {
        expect(getAgeGroup(15)).toBe('TEEN');
        expect(getAgeGroup(17)).toBe('TEEN');
        expect(getAgeGroup(18)).toBe('YOUNG_ADULT');
        expect(getAgeGroup(35)).toBe('YOUNG_ADULT');
        expect(getAgeGroup(36)).toBe('ADULT');
        expect(getAgeGroup(55)).toBe('ADULT');
        expect(getAgeGroup(56)).toBe('SENIOR');
        expect(getAgeGroup(80)).toBe('SENIOR');
    });
});

describe('Workout Safety Checks', () => {
    const baseContext = {
        age: 30,
        fitness_level: 'intermediate' as const,
        training_experience_months: 24,
    };

    const createWorkout = (overrides = {}) => ({
        exercises: [
            {
                id: 'bench_press',
                name: 'Supino',
                muscle: 'chest',
                sets: 4,
                reps: 10,
                weight_kg: 80,
                rest_seconds: 90,
            },
            {
                id: 'squat',
                name: 'Agachamento',
                muscle: 'quadriceps',
                sets: 4,
                reps: 8,
                weight_kg: 100,
                rest_seconds: 120,
            },
        ],
        total_duration_minutes: 60,
        ...overrides,
    });

    it('should pass valid workout', () => {
        const result = checkWorkoutSafety(createWorkout(), baseContext);
        expect(result.passed).toBe(true);
        expect(result.violations.length).toBe(0);
    });

    it('should warn on too many exercises', () => {
        const manyExercises = Array.from({ length: 12 }, (_, i) => ({
            id: `exercise_${i}`,
            name: `Exercise ${i}`,
            muscle: 'chest',
            sets: 2,
            reps: 10,
            weight_kg: 50,
            rest_seconds: 60,
        }));

        const result = checkWorkoutSafety(
            { exercises: manyExercises, total_duration_minutes: 90 },
            baseContext
        );

        expect(result.violations.some(v => v.code === 'TOO_MANY_EXERCISES')).toBe(true);
    });

    it('should warn on too many sets', () => {
        const exercises = Array.from({ length: 6 }, (_, i) => ({
            id: `exercise_${i}`,
            name: `Exercise ${i}`,
            muscle: 'chest',
            sets: 8, // 6 * 8 = 48 sets
            reps: 10,
            weight_kg: 50,
            rest_seconds: 60,
        }));

        const result = checkWorkoutSafety(
            { exercises, total_duration_minutes: 120 },
            baseContext
        );

        expect(result.violations.some(v => v.code === 'TOO_MANY_SETS')).toBe(true);
    });

    it('should error on excessive duration', () => {
        const result = checkWorkoutSafety(
            createWorkout({ total_duration_minutes: 200 }),
            baseContext
        );

        expect(result.passed).toBe(false);
        expect(result.violations.some(v => v.code === 'DURATION_TOO_LONG')).toBe(true);
    });

    it('should error on excessive weight', () => {
        const workout = createWorkout();
        workout.exercises[0].weight_kg = 600;

        const result = checkWorkoutSafety(workout, baseContext);

        expect(result.passed).toBe(false);
        expect(result.violations.some(v => v.code === 'WEIGHT_TOO_HIGH')).toBe(true);
    });

    it('should apply beginner restrictions', () => {
        const beginnerContext = {
            ...baseContext,
            fitness_level: 'beginner' as const,
        };

        const workout = createWorkout();
        workout.exercises[0].rest_seconds = 30; // Too short for beginner

        const result = checkWorkoutSafety(workout, beginnerContext);

        expect(result.violations.some(v => v.code === 'REST_TOO_SHORT')).toBe(true);
    });

    it('should apply senior age limits', () => {
        const seniorContext = {
            ...baseContext,
            age: 65,
        };

        const exercises = Array.from({ length: 4 }, (_, i) => ({
            id: `exercise_${i}`,
            name: `Exercise ${i}`,
            muscle: 'chest',
            sets: 8, // 4 * 8 = 32 sets (too many for senior)
            reps: 10,
            weight_kg: 50,
            rest_seconds: 90,
        }));

        const result = checkWorkoutSafety(
            { exercises, total_duration_minutes: 90 },
            seniorContext
        );

        expect(result.violations.some(v => v.code === 'TOO_MANY_SETS')).toBe(true);
    });

    it('should flag exercises restricted by injury', () => {
        const contextWithInjury = {
            ...baseContext,
            injuries: ['shoulder'],
        };

        const workout = {
            exercises: [
                {
                    id: 'overhead_press',
                    name: 'Desenvolvimento',
                    muscle: 'shoulders',
                    sets: 4,
                    reps: 10,
                    weight_kg: 40,
                    rest_seconds: 90,
                },
            ],
            total_duration_minutes: 30,
        };

        const result = checkWorkoutSafety(workout, contextWithInjury);

        expect(result.passed).toBe(false);
        expect(result.violations.some(v => v.code === 'EXERCISE_RESTRICTED_INJURY')).toBe(true);
    });
});

describe('Progression Safety', () => {
    const baseContext = {
        age: 30,
        fitness_level: 'intermediate' as const,
        training_experience_months: 24,
    };

    it('should pass safe progression', () => {
        const result = checkProgressionSafety(100, 105, baseContext);
        expect(result.passed).toBe(true);
    });

    it('should warn on fast progression', () => {
        const result = checkProgressionSafety(100, 115, baseContext);
        expect(result.violations.some(v => v.code === 'PROGRESSION_TOO_FAST')).toBe(true);
    });

    it('should error on dangerous progression', () => {
        const result = checkProgressionSafety(100, 125, baseContext);
        expect(result.passed).toBe(false);
        expect(result.violations.some(v => v.code === 'PROGRESSION_DANGEROUS')).toBe(true);
    });

    it('should apply stricter limits for seniors', () => {
        const seniorContext = { ...baseContext, age: 65 };

        // 8% increase should warn for senior (max 5%)
        const result = checkProgressionSafety(100, 108, seniorContext);
        expect(result.violations.some(v => v.code === 'PROGRESSION_TOO_FAST')).toBe(true);
    });
});

describe('Weekly Volume Safety', () => {
    const baseContext = {
        age: 30,
        fitness_level: 'intermediate' as const,
        training_experience_months: 24,
    };

    it('should pass stable volume', () => {
        const result = checkWeeklyVolumeSafety(10000, 11000, baseContext);
        expect(result.passed).toBe(true);
    });

    it('should warn on volume spike', () => {
        const result = checkWeeklyVolumeSafety(10000, 12000, baseContext);
        expect(result.violations.some(v => v.code === 'VOLUME_SPIKE')).toBe(true);
    });

    it('should handle first week (no previous)', () => {
        const result = checkWeeklyVolumeSafety(0, 10000, baseContext);
        expect(result.passed).toBe(true);
    });
});

describe('Absolute Limits', () => {
    it('should have reasonable maximum values', () => {
        expect(ABSOLUTE_LIMITS.MAX_WORKOUT_DURATION_MINUTES).toBeLessThanOrEqual(240);
        expect(ABSOLUTE_LIMITS.MAX_EXERCISES_PER_WORKOUT).toBeLessThanOrEqual(20);
        expect(ABSOLUTE_LIMITS.MAX_SETS_PER_WORKOUT).toBeLessThanOrEqual(50);
        expect(ABSOLUTE_LIMITS.MAX_WEIGHT_KG).toBeLessThanOrEqual(600);
        expect(ABSOLUTE_LIMITS.MAX_REPS_PER_SET).toBeLessThanOrEqual(100);
    });

    it('should ensure rest days', () => {
        expect(ABSOLUTE_LIMITS.MIN_REST_DAYS_PER_WEEK).toBeGreaterThanOrEqual(1);
        expect(ABSOLUTE_LIMITS.MAX_CONSECUTIVE_TRAINING_DAYS).toBeLessThanOrEqual(6);
    });
});

describe('Level Limits', () => {
    it('should have progressively higher limits', () => {
        expect(LEVEL_LIMITS.beginner.max_sets_per_workout)
            .toBeLessThan(LEVEL_LIMITS.intermediate.max_sets_per_workout);

        expect(LEVEL_LIMITS.intermediate.max_sets_per_workout)
            .toBeLessThan(LEVEL_LIMITS.advanced.max_sets_per_workout);

        expect(LEVEL_LIMITS.advanced.max_sets_per_workout)
            .toBeLessThanOrEqual(LEVEL_LIMITS.elite.max_sets_per_workout);
    });

    it('should have appropriate RPE limits', () => {
        expect(LEVEL_LIMITS.beginner.max_rpe).toBeLessThan(10);
        expect(LEVEL_LIMITS.elite.max_rpe).toBe(10);
    });

    it('should require more rest for beginners', () => {
        expect(LEVEL_LIMITS.beginner.min_rest_between_sets_seconds)
            .toBeGreaterThan(LEVEL_LIMITS.elite.min_rest_between_sets_seconds);
    });
});
