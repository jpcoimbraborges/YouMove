/**
 * YOUMOVE - Safety Guardrails
 * 
 * Protects users from unsafe training recommendations.
 * These limits are HARDCODED and cannot be overridden by AI.
 */

// ============================================
// TYPES
// ============================================

export interface SafetyCheck {
    passed: boolean;
    violations: SafetyViolation[];
    adjusted?: unknown;
}

export interface SafetyViolation {
    code: string;
    severity: 'warning' | 'error' | 'critical';
    message: string;
    field: string;
    original_value: unknown;
    safe_value?: unknown;
}

export interface UserContext {
    age: number;
    fitness_level: 'beginner' | 'intermediate' | 'advanced' | 'elite';
    injuries?: string[];
    medical_conditions?: string[];
    training_experience_months: number;
}

// ============================================
// ABSOLUTE LIMITS (NEVER EXCEEDED)
// ============================================

export const ABSOLUTE_LIMITS = {
    // Per session
    MAX_WORKOUT_DURATION_MINUTES: 180,
    MAX_EXERCISES_PER_WORKOUT: 15,
    MAX_SETS_PER_WORKOUT: 40,
    MAX_SETS_PER_EXERCISE: 10,
    MAX_REPS_PER_SET: 50,
    MAX_WEIGHT_KG: 500,

    // Per week
    MAX_WORKOUTS_PER_WEEK: 7,
    MAX_CONSECUTIVE_TRAINING_DAYS: 6,
    MIN_REST_DAYS_PER_WEEK: 1,

    // Volume (per muscle per week)
    MAX_SETS_PER_MUSCLE_PER_WEEK: 30,
    MAX_VOLUME_PER_MUSCLE_PER_WEEK_KG: 50000,

    // Intensity
    MAX_RPE: 10,
    MAX_PERCENTAGE_1RM: 100,

    // Progression limits
    MAX_WEIGHT_INCREASE_PERCENT_PER_WEEK: 10,
    MAX_VOLUME_INCREASE_PERCENT_PER_WEEK: 15,
} as const;

// ============================================
// AGE-BASED LIMITS
// ============================================

export const AGE_LIMITS = {
    TEEN: { // 13-17
        max_workouts_per_week: 5,
        max_sets_per_workout: 25,
        max_rpe: 8,
        max_weight_increase_percent: 5,
        require_supervision_note: true,
    },
    YOUNG_ADULT: { // 18-35
        max_workouts_per_week: 7,
        max_sets_per_workout: 40,
        max_rpe: 10,
        max_weight_increase_percent: 10,
        require_supervision_note: false,
    },
    ADULT: { // 36-55
        max_workouts_per_week: 6,
        max_sets_per_workout: 35,
        max_rpe: 9,
        max_weight_increase_percent: 7,
        require_supervision_note: false,
    },
    SENIOR: { // 56+
        max_workouts_per_week: 5,
        max_sets_per_workout: 25,
        max_rpe: 8,
        max_weight_increase_percent: 5,
        require_supervision_note: true,
    },
} as const;

export function getAgeGroup(age: number): keyof typeof AGE_LIMITS {
    if (age < 18) return 'TEEN';
    if (age <= 35) return 'YOUNG_ADULT';
    if (age <= 55) return 'ADULT';
    return 'SENIOR';
}

// ============================================
// LEVEL-BASED LIMITS
// ============================================

export const LEVEL_LIMITS = {
    beginner: {
        max_workouts_per_week: 4,
        max_sets_per_workout: 20,
        max_exercises_per_workout: 6,
        max_rpe: 7,
        min_rest_between_sets_seconds: 90,
        max_weight_increase_percent: 5,
        allow_advanced_techniques: false,
        require_compound_priority: true,
    },
    intermediate: {
        max_workouts_per_week: 5,
        max_sets_per_workout: 30,
        max_exercises_per_workout: 8,
        max_rpe: 9,
        min_rest_between_sets_seconds: 60,
        max_weight_increase_percent: 7,
        allow_advanced_techniques: true,
        require_compound_priority: true,
    },
    advanced: {
        max_workouts_per_week: 6,
        max_sets_per_workout: 35,
        max_exercises_per_workout: 10,
        max_rpe: 10,
        min_rest_between_sets_seconds: 45,
        max_weight_increase_percent: 5,
        allow_advanced_techniques: true,
        require_compound_priority: false,
    },
    elite: {
        max_workouts_per_week: 7,
        max_sets_per_workout: 40,
        max_exercises_per_workout: 12,
        max_rpe: 10,
        min_rest_between_sets_seconds: 30,
        max_weight_increase_percent: 3,
        allow_advanced_techniques: true,
        require_compound_priority: false,
    },
} as const;

// ============================================
// INJURY RESTRICTIONS
// ============================================

