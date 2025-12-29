/**
 * YOUMOVE - Safety Validator
 * 
 * Validates workouts against hardcoded safety limits.
 * This is the FINAL checkpoint before any workout is approved.
 * 
 * AI suggestions MUST pass through this validator.
 */

import {
    WEEKLY_VOLUME_LIMITS,
    INTENSITY_LIMITS,
    FREQUENCY_LIMITS,
    DURATION_LIMITS,
    EXERCISE_LIMITS,
    REP_RANGES,
    PROGRESSION_LIMITS,
    INJURY_LIMITS,
    getAgeGroup,
    AGE_MODIFIERS,
    type FitnessLevel,
    type TrainingGoal,
} from './safety-limits';

// ============================================
// TYPES
// ============================================

export interface ValidationResult {
    valid: boolean;
    warnings: ValidationWarning[];
    errors: ValidationError[];
    adjustments: Adjustment[];
}

export interface ValidationWarning {
    code: string;
    message: string;
    field: string;
    current_value: number | string;
    recommended_value: number | string;
}

export interface ValidationError {
    code: string;
    message: string;
    field: string;
    current_value: number | string;
    limit: number | string;
}

export interface Adjustment {
    field: string;
    original_value: number | string;
    adjusted_value: number | string;
    reason: string;
}

export interface WorkoutToValidate {
    exercises: {
        id: string;
        sets: number;
        reps: number;
        weight_kg: number;
        rest_seconds: number;
        muscle: string;
        category: 'compound' | 'isolation';
    }[];
    estimated_duration_minutes: number;
    goal: TrainingGoal;
    level: FitnessLevel;
    user_age: number;
}

export interface WeeklyContextToValidate {
    current_week_sessions: number;
    current_week_volume_per_muscle: Record<string, number>;
    last_week_total_volume: number;
    consecutive_training_days: number;
    days_since_deload: number;
    recent_max_rpe: number;
}

// ============================================
// MAIN VALIDATOR
// ============================================

export function validateWorkout(
    workout: WorkoutToValidate,
    weeklyContext?: WeeklyContextToValidate
): ValidationResult {
    const result: ValidationResult = {
        valid: true,
        warnings: [],
        errors: [],
        adjustments: [],
    };

    // === DURATION VALIDATION ===
    validateDuration(workout, result);

    // === EXERCISE COUNT VALIDATION ===
    validateExerciseCount(workout, result);

    // === SETS VALIDATION ===
    validateSets(workout, result);

    // === REPS VALIDATION ===
    validateReps(workout, result);

    // === REST VALIDATION ===
    validateRest(workout, result);

    // === INTENSITY (if weight provided) ===
    validateIntensity(workout, result);

    // === WEEKLY CONTEXT VALIDATION ===
    if (weeklyContext) {
        validateWeeklyContext(workout, weeklyContext, result);
    }

    // === AGE-BASED VALIDATION ===
    validateAgeFactors(workout, result);

    // Set overall validity
    result.valid = result.errors.length === 0;

    return result;
}

// ============================================
// DURATION VALIDATION
// ============================================

function validateDuration(workout: WorkoutToValidate, result: ValidationResult): void {
    const limits = DURATION_LIMITS.WORKOUT_DURATION;

    if (workout.estimated_duration_minutes < limits.min) {
        result.errors.push({
            code: 'DURATION_TOO_SHORT',
            message: `Duração mínima é ${limits.min} minutos`,
            field: 'estimated_duration_minutes',
            current_value: workout.estimated_duration_minutes,
            limit: limits.min,
        });
    }

    if (workout.estimated_duration_minutes > limits.max) {
        result.errors.push({
            code: 'DURATION_TOO_LONG',
            message: `Duração máxima é ${limits.max} minutos`,
            field: 'estimated_duration_minutes',
            current_value: workout.estimated_duration_minutes,
            limit: limits.max,
        });
    }

    const optimal = limits.optimal[workout.level];
    if (workout.estimated_duration_minutes > optimal.max) {
        result.warnings.push({
            code: 'DURATION_ABOVE_OPTIMAL',
            message: `Duração acima do ideal para nível ${workout.level}`,
            field: 'estimated_duration_minutes',
            current_value: workout.estimated_duration_minutes,
            recommended_value: optimal.max,
        });
    }
}

