/**
 * YOUMOVE - Time Adjuster
 * 
 * Adjusts workouts based on available time.
 * Uses deterministic rules, not AI.
 */

import {
    DURATION_LIMITS,
    EXERCISE_LIMITS,
    type FitnessLevel,
    type TrainingGoal,
} from './safety-limits';

import { type GeneratedWorkout, type GeneratedExercise } from './workout-generator';

// ============================================
// TYPES
// ============================================

export interface TimeAdjustmentResult {
    adjusted_workout: GeneratedWorkout;
    original_duration: number;
    new_duration: number;
    changes: TimeChange[];
}

export interface TimeChange {
    type: 'removed_exercise' | 'reduced_sets' | 'reduced_rest' | 'merged_exercises';
    exercise_id?: string;
    exercise_name?: string;
    original_value?: number;
    new_value?: number;
    reason: string;
}

// ============================================
// TIME ESTIMATES
// ============================================

const TIME_ESTIMATES = {
    WARMUP_MINUTES: 5,
    SECONDS_PER_SET: 45,
    TRANSITION_BETWEEN_EXERCISES: 60, // seconds
    COOLDOWN_MINUTES: 0, // optional
};

// ============================================
// MAIN ADJUSTER
// ============================================

export function adjustWorkoutForTime(
    workout: GeneratedWorkout,
    availableMinutes: number,
    level: FitnessLevel
): TimeAdjustmentResult {
    const changes: TimeChange[] = [];
    let adjustedWorkout = { ...workout, exercises: [...workout.exercises] };

    // Calculate current duration
    let currentDuration = calculateWorkoutDuration(adjustedWorkout);

    // If already fits, return as-is
    if (currentDuration <= availableMinutes) {
        return {
            adjusted_workout: adjustedWorkout,
            original_duration: workout.estimated_duration_minutes,
            new_duration: currentDuration,
            changes: [],
        };
    }

    // STEP 1: Reduce rest times (up to 25%)
    if (currentDuration > availableMinutes) {
        const restReduction = adjustRestTimes(adjustedWorkout, availableMinutes, currentDuration);
        changes.push(...restReduction.changes);
        adjustedWorkout = restReduction.workout;
        currentDuration = calculateWorkoutDuration(adjustedWorkout);
    }

    // STEP 2: Reduce sets on isolation exercises
    if (currentDuration > availableMinutes) {
        const setReduction = reduceIsolationSets(adjustedWorkout, availableMinutes, currentDuration, level);
        changes.push(...setReduction.changes);
        adjustedWorkout = setReduction.workout;
        currentDuration = calculateWorkoutDuration(adjustedWorkout);
    }

    // STEP 3: Remove lowest priority exercises
    if (currentDuration > availableMinutes) {
        const exerciseRemoval = removeExercises(adjustedWorkout, availableMinutes, currentDuration, level);
        changes.push(...exerciseRemoval.changes);
        adjustedWorkout = exerciseRemoval.workout;
        currentDuration = calculateWorkoutDuration(adjustedWorkout);
    }

    // STEP 4: Reduce compound sets (last resort)
    if (currentDuration > availableMinutes) {
        const compoundReduction = reduceCompoundSets(adjustedWorkout, availableMinutes, currentDuration, level);
        changes.push(...compoundReduction.changes);
        adjustedWorkout = compoundReduction.workout;
        currentDuration = calculateWorkoutDuration(adjustedWorkout);
    }

    // Update estimated duration
    adjustedWorkout.estimated_duration_minutes = currentDuration;

    // Add note about time adjustment
    adjustedWorkout.notes = [
        ...adjustedWorkout.notes,
        `Treino ajustado para ${availableMinutes} min (original: ${workout.estimated_duration_minutes} min)`,
    ];

    return {
        adjusted_workout: adjustedWorkout,
        original_duration: workout.estimated_duration_minutes,
        new_duration: currentDuration,
        changes,
    };
}

// ============================================
// CALCULATE DURATION
// ============================================

