/**
 * YOUMOVE - Progression Engine
 * 
 * Applies simple, evidence-based progression rules.
 * NO AI decision-making for progression.
 */

import {
    INTENSITY_LIMITS,
    PROGRESSION_LIMITS,
    WEEKLY_VOLUME_LIMITS,
    type FitnessLevel,
    type TrainingGoal,
    type MuscleCategory,
} from './safety-limits';

// ============================================
// TYPES
// ============================================

export interface LastPerformance {
    exercise_id: string;
    exercise_name: string;
    muscle: string;
    muscle_category: MuscleCategory;
    sets_completed: number;
    reps_per_set: number[];
    weight_kg: number;
    rpe: number; // Rate of Perceived Exertion (1-10)
    date: string;
}

export interface ProgressionSuggestion {
    exercise_id: string;
    exercise_name: string;
    progression_type: ProgressionType;
    current_weight: number;
    suggested_weight: number;
    current_reps: number;
    suggested_reps: number;
    current_sets: number;
    suggested_sets: number;
    confidence: 'high' | 'medium' | 'low';
    reason: string;
}

export type ProgressionType =
    | 'increase_weight'
    | 'increase_reps'
    | 'increase_sets'
    | 'maintain'
    | 'decrease_weight'
    | 'deload';

export interface ProgressionContext {
    level: FitnessLevel;
    goal: TrainingGoal;
    weeks_since_deload: number;
    consecutive_successful_weeks: number;
    injury_history: string[];
}

// ============================================
// PROGRESSION RULES
// ============================================

/**
 * Simple Linear Progression Rules:
 * 
 * 1. If all target reps achieved with RPE < 8:
 *    → Increase weight (2.5kg upper, 5kg lower)
 * 
 * 2. If target reps achieved with RPE 8-9:
 *    → Add 1-2 reps next session
 * 
 * 3. If target reps NOT achieved (RPE 9-10):
 *    → Maintain current weight, try again
 * 
 * 4. If failed 2 consecutive sessions:
 *    → Reduce weight by 10%
 * 
 * 5. If weeks_since_deload >= threshold:
 *    → Suggest deload week (50% volume)
 */

const PROGRESSION_RULES = {
    // Weight increase thresholds
    WEIGHT_INCREASE: {
        upper_body: 2.5,   // kg
        lower_body: 5.0,   // kg
        isolation: 1.25,   // kg
    },

    // RPE thresholds
    RPE_EASY: 7,         // Below this = ready for progression
    RPE_TARGET: 8,       // Ideal working intensity
    RPE_HARD: 9,         // Maximum sustainable
    RPE_MAX: 10,         // Too hard, risk of failure

    // Rep progression
    REP_INCREMENT: 1,    // Add 1 rep per session
    MAX_REP_OVERFLOW: 2, // Move up weight after +2 reps over target

    // Set progression
    SET_INCREMENT: 1,    // Add 1 set per exercise
    WEEKS_BEFORE_SET_ADD: 4, // Stable for 4 weeks before adding set

    // Failure handling
    CONSECUTIVE_FAILURES_FOR_DELOAD: 2,
    WEIGHT_REDUCTION_PERCENT: 10,

    // Deload parameters
    DELOAD_VOLUME_PERCENT: 50,
    DELOAD_INTENSITY_PERCENT: 60,
} as const;

// ============================================
// MAIN PROGRESSION FUNCTION
// ============================================