// ============================================
// EXERCISE COUNT VALIDATION
// ============================================

function validateExerciseCount(workout: WorkoutToValidate, result: ValidationResult): void {
    const limits = EXERCISE_LIMITS.EXERCISES_PER_WORKOUT[workout.level];
    const count = workout.exercises.length;

    if (count < limits.min) {
        result.warnings.push({
            code: 'TOO_FEW_EXERCISES',
            message: `Mínimo recomendado: ${limits.min} exercícios`,
            field: 'exercise_count',
            current_value: count,
            recommended_value: limits.min,
        });
    }

    if (count > limits.max) {
        result.errors.push({
            code: 'TOO_MANY_EXERCISES',
            message: `Máximo permitido: ${limits.max} exercícios`,
            field: 'exercise_count',
            current_value: count,
            limit: limits.max,
        });
    }

    // Check compound ratio
    const compoundCount = workout.exercises.filter(e => e.category === 'compound').length;
    const ratio = count > 0 ? compoundCount / count : 0;
    const minRatio = EXERCISE_LIMITS.COMPOUND_RATIO[workout.level].min;

    if (ratio < minRatio) {
        result.warnings.push({
            code: 'LOW_COMPOUND_RATIO',
            message: `Poucos exercícios compostos. Mínimo: ${Math.round(minRatio * 100)}%`,
            field: 'compound_ratio',
            current_value: `${Math.round(ratio * 100)}%`,
            recommended_value: `${Math.round(minRatio * 100)}%`,
        });
    }
}

// ============================================
// SETS VALIDATION
// ============================================

function validateSets(workout: WorkoutToValidate, result: ValidationResult): void {
    const totalSets = workout.exercises.reduce((acc, e) => acc + e.sets, 0);
    const limits = WEEKLY_VOLUME_LIMITS.SETS_PER_WORKOUT[workout.level];

    if (totalSets < limits.min) {
        result.warnings.push({
            code: 'LOW_TOTAL_SETS',
            message: `Poucas séries totais. Mínimo: ${limits.min}`,
            field: 'total_sets',
            current_value: totalSets,
            recommended_value: limits.min,
        });
    }

    if (totalSets > limits.max) {
        result.errors.push({
            code: 'TOO_MANY_SETS',
            message: `Séries totais excedem o limite. Máximo: ${limits.max}`,
            field: 'total_sets',
            current_value: totalSets,
            limit: limits.max,
        });
    }

    // Per-exercise validation
    for (const exercise of workout.exercises) {
        if (exercise.sets < EXERCISE_LIMITS.SETS_PER_EXERCISE.min) {
            result.warnings.push({
                code: 'LOW_SETS_EXERCISE',
                message: `Mínimo ${EXERCISE_LIMITS.SETS_PER_EXERCISE.min} séries por exercício`,
                field: `exercise_${exercise.id}_sets`,
                current_value: exercise.sets,
                recommended_value: EXERCISE_LIMITS.SETS_PER_EXERCISE.min,
            });
        }

        if (exercise.sets > EXERCISE_LIMITS.SETS_PER_EXERCISE.max) {
            result.adjustments.push({
                field: `exercise_${exercise.id}_sets`,
                original_value: exercise.sets,
                adjusted_value: EXERCISE_LIMITS.SETS_PER_EXERCISE.max,
                reason: 'Séries ajustadas para limite máximo',
            });
        }
    }
}

// ============================================
// REPS VALIDATION
// ============================================

