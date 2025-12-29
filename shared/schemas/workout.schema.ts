/**
 * YOUMOVE - Workout Schema Definitions
 * Core schemas for workout plans, exercises, and sessions
 */

import { z } from 'zod';

// ============================================
// Exercise Schema
// ============================================
export const MuscleGroupSchema = z.enum([
    'chest',
    'back',
    'shoulders',
    'biceps',
    'triceps',
    'forearms',
    'core',
    'quadriceps',
    'hamstrings',
    'glutes',
    'calves',
    'hip_flexors',
    'full_body'
]);

export const ExerciseSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(2).max(100),
    description: z.string().max(1000).nullable(),

    // Classification
    primary_muscle: MuscleGroupSchema,
    secondary_muscles: z.array(MuscleGroupSchema).default([]),
    movement_type: z.enum(['compound', 'isolation']),
    equipment_required: z.array(z.string()).default([]),

    // Difficulty & Metrics
    difficulty_level: z.number().min(1).max(10),
    calories_per_minute: z.number().positive().nullable(),

    // Media
    video_url: z.string().url().nullable(),
    thumbnail_url: z.string().url().nullable(),
    instructions: z.array(z.string()).default([]),
    tips: z.array(z.string()).default([]),

    // Metadata
    is_active: z.boolean().default(true),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});

export type Exercise = z.infer<typeof ExerciseSchema>;
export type MuscleGroup = z.infer<typeof MuscleGroupSchema>;

// ============================================
// Workout Set Schema
// ============================================
export const WorkoutSetSchema = z.object({
    set_number: z.number().min(1),
    set_type: z.enum(['warmup', 'working', 'dropset', 'failure', 'rest_pause']).default('working'),

    // Targets
    target_reps: z.number().min(1).max(100).nullable(),
    target_weight_kg: z.number().min(0).nullable(),
    target_duration_seconds: z.number().min(1).nullable(), // for timed exercises
    target_distance_meters: z.number().min(0).nullable(), // for cardio
    target_rpe: z.number().min(1).max(10).nullable(), // Rate of Perceived Exertion

    // Actuals (filled during workout)
    actual_reps: z.number().min(0).nullable(),
    actual_weight_kg: z.number().min(0).nullable(),
    actual_duration_seconds: z.number().min(0).nullable(),
    actual_distance_meters: z.number().min(0).nullable(),
    actual_rpe: z.number().min(1).max(10).nullable(),

    // Rest
    rest_seconds: z.number().min(0).default(60),

    // Status
    completed: z.boolean().default(false),
    skipped: z.boolean().default(false),
    notes: z.string().max(500).nullable(),
});

export type WorkoutSet = z.infer<typeof WorkoutSetSchema>;

// ============================================
// Workout Exercise (Exercise in a Workout)
// ============================================
export const WorkoutExerciseSchema = z.object({
    id: z.string().uuid(),
    exercise_id: z.string().uuid(),
    exercise: ExerciseSchema.optional(), // Populated via join
    order: z.number().min(1),
    sets: z.array(WorkoutSetSchema),
    superset_group: z.number().nullable(), // Group exercises in supersets
    notes: z.string().max(500).nullable(),
});

export type WorkoutExercise = z.infer<typeof WorkoutExerciseSchema>;

// ============================================
// Workout Plan Schema
// ============================================
export const WorkoutPlanSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),

    // Basic Info
    name: z.string().min(2).max(100),
    description: z.string().max(1000).nullable(),

    // Classification
    plan_type: z.enum([
        'strength',
        'hypertrophy',
        'endurance',
        'hiit',
        'cardio',
        'flexibility',
        'sport_specific',
        'rehabilitation',
        'custom'
    ]),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'elite']),

    // Structure
    duration_weeks: z.number().min(1).max(52),
    days_per_week: z.number().min(1).max(7),
    avg_workout_duration_minutes: z.number().min(15).max(180),

    // AI Generated
    is_ai_generated: z.boolean().default(false),
    ai_generation_prompt: z.string().nullable(),

    // Status
    is_active: z.boolean().default(true),
    is_public: z.boolean().default(false),

    // Metadata
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});

export type WorkoutPlan = z.infer<typeof WorkoutPlanSchema>;

// ============================================
// Daily Workout Schema
// ============================================
export const DailyWorkoutSchema = z.object({
    id: z.string().uuid(),
    plan_id: z.string().uuid(),
    user_id: z.string().uuid(),

    // Schedule
    scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    day_number: z.number().min(1), // Day within the plan
    week_number: z.number().min(1), // Week within the plan

    // Workout Details
    name: z.string().min(2).max(100),
    focus: z.array(MuscleGroupSchema).default([]),
    estimated_duration_minutes: z.number().min(1),
    exercises: z.array(WorkoutExerciseSchema),

    // Execution
    status: z.enum(['scheduled', 'in_progress', 'completed', 'skipped', 'partial']).default('scheduled'),
    started_at: z.string().datetime().nullable(),
    completed_at: z.string().datetime().nullable(),
    actual_duration_minutes: z.number().nullable(),

    // Metrics
    total_volume_kg: z.number().default(0), // weight × reps across all sets
    total_sets_completed: z.number().default(0),
    total_reps_completed: z.number().default(0),
    avg_rpe: z.number().nullable(),
    calories_burned: z.number().nullable(),

    // Feedback
    user_rating: z.number().min(1).max(5).nullable(),
    user_notes: z.string().max(1000).nullable(),

    // Metadata
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});

export type DailyWorkout = z.infer<typeof DailyWorkoutSchema>;

// ============================================
// Workout Session (Active Workout Tracking)
// ============================================
export const WorkoutSessionSchema = z.object({
    id: z.string().uuid(),
    daily_workout_id: z.string().uuid(),
    user_id: z.string().uuid(),

    // Progress
    current_exercise_index: z.number().min(0),
    current_set_index: z.number().min(0),

    // Timing
    started_at: z.string().datetime(),
    last_activity_at: z.string().datetime(),
    paused_at: z.string().datetime().nullable(),
    total_pause_duration_seconds: z.number().default(0),

    // Status
    status: z.enum(['active', 'paused', 'completed', 'abandoned']),

    // Device Info
    device_id: z.string().nullable(),
    app_version: z.string().nullable(),
});

export type WorkoutSession = z.infer<typeof WorkoutSessionSchema>;