export const INJURY_RESTRICTIONS: Record<string, {
    avoid_muscles: string[];
    avoid_exercises: string[];
    max_weight_percent: number;
    require_warmup: boolean;
    warning_message: string;
}> = {
    shoulder: {
        avoid_muscles: ['shoulders'],
        avoid_exercises: ['overhead_press', 'upright_row', 'behind_neck_press'],
        max_weight_percent: 70,
        require_warmup: true,
        warning_message: 'Evitar movimentos acima da cabeça e rotações extremas',
    },
    lower_back: {
        avoid_muscles: [],
        avoid_exercises: ['deadlift', 'good_morning', 'barbell_row'],
        max_weight_percent: 60,
        require_warmup: true,
        warning_message: 'Evitar exercícios com carga axial pesada',
    },
    knee: {
        avoid_muscles: [],
        avoid_exercises: ['leg_extension', 'deep_squat', 'jumping_exercises'],
        max_weight_percent: 70,
        require_warmup: true,
        warning_message: 'Evitar extensão completa sob carga e impacto',
    },
    wrist: {
        avoid_muscles: [],
        avoid_exercises: ['barbell_curl', 'wrist_curl'],
        max_weight_percent: 80,
        require_warmup: true,
        warning_message: 'Usar pegadas neutras quando possível',
    },
    elbow: {
        avoid_muscles: [],
        avoid_exercises: ['skull_crushers', 'close_grip_bench'],
        max_weight_percent: 75,
        require_warmup: true,
        warning_message: 'Evitar extensão completa sob carga',
    },
};

// ============================================
// SAFETY CHECKS
// ============================================

/**
 * Check workout safety against user context
 */
export function checkWorkoutSafety(
    workout: {
        exercises: Array<{
            id: string;
            name: string;
            muscle: string;
            sets: number;
            reps: number;
            weight_kg?: number;
            rest_seconds: number;
        }>;
        total_duration_minutes: number;
    },
    context: UserContext
): SafetyCheck {
    const violations: SafetyViolation[] = [];

    const ageGroup = getAgeGroup(context.age);
    const ageLimits = AGE_LIMITS[ageGroup];
    const levelLimits = LEVEL_LIMITS[context.fitness_level];

    // Check total exercises
    if (workout.exercises.length > levelLimits.max_exercises_per_workout) {
        violations.push({
            code: 'TOO_MANY_EXERCISES',
            severity: 'warning',
            message: `Máximo ${levelLimits.max_exercises_per_workout} exercícios para seu nível`,
            field: 'exercises',
            original_value: workout.exercises.length,
            safe_value: levelLimits.max_exercises_per_workout,
        });
    }

    // Check total sets
    const totalSets = workout.exercises.reduce((a, e) => a + e.sets, 0);
    const maxSets = Math.min(ageLimits.max_sets_per_workout, levelLimits.max_sets_per_workout);

    if (totalSets > maxSets) {
        violations.push({
            code: 'TOO_MANY_SETS',
            severity: 'warning',
            message: `Máximo ${maxSets} séries para seu perfil`,
            field: 'total_sets',
            original_value: totalSets,
            safe_value: maxSets,
        });
    }

    // Check duration
    if (workout.total_duration_minutes > ABSOLUTE_LIMITS.MAX_WORKOUT_DURATION_MINUTES) {
        violations.push({
            code: 'DURATION_TOO_LONG',
            severity: 'error',
            message: `Duração máxima: ${ABSOLUTE_LIMITS.MAX_WORKOUT_DURATION_MINUTES} minutos`,
            field: 'duration',
            original_value: workout.total_duration_minutes,
            safe_value: ABSOLUTE_LIMITS.MAX_WORKOUT_DURATION_MINUTES,
        });
    }

    // Check individual exercises
    for (const exercise of workout.exercises) {
        // Check sets per exercise
        if (exercise.sets > ABSOLUTE_LIMITS.MAX_SETS_PER_EXERCISE) {
            violations.push({
                code: 'TOO_MANY_SETS_PER_EXERCISE',
                severity: 'warning',
                message: `Máximo ${ABSOLUTE_LIMITS.MAX_SETS_PER_EXERCISE} séries por exercício`,
                field: `exercise_${exercise.id}_sets`,
                original_value: exercise.sets,
                safe_value: ABSOLUTE_LIMITS.MAX_SETS_PER_EXERCISE,
            });
        }

        // Check weight
        if (exercise.weight_kg && exercise.weight_kg > ABSOLUTE_LIMITS.MAX_WEIGHT_KG) {
            violations.push({
                code: 'WEIGHT_TOO_HIGH',
                severity: 'critical',
                message: `Peso máximo: ${ABSOLUTE_LIMITS.MAX_WEIGHT_KG}kg`,
                field: `exercise_${exercise.id}_weight`,
                original_value: exercise.weight_kg,
                safe_value: ABSOLUTE_LIMITS.MAX_WEIGHT_KG,
            });
        }

        // Check rest time
        if (exercise.rest_seconds < levelLimits.min_rest_between_sets_seconds) {
            violations.push({
                code: 'REST_TOO_SHORT',
                severity: 'warning',
                message: `Descanso mínimo: ${levelLimits.min_rest_between_sets_seconds}s para seu nível`,
                field: `exercise_${exercise.id}_rest`,
                original_value: exercise.rest_seconds,
                safe_value: levelLimits.min_rest_between_sets_seconds,
            });
        }

        // Check injury restrictions
        if (context.injuries) {
            for (const injury of context.injuries) {
                const restriction = INJURY_RESTRICTIONS[injury];
                if (!restriction) continue;

                if (restriction.avoid_exercises.includes(exercise.id)) {
                    violations.push({
                        code: 'EXERCISE_RESTRICTED_INJURY',
                        severity: 'error',
                        message: `${exercise.name} não recomendado devido a lesão: ${injury}`,
                        field: `exercise_${exercise.id}`,
                        original_value: exercise.id,
                    });
                }

                if (restriction.avoid_muscles.includes(exercise.muscle)) {
                    violations.push({
                        code: 'MUSCLE_RESTRICTED_INJURY',
                        severity: 'warning',
                        message: `Cuidado com ${exercise.muscle} devido a lesão: ${injury}`,
                        field: `exercise_${exercise.id}_muscle`,
                        original_value: exercise.muscle,
                    });
                }
            }
        }
    }

    // Check for critical violations
    const hasCritical = violations.some(v => v.severity === 'critical');
    const hasError = violations.some(v => v.severity === 'error');

    return {
        passed: !hasCritical && !hasError,
        violations,
    };
}

