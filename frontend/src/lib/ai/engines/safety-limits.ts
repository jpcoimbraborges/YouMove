/**
 * YOUMOVE - Safety Limits Configuration
 * 
 * CRITICAL: These limits are HARDCODED and NOT AI-controlled.
 * Changes require code review and approval.
 * 
 * Based on exercise science research and safety standards.
 */

// ============================================
// VOLUME LIMITS (per week)
// ============================================

export const WEEKLY_VOLUME_LIMITS = {
    // Sets per muscle group per week
    SETS_PER_MUSCLE: {
        beginner: { min: 6, max: 10 },
        intermediate: { min: 10, max: 16 },
        advanced: { min: 14, max: 22 },
        elite: { min: 18, max: 28 },
    },

    // Total sets per workout
    SETS_PER_WORKOUT: {
        beginner: { min: 8, max: 16 },
        intermediate: { min: 12, max: 24 },
        advanced: { min: 16, max: 30 },
        elite: { min: 20, max: 35 },
    },

    // Volume load limits (kg per week per muscle group)
    VOLUME_LOAD_PER_MUSCLE: {
        beginner: { max: 5000 },
        intermediate: { max: 10000 },
        advanced: { max: 18000 },
        elite: { max: 25000 },
    },
} as const;

// ============================================
// INTENSITY LIMITS
// ============================================

export const INTENSITY_LIMITS = {
    // RPE (Rate of Perceived Exertion) limits
    RPE: {
        beginner: { min: 5, max: 7 },
        intermediate: { min: 6, max: 8 },
        advanced: { min: 6, max: 9 },
        elite: { min: 7, max: 10 },
    },

    // Percentage of 1RM for working sets
    PERCENTAGE_1RM: {
        beginner: { min: 50, max: 70 },
        intermediate: { min: 55, max: 80 },
        advanced: { min: 60, max: 90 },
        elite: { min: 60, max: 95 },
    },

    // Max weight increase per week (kg)
    MAX_WEIGHT_INCREASE_PER_WEEK: {
        upper_body: 2.5,
        lower_body: 5.0,
        isolation: 1.25,
    },
} as const;

// ============================================
// FREQUENCY LIMITS
// ============================================

export const FREQUENCY_LIMITS = {
    // Training days per week
    DAYS_PER_WEEK: {
        beginner: { min: 2, max: 4 },
        intermediate: { min: 3, max: 5 },
        advanced: { min: 4, max: 6 },
        elite: { min: 4, max: 7 },
    },

    // Same muscle group frequency (days between)
    MUSCLE_REST_DAYS: {
        beginner: { min: 3 },
        intermediate: { min: 2 },
        advanced: { min: 1 },
        elite: { min: 1 },
    },

    // Consecutive training days limit
    MAX_CONSECUTIVE_DAYS: {
        beginner: 2,
        intermediate: 3,
        advanced: 4,
        elite: 5,
    },
} as const;

// ============================================
// DURATION LIMITS
// ============================================

export const DURATION_LIMITS = {
    // Workout duration (minutes)
    WORKOUT_DURATION: {
        min: 15,
        max: 120,
        optimal: {
            beginner: { min: 30, max: 45 },
            intermediate: { min: 40, max: 60 },
            advanced: { min: 50, max: 75 },
            elite: { min: 60, max: 90 },
        },
    },

    // Rest between sets (seconds)
    REST_BETWEEN_SETS: {
        strength: { min: 120, max: 300 },
        hypertrophy: { min: 60, max: 120 },
        endurance: { min: 30, max: 60 },
        power: { min: 180, max: 300 },
    },

    // Rest between exercises (seconds)
    REST_BETWEEN_EXERCISES: {
        min: 60,
        max: 180,
    },
} as const;

// ============================================
// REP RANGE LIMITS
// ============================================

export const REP_RANGES = {
    // By training goal
    strength: { min: 1, max: 5, optimal: 3 },
    power: { min: 1, max: 3, optimal: 2 },
    hypertrophy: { min: 6, max: 12, optimal: 10 },
    endurance: { min: 12, max: 25, optimal: 15 },
    general_fitness: { min: 8, max: 15, optimal: 12 },

    // Absolute limits
    ABSOLUTE: {
        min: 1,
        max: 30,
    },
} as const;

