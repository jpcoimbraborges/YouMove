/**
 * YOUMOVE - Base Workout Templates
 * 
 * Pre-defined workout structures by goal.
 * These templates are deterministic and evidence-based.
 */

import {
    FitnessLevel,
    TrainingGoal,
    REP_RANGES,
    DURATION_LIMITS
} from './safety-limits';

// ============================================
// TYPES
// ============================================

export interface MuscleGroupTarget {
    primary: MuscleGroup;
    secondary: MuscleGroup[];
}

export type MuscleGroup =
    | 'chest'
    | 'back'
    | 'shoulders'
    | 'biceps'
    | 'triceps'
    | 'quadriceps'
    | 'hamstrings'
    | 'glutes'
    | 'calves'
    | 'core'
    | 'forearms'
    | 'traps';

export interface ExerciseTemplate {
    exercise_id: string;
    name: string;
    muscle: MuscleGroup;
    category: 'compound' | 'isolation';
    sets: number;
    reps: { min: number; max: number };
    rest_seconds: number;
    order: number;
    substitutes?: string[]; // IDs of alternative exercises
}

export interface WorkoutTemplate {
    id: string;
    name: string;
    goal: TrainingGoal;
    level: FitnessLevel;
    muscles: MuscleGroupTarget;
    estimated_duration_minutes: number;
    exercises: ExerciseTemplate[];
}

export interface WeeklyPlan {
    goal: TrainingGoal;
    level: FitnessLevel;
    days_per_week: number;
    workouts: WorkoutTemplate[];
}

// ============================================
// MUSCLE GROUP PAIRINGS (Evidence-Based)
// ============================================

export const MUSCLE_PAIRINGS = {
    // Push muscles
    push: ['chest', 'shoulders', 'triceps'] as MuscleGroup[],

    // Pull muscles
    pull: ['back', 'biceps', 'forearms', 'traps'] as MuscleGroup[],

    // Leg muscles
    legs: ['quadriceps', 'hamstrings', 'glutes', 'calves'] as MuscleGroup[],

    // Upper body
    upper: ['chest', 'back', 'shoulders', 'biceps', 'triceps'] as MuscleGroup[],

    // Lower body
    lower: ['quadriceps', 'hamstrings', 'glutes', 'calves'] as MuscleGroup[],

    // Synergist pairings
    chest_triceps: ['chest', 'triceps'] as MuscleGroup[],
    back_biceps: ['back', 'biceps'] as MuscleGroup[],
    shoulders_arms: ['shoulders', 'biceps', 'triceps'] as MuscleGroup[],
} as const;

// ============================================
// SPLIT CONFIGURATIONS
// ============================================