function validateReps(workout: WorkoutToValidate, result: ValidationResult): void {
    // Map goal to REP_RANGES key with fallback to general_fitness
    const goalToRepRange: Record<string, keyof typeof REP_RANGES> = {
        'strength': 'strength',
        'power': 'power',
        'hypertrophy': 'hypertrophy',
        'endurance': 'endurance',
        'general_fitness': 'general_fitness',
        'fat_loss': 'hypertrophy', // Fat loss uses hypertrophy rep ranges
        'maintenance': 'general_fitness',
        'rehabilitation': 'endurance',
    };

    const repRangeKey = goalToRepRange[workout.goal] || 'general_fitness';
    const goalReps = REP_RANGES[repRangeKey];

    for (const exercise of workout.exercises) {
        if (exercise.reps < REP_RANGES.ABSOLUTE.min) {
            result.errors.push({
                code: 'REPS_TOO_LOW',
                message: `Mínimo ${REP_RANGES.ABSOLUTE.min} repetição`,
                field: `exercise_${exercise.id}_reps`,
                current_value: exercise.reps,
                limit: REP_RANGES.ABSOLUTE.min,
            });
        }

        if (exercise.reps > REP_RANGES.ABSOLUTE.max) {
            result.errors.push({
                code: 'REPS_TOO_HIGH',
                message: `Máximo ${REP_RANGES.ABSOLUTE.max} repetições`,
                field: `exercise_${exercise.id}_reps`,
                current_value: exercise.reps,
                limit: REP_RANGES.ABSOLUTE.max,
            });
        }

        // Goal-specific warning (with safe fallback)
        if (goalReps && 'min' in goalReps && 'max' in goalReps) {
            if (exercise.reps < goalReps.min || exercise.reps > goalReps.max) {
                result.warnings.push({
                    code: 'REPS_OUTSIDE_GOAL_RANGE',
                    message: `Repetições fora da faixa ideal para ${workout.goal}`,
                    field: `exercise_${exercise.id}_reps`,
                    current_value: exercise.reps,
                    recommended_value: `${goalReps.min}-${goalReps.max}`,
                });
            }
        }
    }
}

// ============================================
// REST VALIDATION
// ============================================

function validateRest(workout: WorkoutToValidate, result: ValidationResult): void {
    const goalKey = workout.goal === 'general_fitness' ? 'hypertrophy' : workout.goal;
    const restLimits = DURATION_LIMITS.REST_BETWEEN_SETS[goalKey as keyof typeof DURATION_LIMITS.REST_BETWEEN_SETS]
        || DURATION_LIMITS.REST_BETWEEN_SETS.hypertrophy;

    for (const exercise of workout.exercises) {
        if (exercise.rest_seconds < restLimits.min) {
            result.warnings.push({
                code: 'REST_TOO_SHORT',
                message: `Descanso curto demais para ${workout.goal}`,
                field: `exercise_${exercise.id}_rest`,
                current_value: exercise.rest_seconds,
                recommended_value: restLimits.min,
            });
        }

        if (exercise.rest_seconds > restLimits.max) {
            result.warnings.push({
                code: 'REST_TOO_LONG',
                message: `Descanso longo demais para ${workout.goal}`,
                field: `exercise_${exercise.id}_rest`,
                current_value: exercise.rest_seconds,
                recommended_value: restLimits.max,
            });
        }
    }
}

// ============================================
// INTENSITY VALIDATION
// ============================================

function validateIntensity(workout: WorkoutToValidate, result: ValidationResult): void {
    // Only validate if weights are provided
    const exercisesWithWeight = workout.exercises.filter(e => e.weight_kg > 0);

    if (exercisesWithWeight.length === 0) return;

    // Note: Full intensity validation requires 1RM data which we don't have here
    // This is a placeholder for when that data is available
}

// ============================================
// WEEKLY CONTEXT VALIDATION
// ============================================