export function calculateWorkoutDuration(workout: GeneratedWorkout): number {
    let totalSeconds = TIME_ESTIMATES.WARMUP_MINUTES * 60;

    for (const exercise of workout.exercises) {
        // Time for sets
        totalSeconds += exercise.sets * TIME_ESTIMATES.SECONDS_PER_SET;

        // Rest between sets (n-1 rests for n sets)
        totalSeconds += (exercise.sets - 1) * exercise.rest_seconds;

        // Transition to next exercise
        totalSeconds += TIME_ESTIMATES.TRANSITION_BETWEEN_EXERCISES;
    }

    return Math.ceil(totalSeconds / 60);
}

// ============================================
// ADJUSTMENT STRATEGIES
// ============================================

function adjustRestTimes(
    workout: GeneratedWorkout,
    targetMinutes: number,
    currentMinutes: number
): { workout: GeneratedWorkout; changes: TimeChange[] } {
    const changes: TimeChange[] = [];
    const adjusted = { ...workout, exercises: [...workout.exercises] };

    const minutesToSave = currentMinutes - targetMinutes;
    const secondsToSave = minutesToSave * 60;

    // Calculate total rest time
    const totalRestSeconds = adjusted.exercises.reduce(
        (acc, e) => acc + (e.sets - 1) * e.rest_seconds,
        0
    );

    // Max reduction: 25%
    const maxReduction = 0.25;
    const targetReduction = Math.min(secondsToSave / totalRestSeconds, maxReduction);

    if (targetReduction > 0) {
        for (let i = 0; i < adjusted.exercises.length; i++) {
            const exercise = adjusted.exercises[i];
            const newRest = Math.round(exercise.rest_seconds * (1 - targetReduction));

            // Minimum rest: 30 seconds
            const finalRest = Math.max(30, newRest);

            if (finalRest !== exercise.rest_seconds) {
                changes.push({
                    type: 'reduced_rest',
                    exercise_id: exercise.id,
                    exercise_name: exercise.name,
                    original_value: exercise.rest_seconds,
                    new_value: finalRest,
                    reason: 'Descanso reduzido para ajustar tempo',
                });

                adjusted.exercises[i] = { ...exercise, rest_seconds: finalRest };
            }
        }
    }

    return { workout: adjusted, changes };
}

function reduceIsolationSets(
    workout: GeneratedWorkout,
    targetMinutes: number,
    currentMinutes: number,
    level: FitnessLevel
): { workout: GeneratedWorkout; changes: TimeChange[] } {
    const changes: TimeChange[] = [];
    const adjusted = { ...workout, exercises: [...workout.exercises] };

    const isolationExercises = adjusted.exercises.filter(e => e.category === 'isolation');

    // Reduce sets on isolation exercises first
    for (let i = 0; i < adjusted.exercises.length; i++) {
        const exercise = adjusted.exercises[i];

        if (exercise.category !== 'isolation') continue;
        if (exercise.sets <= EXERCISE_LIMITS.SETS_PER_EXERCISE.min) continue;

        const newSets = exercise.sets - 1;

        changes.push({
            type: 'reduced_sets',
            exercise_id: exercise.id,
            exercise_name: exercise.name,
            original_value: exercise.sets,
            new_value: newSets,
            reason: 'Séries de isolamento reduzidas',
        });

        adjusted.exercises[i] = { ...exercise, sets: newSets };

        // Check if we have enough time now
        if (calculateWorkoutDuration(adjusted) <= targetMinutes) {
            break;
        }
    }

    return { workout: adjusted, changes };
}

function removeExercises(
    workout: GeneratedWorkout,
    targetMinutes: number,
    currentMinutes: number,
    level: FitnessLevel
): { workout: GeneratedWorkout; changes: TimeChange[] } {
    const changes: TimeChange[] = [];
    const adjusted = { ...workout, exercises: [...workout.exercises] };

    const minExercises = EXERCISE_LIMITS.EXERCISES_PER_WORKOUT[level].min;

    // Remove from the end (usually less important exercises)
    while (
        adjusted.exercises.length > minExercises &&
        calculateWorkoutDuration(adjusted) > targetMinutes
    ) {
        // Find last isolation exercise
        const lastIsolationIndex = [...adjusted.exercises]
            .reverse()
            .findIndex(e => e.category === 'isolation');

        if (lastIsolationIndex >= 0) {
            const removeIndex = adjusted.exercises.length - 1 - lastIsolationIndex;
            const removed = adjusted.exercises[removeIndex];

            changes.push({
                type: 'removed_exercise',
                exercise_id: removed.id,
                exercise_name: removed.name,
                reason: 'Exercício removido para ajustar tempo',
            });

            adjusted.exercises.splice(removeIndex, 1);
        } else {
            // No more isolation exercises to remove
            break;
        }
    }

    // Re-number orders
    adjusted.exercises = adjusted.exercises.map((e, i) => ({ ...e, order: i + 1 }));

    return { workout: adjusted, changes };
}

