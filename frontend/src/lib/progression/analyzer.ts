/**
 * YOUMOVE - Progression Analyzer
 * 
 * Analyzes workout history and suggests progressive overload strategies
 * based on user level, recent performance, and safety limits.
 */

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite';
export type ProgressionType = 'increase_weight' | 'increase_reps' | 'add_set' | 'maintain' | 'deload';
export type Confidence = 'high' | 'medium' | 'low';

// ============================================
// INTERFACES
// ============================================

export interface ExerciseSession {
    date: string;
    sets: number;
    target_reps: number;
    weight_kg: number;
    completed_reps: number[];  // Array with actual reps per set
    rpe?: number;  // Rate of Perceived Exertion (1-10)
}

export interface ExerciseHistory {
    exercise_id: string;
    exercise_name: string;
    sessions: ExerciseSession[];
}

export interface ProgressionSuggestion {
    exercise_id: string;
    exercise_name: string;
    current: {
        sets: number;
        reps: number;
        weight_kg: number;
    };
    suggested: {
        sets: number;
        reps: number;
        weight_kg: number;
    };
    change: {
        weight_diff_kg: number;
        weight_percent: number;
        reps_diff: number;
        sets_diff: number;
    };
    reasoning: string;
    confidence: Confidence;
    type: ProgressionType;
}

// ============================================
// SAFETY LIMITS
// ============================================

