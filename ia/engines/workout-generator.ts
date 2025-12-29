/**
 * YOUMOVE - Workout Generator (Deterministic)
 * 
 * Generates workouts based on fixed rules and templates.
 * NO AI decision-making for safety-critical parameters.
 */

import {
    WEEKLY_VOLUME_LIMITS,
    INTENSITY_LIMITS,
    FREQUENCY_LIMITS,
    DURATION_LIMITS,
    EXERCISE_LIMITS,
    REP_RANGES,
    applyAgeModifier,
    type FitnessLevel,
    type TrainingGoal,
} from './safety-limits';

import {
    SPLIT_CONFIGS,
    GOAL_PARAMETERS,
    EXERCISE_TEMPLATES,
    LEVEL_ADJUSTMENTS,
    type MuscleGroup,
    type ExerciseTemplate,
    type WorkoutTemplate,
} from './workout-templates';

// ============================================
// TYPES
// ============================================

export interface UserProfile {
    id: string;
    fitness_level: FitnessLevel;
    goal: TrainingGoal;
    age: number;
    available_days: number[]; // 0-6 (Sunday-Saturday)
    available_duration_minutes: number;
    available_equipment: string[];
    injuries?: string[];
}

export interface GeneratedWorkout {
    id: string;
    name: string;
    day_of_week: number;
    estimated_duration_minutes: number;
    muscles_targeted: MuscleGroup[];
    exercises: GeneratedExercise[];
    notes: string[];
}

export interface GeneratedExercise {
    id: string;
    exercise_id: string;
    name: string;
    muscle: MuscleGroup;
    category: 'compound' | 'isolation';
    sets: number;
    target_reps: number;
    rest_seconds: number;
    order: number;
    notes?: string;
}

export interface WeeklyPlan {
    id: string;
    user_id: string;
    goal: TrainingGoal;
    level: FitnessLevel;
    total_volume_sets: number;
    workouts: GeneratedWorkout[];
    created_at: string;
}

// ============================================
// MAIN GENERATOR
// ============================================

export function generateWeeklyPlan(profile: UserProfile): WeeklyPlan {
    const daysPerWeek = Math.min(
        profile.available_days.length,
        FREQUENCY_LIMITS.DAYS_PER_WEEK[profile.fitness_level].max
    );

    // Validate minimum days
    if (daysPerWeek < FREQUENCY_LIMITS.DAYS_PER_WEEK[profile.fitness_level].min) {
        throw new Error(
            `Minimum ${FREQUENCY_LIMITS.DAYS_PER_WEEK[profile.fitness_level].min} days required for ${profile.fitness_level} level`
        );
    }

    // Get split configuration
    const splitDays = Math.min(6, Math.max(2, daysPerWeek)) as 2 | 3 | 4 | 5 | 6;
    const split = SPLIT_CONFIGS[splitDays];

    // Generate workouts for each day
    const workouts: GeneratedWorkout[] = [];

    for (let i = 0; i < daysPerWeek; i++) {
        const dayConfig = split.structure[i % split.structure.length];
        const dayOfWeek = profile.available_days[i];

        const workout = generateSingleWorkout({
            profile,
            muscles: dayConfig.muscles as MuscleGroup[],
            dayOfWeek,
            workoutNumber: i + 1,
        });

        workouts.push(workout);
    }

    // Calculate total volume
    const totalSets = workouts.reduce(
        (acc, w) => acc + w.exercises.reduce((a, e) => a + e.sets, 0),
        0
    );

    return {
        id: `plan_${Date.now()}`,
        user_id: profile.id,
        goal: profile.goal,
        level: profile.fitness_level,
        total_volume_sets: totalSets,
        workouts,
        created_at: new Date().toISOString(),
    };
}

// ============================================
// SINGLE WORKOUT GENERATOR
// ============================================

interface WorkoutConfig {
    profile: UserProfile;
    muscles: MuscleGroup[];
    dayOfWeek: number;
    workoutNumber: number;
}

export function generateSingleWorkout(config: WorkoutConfig): GeneratedWorkout {
    const { profile, muscles, dayOfWeek, workoutNumber } = config;

    const goalParams = GOAL_PARAMETERS[profile.goal];
    const levelAdjust = LEVEL_ADJUSTMENTS[profile.fitness_level];

    // Calculate exercise count based on time and level
    const baseExerciseCount = EXERCISE_LIMITS.EXERCISES_PER_WORKOUT[profile.fitness_level];
    const timeBasedCount = Math.floor(profile.available_duration_minutes / 8); // ~8 min per exercise avg
    const exerciseCount = Math.min(
        Math.round(baseExerciseCount.max * levelAdjust.exercise_count_modifier),
        timeBasedCount
    );

    // Select exercises
    const exercises: GeneratedExercise[] = [];
    let order = 1;

    // Prioritize compound exercises
    const compoundCount = Math.ceil(exerciseCount * levelAdjust.compound_ratio);
    const isolationCount = exerciseCount - compoundCount;

    // Distribute exercises across muscle groups
    const muscleQueue = [...muscles];
    let compoundAdded = 0;
    let isolationAdded = 0;

    // Add compound exercises first (bigger movements)
    for (const muscle of muscleQueue) {
        if (compoundAdded >= compoundCount) break;

        const compounds = EXERCISE_TEMPLATES[muscle]?.compound || [];
        if (compounds.length > 0) {
            const exercise = compounds[0]; // Primary compound
            exercises.push(
                createExercise(exercise, muscle, 'compound', goalParams, levelAdjust, order++, profile)
            );
            compoundAdded++;
        }
    }

    // Add isolation exercises
    for (const muscle of muscleQueue) {
        if (isolationAdded >= isolationCount) break;

        const isolations = EXERCISE_TEMPLATES[muscle]?.isolation || [];
        if (isolations.length > 0) {
            const exercise = isolations[0]; // Primary isolation
            exercises.push(
                createExercise(exercise, muscle, 'isolation', goalParams, levelAdjust, order++, profile)
            );
            isolationAdded++;
        }
    }

    // Calculate estimated duration
    const totalSets = exercises.reduce((acc, e) => acc + e.sets, 0);
    const avgSetTime = 45; // seconds per set
    const totalRestTime = exercises.reduce(
        (acc, e) => acc + (e.sets - 1) * e.rest_seconds,
        0
    );
    const estimatedDuration = Math.round(
        (totalSets * avgSetTime + totalRestTime) / 60 + 5 // +5 min warmup
    );

    // Generate workout name
    const name = generateWorkoutName(muscles, workoutNumber);

    return {
        id: `workout_${dayOfWeek}_${Date.now()}`,
        name,
        day_of_week: dayOfWeek,
        estimated_duration_minutes: estimatedDuration,
        muscles_targeted: muscles,
        exercises,
        notes: generateWorkoutNotes(profile, exercises),
    };
}