function reduceCompoundSets(
    workout: GeneratedWorkout,
    targetMinutes: number,
    currentMinutes: number,
    level: FitnessLevel
): { workout: GeneratedWorkout; changes: TimeChange[] } {
    const changes: TimeChange[] = [];
    const adjusted = { ...workout, exercises: [...workout.exercises] };

    // Only reduce if absolutely necessary
    for (let i = adjusted.exercises.length - 1; i >= 0; i--) {
        const exercise = adjusted.exercises[i];

        if (exercise.sets <= EXERCISE_LIMITS.SETS_PER_EXERCISE.min) continue;

        const newSets = exercise.sets - 1;

        changes.push({
            type: 'reduced_sets',
            exercise_id: exercise.id,
            exercise_name: exercise.name,
            original_value: exercise.sets,
            new_value: newSets,
            reason: 'Séries reduzidas (último recurso)',
        });

        adjusted.exercises[i] = { ...exercise, sets: newSets };

        if (calculateWorkoutDuration(adjusted) <= targetMinutes) {
            break;
        }
    }

    return { workout: adjusted, changes };
}

// ============================================
// EXPAND WORKOUT (if more time available)
// ============================================

export function expandWorkoutForTime(
    workout: GeneratedWorkout,
    availableMinutes: number,
    level: FitnessLevel
): TimeAdjustmentResult {
    const changes: TimeChange[] = [];
    let adjustedWorkout = { ...workout, exercises: [...workout.exercises] };

    const currentDuration = calculateWorkoutDuration(adjustedWorkout);

    // If already at or above available time, return as-is
    if (currentDuration >= availableMinutes) {
        return {
            adjusted_workout: adjustedWorkout,
            original_duration: workout.estimated_duration_minutes,
            new_duration: currentDuration,
            changes: [],
        };
    }

    const maxSets = WEEKLY_VOLUME_LIMITS.SETS_PER_WORKOUT[level].max;
    const currentSets = adjustedWorkout.exercises.reduce((acc, e) => acc + e.sets, 0);

    // Add sets to existing exercises
    while (
        calculateWorkoutDuration(adjustedWorkout) < availableMinutes - 5 && // 5 min buffer
        currentSets < maxSets
    ) {
        // Find exercise with lowest sets (prioritize balance)
        const minSets = Math.min(...adjustedWorkout.exercises.map(e => e.sets));
        const exerciseIndex = adjustedWorkout.exercises.findIndex(
            e => e.sets === minSets && e.sets < EXERCISE_LIMITS.SETS_PER_EXERCISE.max
        );

        if (exerciseIndex < 0) break;

        const exercise = adjustedWorkout.exercises[exerciseIndex];
        adjustedWorkout.exercises[exerciseIndex] = {
            ...exercise,
            sets: exercise.sets + 1,
        };

        changes.push({
            type: 'reduced_sets', // Using same type for simplicity
            exercise_id: exercise.id,
            exercise_name: exercise.name,
            original_value: exercise.sets,
            new_value: exercise.sets + 1,
            reason: 'Série adicionada (tempo extra disponível)',
        });
    }

    const newDuration = calculateWorkoutDuration(adjustedWorkout);
    adjustedWorkout.estimated_duration_minutes = newDuration;

    return {
        adjusted_workout: adjustedWorkout,
        original_duration: workout.estimated_duration_minutes,
        new_duration: newDuration,
        changes,
    };
}

// Import for type reference
import { WEEKLY_VOLUME_LIMITS } from './safety-limits';