// ============================================
// EXERCISE-SPECIFIC LIMITS
// ============================================

export const EXERCISE_LIMITS = {
    // Exercises per workout
    EXERCISES_PER_WORKOUT: {
        beginner: { min: 4, max: 6 },
        intermediate: { min: 5, max: 8 },
        advanced: { min: 6, max: 10 },
        elite: { min: 6, max: 12 },
    },

    // Compound to isolation ratio
    COMPOUND_RATIO: {
        beginner: { min: 0.7 }, // 70% compound minimum
        intermediate: { min: 0.6 },
        advanced: { min: 0.5 },
        elite: { min: 0.4 },
    },

    // Sets per exercise
    SETS_PER_EXERCISE: {
        min: 2,
        max: 6,
        default: 3,
    },
} as const;

// ============================================
// PROGRESSION LIMITS
// ============================================

export const PROGRESSION_LIMITS = {
    // Weekly volume increase (%)
    WEEKLY_VOLUME_INCREASE: {
        beginner: { max: 10 },
        intermediate: { max: 7 },
        advanced: { max: 5 },
        elite: { max: 3 },
    },

    // Deload frequency (weeks)
    DELOAD_FREQUENCY: {
        beginner: { every: 6 },
        intermediate: { every: 5 },
        advanced: { every: 4 },
        elite: { every: 3 },
    },

    // Max consecutive weeks of progression
    MAX_PROGRESSION_WEEKS: {
        beginner: 8,
        intermediate: 6,
        advanced: 5,
        elite: 4,
    },
} as const;

// ============================================
// AGE-BASED MODIFIERS
// ============================================

export const AGE_MODIFIERS = {
    // Volume multiplier by age group
    VOLUME_MULTIPLIER: {
        '16-25': 1.0,
        '26-35': 1.0,
        '36-45': 0.9,
        '46-55': 0.8,
        '56-65': 0.7,
        '65+': 0.6,
    },

    // Recovery time multiplier
    RECOVERY_MULTIPLIER: {
        '16-25': 1.0,
        '26-35': 1.0,
        '36-45': 1.1,
        '46-55': 1.2,
        '56-65': 1.3,
        '65+': 1.5,
    },
} as const;

// ============================================
// INJURY PREVENTION LIMITS
// ============================================

export const INJURY_LIMITS = {
    // Max RPE for consecutive workouts
    MAX_HIGH_INTENSITY_CONSECUTIVE: 2,

    // Required rest after max effort (days)
    REST_AFTER_MAX_EFFORT: 2,

    // Warning thresholds
    WARNINGS: {
        volume_spike_percent: 20,     // Alert if volume increases >20% in a week
        intensity_spike_rpe: 2,       // Alert if avg RPE increases >2 points
        missed_rest_days: 2,          // Alert if less than 2 rest days/week
    },
} as const;

// ============================================
// TYPE DEFINITIONS
// ============================================

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite';
export type TrainingGoal = 'strength' | 'power' | 'hypertrophy' | 'endurance' | 'general_fitness';
export type MuscleCategory = 'upper_body' | 'lower_body' | 'isolation';
export type AgeGroup = '16-25' | '26-35' | '36-45' | '46-55' | '56-65' | '65+';

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getAgeGroup(age: number): AgeGroup {
    if (age < 16) return '16-25'; // Minimum training age
    if (age <= 25) return '16-25';
    if (age <= 35) return '26-35';
    if (age <= 45) return '36-45';
    if (age <= 55) return '46-55';
    if (age <= 65) return '56-65';
    return '65+';
}

export function applyAgeModifier(
    baseValue: number,
    age: number,
    modifierType: 'volume' | 'recovery'
): number {
    const ageGroup = getAgeGroup(age);
    const modifier = modifierType === 'volume'
        ? AGE_MODIFIERS.VOLUME_MULTIPLIER[ageGroup]
        : AGE_MODIFIERS.RECOVERY_MULTIPLIER[ageGroup];

    return Math.round(baseValue * modifier);
}