// ============================================
// EXERCISE CREATION
// ============================================

function createExercise(
    template: { id: string; name: string; substitutes: string[] },
    muscle: MuscleGroup,
    category: 'compound' | 'isolation',
    goalParams: typeof GOAL_PARAMETERS.hypertrophy,
    levelAdjust: typeof LEVEL_ADJUSTMENTS.intermediate,
    order: number,
    profile: UserProfile
): GeneratedExercise {
    // Calculate sets
    const baseSets = Math.round(
        (goalParams.sets_per_exercise.min + goalParams.sets_per_exercise.max) / 2
    );
    const sets = Math.round(baseSets * levelAdjust.set_count_modifier);

    // Calculate reps (use middle of range)
    const targetReps = goalParams.reps.optimal;

    // Calculate rest (apply level modifier)
    const baseRest = (goalParams.rest_seconds.min + goalParams.rest_seconds.max) / 2;
    const restSeconds = Math.round(baseRest * levelAdjust.rest_modifier);

    // Apply age modifier to rest
    const ageAdjustedRest = applyAgeModifier(restSeconds, profile.age, 'recovery');

    return {
        id: `ex_${order}_${Date.now()}`,
        exercise_id: template.id,
        name: template.name,
        muscle,
        category,
        sets: Math.max(EXERCISE_LIMITS.SETS_PER_EXERCISE.min, Math.min(EXERCISE_LIMITS.SETS_PER_EXERCISE.max, sets)),
        target_reps: targetReps,
        rest_seconds: ageAdjustedRest,
        order,
    };
}

// ============================================
// HELPERS
// ============================================

function generateWorkoutName(muscles: MuscleGroup[], number: number): string {
    const muscleNames: Record<MuscleGroup, string> = {
        chest: 'Peito',
        back: 'Costas',
        shoulders: 'Ombros',
        biceps: 'Bíceps',
        triceps: 'Tríceps',
        quadriceps: 'Quadríceps',
        hamstrings: 'Posterior',
        glutes: 'Glúteos',
        calves: 'Panturrilha',
        core: 'Core',
        forearms: 'Antebraço',
        traps: 'Trapézio',
    };

    // Group muscles logically
    const hasPush = muscles.some(m => ['chest', 'shoulders', 'triceps'].includes(m));
    const hasPull = muscles.some(m => ['back', 'biceps'].includes(m));
    const hasLegs = muscles.some(m => ['quadriceps', 'hamstrings', 'glutes', 'calves'].includes(m));

    if (hasLegs && !hasPush && !hasPull) {
        return `Treino ${number} - Pernas`;
    }
    if (hasPush && !hasPull && !hasLegs) {
        return `Treino ${number} - Push (Empurrar)`;
    }
    if (hasPull && !hasPush && !hasLegs) {
        return `Treino ${number} - Pull (Puxar)`;
    }
    if (hasPush && hasPull && !hasLegs) {
        return `Treino ${number} - Superior`;
    }
    if (hasLegs && !hasPush && !hasPull) {
        return `Treino ${number} - Inferior`;
    }

    // Default: list main muscles
    const mainMuscles = muscles.slice(0, 2).map(m => muscleNames[m]).join(' e ');
    return `Treino ${number} - ${mainMuscles}`;
}

function generateWorkoutNotes(profile: UserProfile, exercises: GeneratedExercise[]): string[] {
    const notes: string[] = [];

    // Warmup reminder
    notes.push('Faça 5-10 min de aquecimento antes de iniciar');

    // Level-specific notes
    if (profile.fitness_level === 'beginner') {
        notes.push('Foque na técnica antes de aumentar o peso');
        notes.push('Não chegue à falha muscular nas primeiras semanas');
    }

    // Goal-specific notes
    if (profile.goal === 'strength') {
        notes.push('Priorize descanso completo entre séries');
    } else if (profile.goal === 'hypertrophy') {
        notes.push('Mantenha a tensão muscular durante todo o movimento');
    }

    return notes;
}

// ============================================
// EXPORT
// ============================================

export {
    generateWeeklyPlan,
    generateSingleWorkout
};