/**
 * Check progression safety
 */
export function checkProgressionSafety(
    previousWeight: number,
    newWeight: number,
    context: UserContext
): SafetyCheck {
    const violations: SafetyViolation[] = [];

    const ageGroup = getAgeGroup(context.age);
    const ageLimits = AGE_LIMITS[ageGroup];
    const levelLimits = LEVEL_LIMITS[context.fitness_level];

    const maxIncrease = Math.min(
        ageLimits.max_weight_increase_percent,
        levelLimits.max_weight_increase_percent
    );

    const increasePercent = previousWeight > 0
        ? ((newWeight - previousWeight) / previousWeight) * 100
        : 0;

    if (increasePercent > maxIncrease) {
        violations.push({
            code: 'PROGRESSION_TOO_FAST',
            severity: 'warning',
            message: `Aumento máximo recomendado: ${maxIncrease}% por semana`,
            field: 'weight_increase',
            original_value: `${increasePercent.toFixed(1)}%`,
            safe_value: `${maxIncrease}%`,
        });
    }

    if (increasePercent > ABSOLUTE_LIMITS.MAX_WEIGHT_INCREASE_PERCENT_PER_WEEK) {
        violations.push({
            code: 'PROGRESSION_DANGEROUS',
            severity: 'error',
            message: `Aumento de ${increasePercent.toFixed(1)}% é arriscado`,
            field: 'weight_increase',
            original_value: `${increasePercent.toFixed(1)}%`,
            safe_value: `${ABSOLUTE_LIMITS.MAX_WEIGHT_INCREASE_PERCENT_PER_WEEK}%`,
        });
    }

    return {
        passed: violations.every(v => v.severity === 'warning'),
        violations,
    };
}

/**
 * Check weekly volume safety
 */
export function checkWeeklyVolumeSafety(
    previousVolume: number,
    currentVolume: number,
    context: UserContext
): SafetyCheck {
    const violations: SafetyViolation[] = [];

    const increasePercent = previousVolume > 0
        ? ((currentVolume - previousVolume) / previousVolume) * 100
        : 0;

    if (increasePercent > ABSOLUTE_LIMITS.MAX_VOLUME_INCREASE_PERCENT_PER_WEEK) {
        violations.push({
            code: 'VOLUME_SPIKE',
            severity: 'warning',
            message: `Aumento de volume de ${increasePercent.toFixed(0)}% pode aumentar risco de lesão`,
            field: 'weekly_volume',
            original_value: currentVolume,
            safe_value: previousVolume * (1 + ABSOLUTE_LIMITS.MAX_VOLUME_INCREASE_PERCENT_PER_WEEK / 100),
        });
    }

    return {
        passed: violations.length === 0,
        violations,
    };
}

// ============================================
// EXPORT
// ============================================

export {
    checkWorkoutSafety,
    checkProgressionSafety,
    checkWeeklyVolumeSafety,
    getAgeGroup,
};