function validateWeeklyContext(
    workout: WorkoutToValidate,
    context: WeeklyContextToValidate,
    result: ValidationResult
): void {
    const level = workout.level;

    // Check consecutive training days
    if (context.consecutive_training_days >= FREQUENCY_LIMITS.MAX_CONSECUTIVE_DAYS[level]) {
        result.errors.push({
            code: 'TOO_MANY_CONSECUTIVE_DAYS',
            message: `Máximo ${FREQUENCY_LIMITS.MAX_CONSECUTIVE_DAYS[level]} dias seguidos`,
            field: 'consecutive_training_days',
            current_value: context.consecutive_training_days,
            limit: FREQUENCY_LIMITS.MAX_CONSECUTIVE_DAYS[level],
        });
    }

    // Check if deload is needed
    if (context.days_since_deload >= PROGRESSION_LIMITS.DELOAD_FREQUENCY[level].every * 7) {
        result.warnings.push({
            code: 'DELOAD_RECOMMENDED',
            message: `Considere uma semana de deload`,
            field: 'days_since_deload',
            current_value: context.days_since_deload,
            recommended_value: `Deload após ${PROGRESSION_LIMITS.DELOAD_FREQUENCY[level].every} semanas`,
        });
    }

    // Check volume spike
    const thisWorkoutVolume = workout.exercises.reduce(
        (acc, e) => acc + (e.sets * e.reps * (e.weight_kg || 1)),
        0
    );

    if (context.last_week_total_volume > 0) {
        const projectedWeeklyVolume = Object.values(context.current_week_volume_per_muscle)
            .reduce((a, b) => a + b, 0) + thisWorkoutVolume;

        const volumeIncrease = ((projectedWeeklyVolume - context.last_week_total_volume) / context.last_week_total_volume) * 100;

        if (volumeIncrease > INJURY_LIMITS.WARNINGS.volume_spike_percent) {
            result.warnings.push({
                code: 'VOLUME_SPIKE',
                message: `Aumento de volume acima de ${INJURY_LIMITS.WARNINGS.volume_spike_percent}%`,
                field: 'weekly_volume',
                current_value: `+${Math.round(volumeIncrease)}%`,
                recommended_value: `Máximo +${INJURY_LIMITS.WARNINGS.volume_spike_percent}%`,
            });
        }
    }

    // Check high intensity frequency
    if (context.recent_max_rpe >= 9 && context.consecutive_training_days >= INJURY_LIMITS.MAX_HIGH_INTENSITY_CONSECUTIVE) {
        result.warnings.push({
            code: 'HIGH_INTENSITY_FREQUENCY',
            message: 'Muitos treinos de alta intensidade seguidos',
            field: 'intensity_frequency',
            current_value: context.consecutive_training_days,
            recommended_value: INJURY_LIMITS.MAX_HIGH_INTENSITY_CONSECUTIVE,
        });
    }
}

// ============================================
// AGE VALIDATION
// ============================================

function validateAgeFactors(workout: WorkoutToValidate, result: ValidationResult): void {
    const ageGroup = getAgeGroup(workout.user_age);
    const volumeModifier = AGE_MODIFIERS.VOLUME_MULTIPLIER[ageGroup];

    // For older users, check if volume is appropriate
    if (volumeModifier < 1.0) {
        const totalSets = workout.exercises.reduce((acc, e) => acc + e.sets, 0);
        const maxSets = Math.round(WEEKLY_VOLUME_LIMITS.SETS_PER_WORKOUT[workout.level].max * volumeModifier);

        if (totalSets > maxSets) {
            result.warnings.push({
                code: 'HIGH_VOLUME_FOR_AGE',
                message: `Volume alto para faixa etária ${ageGroup}`,
                field: 'age_adjusted_volume',
                current_value: totalSets,
                recommended_value: maxSets,
            });
        }
    }
}

// ============================================
// APPLY AUTOMATIC ADJUSTMENTS
// ============================================

export function applyAdjustments<T extends WorkoutToValidate>(
    workout: T,
    adjustments: Adjustment[]
): T {
    const adjusted = { ...workout, exercises: [...workout.exercises] };

    for (const adj of adjustments) {
        // Parse field to find exercise and property
        const match = adj.field.match(/exercise_(.+)_(.+)/);
        if (match) {
            const [, exerciseId, property] = match;
            const exerciseIndex = adjusted.exercises.findIndex(e => e.id === exerciseId);

            if (exerciseIndex >= 0) {
                (adjusted.exercises[exerciseIndex] as Record<string, unknown>)[property] = adj.adjusted_value;
            }
        }
    }

    return adjusted;
}

// ============================================
// VALIDATE AI SUGGESTION
// ============================================

export function validateAISuggestion(
    aiSuggestion: WorkoutToValidate,
    userLevel: FitnessLevel,
    userAge: number
): ValidationResult & { sanitized: WorkoutToValidate } {
    // Force AI suggestion to use user's actual level (AI can't upgrade)
    const sanitizedSuggestion = {
        ...aiSuggestion,
        level: userLevel,
        user_age: userAge,
    };

    const result = validateWorkout(sanitizedSuggestion);

    // Apply mandatory adjustments
    const adjusted = applyAdjustments(sanitizedSuggestion, result.adjustments);

    return {
        ...result,
        sanitized: adjusted,
    };
}