export function calculateProgression(
    lastPerformance: LastPerformance,
    targetReps: number,
    context: ProgressionContext
): ProgressionSuggestion {
    const { level, goal, weeks_since_deload, consecutive_successful_weeks } = context;

    // Check if deload is needed
    const deloadThreshold = PROGRESSION_LIMITS.DELOAD_FREQUENCY[level].every;
    if (weeks_since_deload >= deloadThreshold) {
        return createDeloadSuggestion(lastPerformance);
    }

    // Analyze performance
    const avgReps = lastPerformance.reps_per_set.reduce((a, b) => a + b, 0) / lastPerformance.reps_per_set.length;
    const allRepsHit = lastPerformance.reps_per_set.every(r => r >= targetReps);
    const rpe = lastPerformance.rpe;

    // Decision tree
    if (allRepsHit && rpe < PROGRESSION_RULES.RPE_EASY) {
        // Easy! Increase weight
        return createWeightIncreaseSuggestion(lastPerformance, targetReps);
    }

    if (allRepsHit && rpe >= PROGRESSION_RULES.RPE_EASY && rpe <= PROGRESSION_RULES.RPE_TARGET) {
        // Good! Increase reps or prepare for weight increase
        if (avgReps >= targetReps + PROGRESSION_RULES.MAX_REP_OVERFLOW) {
            return createWeightIncreaseSuggestion(lastPerformance, targetReps);
        }
        return createRepIncreaseSuggestion(lastPerformance, targetReps);
    }

    if (allRepsHit && rpe > PROGRESSION_RULES.RPE_TARGET && rpe <= PROGRESSION_RULES.RPE_HARD) {
        // Challenging but successful - maintain
        return createMaintainSuggestion(lastPerformance, targetReps, 'Mantenha até se sentir mais confortável');
    }

    if (!allRepsHit || rpe >= PROGRESSION_RULES.RPE_MAX) {
        // Struggling - check if need to reduce
        if (consecutive_successful_weeks < 0) { // Placeholder for failure tracking
            return createWeightDecreaseSuggestion(lastPerformance, targetReps);
        }
        return createMaintainSuggestion(lastPerformance, targetReps, 'Repita até atingir todas as reps');
    }

    // Default: maintain
    return createMaintainSuggestion(lastPerformance, targetReps, 'Continue com a carga atual');
}

// ============================================
// SUGGESTION CREATORS
// ============================================

function createWeightIncreaseSuggestion(
    perf: LastPerformance,
    targetReps: number
): ProgressionSuggestion {
    const increment = PROGRESSION_RULES.WEIGHT_INCREASE[perf.muscle_category];
    const newWeight = perf.weight_kg + increment;

    return {
        exercise_id: perf.exercise_id,
        exercise_name: perf.exercise_name,
        progression_type: 'increase_weight',
        current_weight: perf.weight_kg,
        suggested_weight: newWeight,
        current_reps: Math.round(perf.reps_per_set.reduce((a, b) => a + b, 0) / perf.reps_per_set.length),
        suggested_reps: targetReps, // Reset to target when increasing weight
        current_sets: perf.sets_completed,
        suggested_sets: perf.sets_completed,
        confidence: 'high',
        reason: `Aumente ${increment}kg - você completou todas as reps com facilidade`,
    };
}

function createRepIncreaseSuggestion(
    perf: LastPerformance,
    targetReps: number
): ProgressionSuggestion {
    const avgReps = Math.round(perf.reps_per_set.reduce((a, b) => a + b, 0) / perf.reps_per_set.length);
    const newReps = Math.min(avgReps + PROGRESSION_RULES.REP_INCREMENT, targetReps + PROGRESSION_RULES.MAX_REP_OVERFLOW);

    return {
        exercise_id: perf.exercise_id,
        exercise_name: perf.exercise_name,
        progression_type: 'increase_reps',
        current_weight: perf.weight_kg,
        suggested_weight: perf.weight_kg,
        current_reps: avgReps,
        suggested_reps: newReps,
        current_sets: perf.sets_completed,
        suggested_sets: perf.sets_completed,
        confidence: 'high',
        reason: `Adicione 1 rep por série antes de aumentar peso`,
    };
}