export const SPLIT_CONFIGS = {
    // 2 days per week
    2: {
        type: 'full_body',
        structure: [
            { day: 1, muscles: ['chest', 'back', 'shoulders', 'quadriceps', 'hamstrings', 'core'] },
            { day: 2, muscles: ['chest', 'back', 'shoulders', 'quadriceps', 'hamstrings', 'core'] },
        ],
    },

    // 3 days per week
    3: {
        type: 'push_pull_legs',
        structure: [
            { day: 1, muscles: ['chest', 'shoulders', 'triceps'] },
            { day: 2, muscles: ['back', 'biceps', 'traps'] },
            { day: 3, muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'] },
        ],
    },

    // 4 days per week
    4: {
        type: 'upper_lower',
        structure: [
            { day: 1, muscles: ['chest', 'back', 'shoulders'] },
            { day: 2, muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'] },
            { day: 3, muscles: ['chest', 'back', 'biceps', 'triceps'] },
            { day: 4, muscles: ['quadriceps', 'hamstrings', 'glutes', 'core'] },
        ],
    },

    // 5 days per week
    5: {
        type: 'push_pull_legs_upper_lower',
        structure: [
            { day: 1, muscles: ['chest', 'shoulders', 'triceps'] },
            { day: 2, muscles: ['back', 'biceps', 'traps'] },
            { day: 3, muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'] },
            { day: 4, muscles: ['chest', 'back', 'shoulders'] },
            { day: 5, muscles: ['quadriceps', 'hamstrings', 'glutes', 'core'] },
        ],
    },

    // 6 days per week
    6: {
        type: 'push_pull_legs_x2',
        structure: [
            { day: 1, muscles: ['chest', 'shoulders', 'triceps'] },
            { day: 2, muscles: ['back', 'biceps', 'traps'] },
            { day: 3, muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'] },
            { day: 4, muscles: ['chest', 'shoulders', 'triceps'] },
            { day: 5, muscles: ['back', 'biceps', 'traps'] },
            { day: 6, muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'core'] },
        ],
    },
} as const;

// ============================================
// GOAL-BASED PARAMETERS
// ============================================

export const GOAL_PARAMETERS = {
    strength: {
        sets_per_exercise: { min: 3, max: 5 },
        reps: REP_RANGES.strength,
        rest_seconds: DURATION_LIMITS.REST_BETWEEN_SETS.strength,
        compound_priority: 0.8,
        intensity_rpe: { min: 7, max: 9 },
    },

    power: {
        sets_per_exercise: { min: 3, max: 6 },
        reps: REP_RANGES.power,
        rest_seconds: DURATION_LIMITS.REST_BETWEEN_SETS.power,
        compound_priority: 0.9,
        intensity_rpe: { min: 8, max: 10 },
    },

    hypertrophy: {
        sets_per_exercise: { min: 3, max: 4 },
        reps: REP_RANGES.hypertrophy,
        rest_seconds: DURATION_LIMITS.REST_BETWEEN_SETS.hypertrophy,
        compound_priority: 0.6,
        intensity_rpe: { min: 6, max: 8 },
    },

    endurance: {
        sets_per_exercise: { min: 2, max: 3 },
        reps: REP_RANGES.endurance,
        rest_seconds: DURATION_LIMITS.REST_BETWEEN_SETS.endurance,
        compound_priority: 0.5,
        intensity_rpe: { min: 5, max: 7 },
    },

    general_fitness: {
        sets_per_exercise: { min: 2, max: 4 },
        reps: REP_RANGES.general_fitness,
        rest_seconds: { min: 60, max: 90 },
        compound_priority: 0.6,
        intensity_rpe: { min: 5, max: 7 },
    },
} as const;

// ============================================
// EXERCISE DATABASE MAPPING
// ============================================

export const EXERCISE_TEMPLATES: Record<MuscleGroup, {
    compound: { id: string; name: string; substitutes: string[] }[];
    isolation: { id: string; name: string; substitutes: string[] }[];
}> = {
    chest: {
        compound: [
            { id: 'bench_press', name: 'Supino Reto', substitutes: ['dumbbell_press', 'incline_press'] },
            { id: 'incline_press', name: 'Supino Inclinado', substitutes: ['incline_dumbbell', 'chest_press_machine'] },
            { id: 'dips', name: 'Paralelas', substitutes: ['decline_press', 'machine_dips'] },
        ],
        isolation: [
            { id: 'cable_fly', name: 'Crucifixo Cabo', substitutes: ['pec_deck', 'dumbbell_fly'] },
            { id: 'dumbbell_fly', name: 'Crucifixo Halter', substitutes: ['cable_fly', 'pec_deck'] },
        ],
    },
    back: {
        compound: [
            { id: 'pull_ups', name: 'Barra Fixa', substitutes: ['lat_pulldown', 'assisted_pullup'] },
            { id: 'barbell_row', name: 'Remada Curvada', substitutes: ['cable_row', 'dumbbell_row'] },
            { id: 'deadlift', name: 'Levantamento Terra', substitutes: ['romanian_deadlift', 'rack_pull'] },
        ],
        isolation: [
            { id: 'straight_arm_pulldown', name: 'Pulldown Braço Reto', substitutes: ['cable_pullover'] },
            { id: 'face_pull', name: 'Face Pull', substitutes: ['rear_delt_fly'] },
        ],
    },
    shoulders: {
        compound: [
            { id: 'overhead_press', name: 'Desenvolvimento', substitutes: ['dumbbell_press', 'machine_press'] },
            { id: 'arnold_press', name: 'Arnold Press', substitutes: ['dumbbell_press'] },
        ],
        isolation: [
            { id: 'lateral_raise', name: 'Elevação Lateral', substitutes: ['cable_lateral', 'machine_lateral'] },
            { id: 'front_raise', name: 'Elevação Frontal', substitutes: ['cable_front_raise'] },
            { id: 'rear_delt_fly', name: 'Crucifixo Inverso', substitutes: ['face_pull', 'cable_rear_delt'] },
        ],
    },
    biceps: {
        compound: [],
        isolation: [
            { id: 'barbell_curl', name: 'Rosca Direta', substitutes: ['ez_bar_curl', 'dumbbell_curl'] },
            { id: 'hammer_curl', name: 'Rosca Martelo', substitutes: ['rope_hammer_curl'] },
            { id: 'incline_curl', name: 'Rosca Inclinada', substitutes: ['preacher_curl'] },
        ],
    },
    triceps: {
        compound: [
            { id: 'close_grip_bench', name: 'Supino Pegada Fechada', substitutes: ['tricep_dips'] },
        ],
        isolation: [
            { id: 'tricep_pushdown', name: 'Tríceps Corda', substitutes: ['straight_bar_pushdown'] },
            { id: 'overhead_extension', name: 'Tríceps Francês', substitutes: ['cable_overhead'] },
            { id: 'skull_crushers', name: 'Tríceps Testa', substitutes: ['ez_bar_extension'] },
        ],
    },
    quadriceps: {
        compound: [
            { id: 'squat', name: 'Agachamento Livre', substitutes: ['leg_press', 'hack_squat'] },
            { id: 'leg_press', name: 'Leg Press', substitutes: ['squat', 'hack_squat'] },
            { id: 'front_squat', name: 'Agachamento Frontal', substitutes: ['goblet_squat'] },
        ],
        isolation: [
            { id: 'leg_extension', name: 'Cadeira Extensora', substitutes: ['single_leg_extension'] },
        ],
    },
    hamstrings: {
        compound: [
            { id: 'romanian_deadlift', name: 'Stiff', substitutes: ['good_morning', 'cable_pull_through'] },
        ],
        isolation: [
            { id: 'leg_curl', name: 'Mesa Flexora', substitutes: ['seated_leg_curl', 'nordic_curl'] },
            { id: 'seated_leg_curl', name: 'Cadeira Flexora', substitutes: ['leg_curl'] },
        ],
    },
    glutes: {
        compound: [
            { id: 'hip_thrust', name: 'Hip Thrust', substitutes: ['glute_bridge', 'cable_kickback'] },
            { id: 'bulgarian_split_squat', name: 'Afundo Búlgaro', substitutes: ['lunges', 'step_up'] },
        ],
        isolation: [
            { id: 'cable_kickback', name: 'Coice no Cabo', substitutes: ['glute_machine'] },
            { id: 'abduction_machine', name: 'Abdução', substitutes: ['banded_abduction'] },
        ],
    },
    calves: {
        compound: [],
        isolation: [
            { id: 'standing_calf_raise', name: 'Panturrilha em Pé', substitutes: ['seated_calf', 'leg_press_calf'] },
            { id: 'seated_calf_raise', name: 'Panturrilha Sentado', substitutes: ['standing_calf'] },
        ],
    },
    core: {
        compound: [
            { id: 'cable_woodchop', name: 'Rotação no Cabo', substitutes: ['medicine_ball_throw'] },
        ],
        isolation: [
            { id: 'plank', name: 'Prancha', substitutes: ['dead_bug'] },
            { id: 'hanging_leg_raise', name: 'Elevação de Pernas', substitutes: ['lying_leg_raise', 'captain_chair'] },
            { id: 'cable_crunch', name: 'Abdominal no Cabo', substitutes: ['decline_crunch'] },
        ],
    },
    forearms: {
        compound: [],
        isolation: [
            { id: 'wrist_curl', name: 'Rosca de Punho', substitutes: ['reverse_wrist_curl'] },
            { id: 'farmer_walk', name: 'Farmer Walk', substitutes: ['grip_trainer'] },
        ],
    },
    traps: {
        compound: [
            { id: 'power_shrug', name: 'Encolhimento', substitutes: ['dumbbell_shrug'] },
        ],
        isolation: [
            { id: 'dumbbell_shrug', name: 'Encolhimento Halter', substitutes: ['cable_shrug'] },
        ],
    },
};

// ============================================
// LEVEL-BASED ADJUSTMENTS
// ============================================

export const LEVEL_ADJUSTMENTS = {
    beginner: {
        exercise_count_modifier: 0.7,
        set_count_modifier: 0.8,
        prefer_machines: true,
        compound_ratio: 0.8,
        rest_modifier: 1.2,
    },
    intermediate: {
        exercise_count_modifier: 1.0,
        set_count_modifier: 1.0,
        prefer_machines: false,
        compound_ratio: 0.7,
        rest_modifier: 1.0,
    },
    advanced: {
        exercise_count_modifier: 1.1,
        set_count_modifier: 1.1,
        prefer_machines: false,
        compound_ratio: 0.6,
        rest_modifier: 0.9,
    },
    elite: {
        exercise_count_modifier: 1.2,
        set_count_modifier: 1.2,
        prefer_machines: false,
        compound_ratio: 0.5,
        rest_modifier: 0.85,
    },
} as const;