const SAFETY_LIMITS = {
    beginner: {
        max_weight_increase_percent: 5,
        max_reps_increase: 2,
        max_sets: 4,
        min_recovery_days: 3
    },
    intermediate: {
        max_weight_increase_percent: 7.5,
        max_reps_increase: 3,
        max_sets: 5,
        min_recovery_days: 2
    },
    advanced: {
        max_weight_increase_percent: 10,
        max_reps_increase: 5,
        max_sets: 6,
        min_recovery_days: 2
    },
    elite: {
        max_weight_increase_percent: 15,
        max_reps_increase: 5,
        max_sets: 8,
        min_recovery_days: 1
    }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function daysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function mean(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

function roundToNearestPlate(weight: number): number {
    // Round to nearest 2.5kg (standard plate increment)
    return Math.round(weight / 2.5) * 2.5;
}

// ============================================
// MAIN ANALYZER FUNCTION
// ============================================

export function analyzeProgression(
    history: ExerciseHistory,
    userLevel: FitnessLevel = 'intermediate'
): ProgressionSuggestion | null {

    // 1. Validate minimum data
    if (!history.sessions || history.sessions.length < 2) {
        return null;  // Not enough data
    }

    const limits = SAFETY_LIMITS[userLevel];
    const recentSessions = history.sessions.slice(0, 3);  // Last 3 sessions
    const lastSession = recentSessions[0];

    // 2. Check recovery time
    const daysSinceLastWorkout = daysSince(lastSession.date);
    const isRecovered = daysSinceLastWorkout >= limits.min_recovery_days;

    if (!isRecovered) {
        return {
            exercise_id: history.exercise_id,
            exercise_name: history.exercise_name,
            current: {
                sets: lastSession.sets,
                reps: lastSession.target_reps,
                weight_kg: lastSession.weight_kg
            },
            suggested: {
                sets: lastSession.sets,
                reps: lastSession.target_reps,
                weight_kg: lastSession.weight_kg
            },
            change: {
                weight_diff_kg: 0,
                weight_percent: 0,
                reps_diff: 0,
                sets_diff: 0
            },
            reasoning: `Descanse mais ${limits.min_recovery_days - daysSinceLastWorkout} dia(s). Recuperação é essencial para evitar lesões.`,
            confidence: 'high',
            type: 'maintain'
        };
    }

    // 3. Calculate performance metrics
    const targetReps = lastSession.target_reps;
    const completionRates = recentSessions.map(session => {
        const avgCompleted = mean(session.completed_reps);
        return avgCompleted / session.target_reps;
    });

    const avgCompletionRate = mean(completionRates);
    const allSetsCompleted = recentSessions.every(session =>
        session.completed_reps.every(reps => reps >= session.target_reps)
    );

    // 4. Check for declining performance (deload signal)
    if (completionRates.length >= 2) {
        const isDeclining = completionRates[0] < completionRates[1] * 0.9;  // 10% drop
        if (isDeclining && avgCompletionRate < 0.8) {
            const deloadWeight = roundToNearestPlate(lastSession.weight_kg * 0.9);  // 10% reduction

            return {
                exercise_id: history.exercise_id,
                exercise_name: history.exercise_name,
                current: {
                    sets: lastSession.sets,
                    reps: lastSession.target_reps,
                    weight_kg: lastSession.weight_kg
                },
                suggested: {
                    sets: lastSession.sets,
                    reps: lastSession.target_reps,
                    weight_kg: deloadWeight
                },
                change: {
                    weight_diff_kg: deloadWeight - lastSession.weight_kg,
                    weight_percent: -10,
                    reps_diff: 0,
                    sets_diff: 0
                },
                reasoning: 'Sua performance caiu nos últimos treinos. Um deload temporário ajudará na recuperação.',
                confidence: 'high',
                type: 'deload'
            };
        }
    }

    // 5. PROGRESSION RULES

    // Rule 1: Increase Weight (completed all reps for 2+ sessions)
    if (allSetsCompleted && recentSessions.length >= 2) {
        const increasePercent = limits.max_weight_increase_percent / 100;
        const suggestedWeight = roundToNearestPlate(lastSession.weight_kg * (1 + increasePercent));

        return {
            exercise_id: history.exercise_id,
            exercise_name: history.exercise_name,
            current: {
                sets: lastSession.sets,
                reps: lastSession.target_reps,
                weight_kg: lastSession.weight_kg
            },
            suggested: {
                sets: lastSession.sets,
                reps: lastSession.target_reps,
                weight_kg: suggestedWeight
            },
            change: {
                weight_diff_kg: suggestedWeight - lastSession.weight_kg,
                weight_percent: Math.round(((suggestedWeight - lastSession.weight_kg) / lastSession.weight_kg) * 100),
                reps_diff: 0,
                sets_diff: 0
            },
            reasoning: `Excelente! Você completou ${targetReps} reps em todas as séries nos últimos ${recentSessions.length} treinos. Hora de aumentar a carga!`,
            confidence: 'high',
            type: 'increase_weight'
        };
    }

    // Rule 2: Increase Reps (close to target but not quite there)
    if (avgCompletionRate >= 0.85 && avgCompletionRate < 1.0) {
        const suggestedReps = Math.min(
            targetReps + limits.max_reps_increase,
            targetReps + 2  // Conservative: max +2 reps
        );

        return {
            exercise_id: history.exercise_id,
            exercise_name: history.exercise_name,
            current: {
                sets: lastSession.sets,
                reps: lastSession.target_reps,
                weight_kg: lastSession.weight_kg
            },
            suggested: {
                sets: lastSession.sets,
                reps: suggestedReps,
                weight_kg: lastSession.weight_kg
            },
            change: {
                weight_diff_kg: 0,
                weight_percent: 0,
                reps_diff: suggestedReps - targetReps,
                sets_diff: 0
            },
            reasoning: `Você está quase lá! Tente ${suggestedReps} reps por série para construir volume antes de aumentar a carga.`,
            confidence: 'medium',
            type: 'increase_reps'
        };
    }

    // Rule 3: Add Set (low volume)
    if (lastSession.sets < limits.max_sets && avgCompletionRate >= 0.9) {
        return {
            exercise_id: history.exercise_id,
            exercise_name: history.exercise_name,
            current: {
                sets: lastSession.sets,
                reps: lastSession.target_reps,
                weight_kg: lastSession.weight_kg
            },
            suggested: {
                sets: lastSession.sets + 1,
                reps: lastSession.target_reps,
                weight_kg: lastSession.weight_kg
            },
            change: {
                weight_diff_kg: 0,
                weight_percent: 0,
                reps_diff: 0,
                sets_diff: 1
            },
            reasoning: 'Adicione mais uma série para aumentar o volume total de treino.',
            confidence: 'medium',
            type: 'add_set'
        };
    }

    // Default: Maintain
    return {
        exercise_id: history.exercise_id,
        exercise_name: history.exercise_name,
        current: {
            sets: lastSession.sets,
            reps: lastSession.target_reps,
            weight_kg: lastSession.weight_kg
        },
        suggested: {
            sets: lastSession.sets,
            reps: lastSession.target_reps,
            weight_kg: lastSession.weight_kg
        },
        change: {
            weight_diff_kg: 0,
            weight_percent: 0,
            reps_diff: 0,
            sets_diff: 0
        },
        reasoning: 'Continue com a carga atual e foque na execução perfeita. A progressão virá.',
        confidence: 'medium',
        type: 'maintain'
    };
}

// ============================================
// BATCH ANALYSIS FOR MULTIPLE EXERCISES
// ============================================

export function analyzeWorkoutProgression(
    exercises: ExerciseHistory[],
    userLevel: FitnessLevel = 'intermediate'
): ProgressionSuggestion[] {
    return exercises
        .map(exercise => analyzeProgression(exercise, userLevel))
        .filter((suggestion): suggestion is ProgressionSuggestion => suggestion !== null);
}