function createMaintainSuggestion(
    perf: LastPerformance,
    targetReps: number,
    reason: string
): ProgressionSuggestion {
    return {
        exercise_id: perf.exercise_id,
        exercise_name: perf.exercise_name,
        progression_type: 'maintain',
        current_weight: perf.weight_kg,
        suggested_weight: perf.weight_kg,
        current_reps: targetReps,
        suggested_reps: targetReps,
        current_sets: perf.sets_completed,
        suggested_sets: perf.sets_completed,
        confidence: 'medium',
        reason,
    };
}

function createWeightDecreaseSuggestion(
    perf: LastPerformance,
    targetReps: number
): ProgressionSuggestion {
    const reduction = perf.weight_kg * (PROGRESSION_RULES.WEIGHT_REDUCTION_PERCENT / 100);
    const newWeight = Math.round((perf.weight_kg - reduction) * 4) / 4; // Round to 0.25

    return {
        exercise_id: perf.exercise_id,
        exercise_name: perf.exercise_name,
        progression_type: 'decrease_weight',
        current_weight: perf.weight_kg,
        suggested_weight: newWeight,
        current_reps: targetReps,
        suggested_reps: targetReps,
        current_sets: perf.sets_completed,
        suggested_sets: perf.sets_completed,
        confidence: 'high',
        reason: `Reduza 10% e reconstrua - dificuldade excessiva detectada`,
    };
}

function createDeloadSuggestion(
    perf: LastPerformance
): ProgressionSuggestion {
    const deloadWeight = Math.round(perf.weight_kg * (PROGRESSION_RULES.DELOAD_INTENSITY_PERCENT / 100) * 4) / 4;
    const avgReps = Math.round(perf.reps_per_set.reduce((a, b) => a + b, 0) / perf.reps_per_set.length);
    const deloadSets = Math.max(2, Math.round(perf.sets_completed * (PROGRESSION_RULES.DELOAD_VOLUME_PERCENT / 100)));

    return {
        exercise_id: perf.exercise_id,
        exercise_name: perf.exercise_name,
        progression_type: 'deload',
        current_weight: perf.weight_kg,
        suggested_weight: deloadWeight,
        current_reps: avgReps,
        suggested_reps: avgReps, // Keep reps same
        current_sets: perf.sets_completed,
        suggested_sets: deloadSets,
        confidence: 'high',
        reason: `Semana de deload - reduza volume e intensidade para recuperação`,
    };
}

// ============================================
// BATCH PROGRESSION
// ============================================

export function calculateWorkoutProgression(
    performances: LastPerformance[],
    targetRepsMap: Record<string, number>,
    context: ProgressionContext
): ProgressionSuggestion[] {
    return performances.map(perf =>
        calculateProgression(perf, targetRepsMap[perf.exercise_id] || 10, context)
    );
}

// ============================================
// PROGRESSION SUMMARY
// ============================================

export function summarizeProgression(suggestions: ProgressionSuggestion[]): {
    total_exercises: number;
    increasing: number;
    maintaining: number;
    decreasing: number;
    deload_recommended: boolean;
    overall_trend: 'progressing' | 'stable' | 'regressing' | 'deload';
} {
    const increasing = suggestions.filter(s =>
        s.progression_type === 'increase_weight' || s.progression_type === 'increase_reps'
    ).length;

    const maintaining = suggestions.filter(s => s.progression_type === 'maintain').length;

    const decreasing = suggestions.filter(s => s.progression_type === 'decrease_weight').length;

    const deload = suggestions.some(s => s.progression_type === 'deload');

    let overall_trend: 'progressing' | 'stable' | 'regressing' | 'deload';

    if (deload) {
        overall_trend = 'deload';
    } else if (increasing > suggestions.length / 2) {
        overall_trend = 'progressing';
    } else if (decreasing > suggestions.length / 3) {
        overall_trend = 'regressing';
    } else {
        overall_trend = 'stable';
    }

    return {
        total_exercises: suggestions.length,
        increasing,
        maintaining,
        decreasing,
        deload_recommended: deload,
        overall_trend,
    };
}
