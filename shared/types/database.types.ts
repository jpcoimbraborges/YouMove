/**
 * YOUMOVE - Database Types
 * Auto-aligned with Supabase schema
 * Version: 1.0.0
 */

// ============================================
// ENUMS (mirror database enums)
// ============================================

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_say';

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite';

export type Goal =
    | 'lose_weight'
    | 'build_muscle'
    | 'improve_endurance'
    | 'increase_strength'
    | 'general_fitness'
    | 'flexibility'
    | 'sport_specific';

export type SubscriptionTier = 'free' | 'pro' | 'elite';

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial';

export type MuscleGroup =
    | 'chest'
    | 'back'
    | 'shoulders'
    | 'biceps'
    | 'triceps'
    | 'forearms'
    | 'core'
    | 'quadriceps'
    | 'hamstrings'
    | 'glutes'
    | 'calves'
    | 'hip_flexors'
    | 'full_body';

export type MovementType = 'compound' | 'isolation';

export type WorkoutType =
    | 'strength'
    | 'hypertrophy'
    | 'endurance'
    | 'hiit'
    | 'cardio'
    | 'flexibility'
    | 'sport_specific'
    | 'rehabilitation'
    | 'custom';

export type WorkoutStatus = 'scheduled' | 'in_progress' | 'completed' | 'skipped' | 'partial';

export type SetType = 'warmup' | 'working' | 'dropset' | 'failure' | 'rest_pause';

export type SessionStatus = 'active' | 'paused' | 'completed' | 'abandoned';

export type UserRole = 'user' | 'trainer' | 'admin';

export type Theme = 'light' | 'dark' | 'system';

export type UnitSystem = 'metric' | 'imperial';

export type AIPersonality = 'motivational' | 'strict' | 'friendly' | 'analytical';

// ============================================
// BASE TYPES
// ============================================

export interface Timestamps {
    created_at: string;
    updated_at: string;
}

export interface WithId {
    id: string;
}

// ============================================
// USER PROFILE
// ============================================

export interface UserProfile extends WithId, Timestamps {
    email: string;
    full_name: string;
    avatar_url: string | null;

    // Physical Data
    birth_date: string | null;
    gender: Gender | null;
    height_cm: number | null;
    weight_kg: number | null;

    // Fitness Profile
    fitness_level: FitnessLevel;
    primary_goal: Goal | null;

    // Preferences
    preferred_workout_duration: number;
    preferred_workout_days: number[];
    equipment_available: string[];
    injuries_or_limitations: string[];

    // Settings
    theme: Theme;
    unit_system: UnitSystem;
    language: string;
    push_notifications_enabled: boolean;
    workout_reminders: boolean;
    reminder_time: string;

    // AI Preferences
    ai_coach_personality: AIPersonality;
    ai_suggestions_enabled: boolean;

    // Role & Status
    role: UserRole;
    onboarding_completed: boolean;
    is_active: boolean;
}

// ============================================
// SUBSCRIPTION
// ============================================

export interface Subscription extends WithId, Timestamps {
    user_id: string;
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    started_at: string;
    expires_at: string | null;
    cancelled_at: string | null;
    trial_ends_at: string | null;
    payment_provider: string | null;
    payment_provider_id: string | null;
}

// ============================================
// EXERCISE
// ============================================

export interface Exercise extends WithId, Timestamps {
    name: string;
    name_pt: string | null;
    description: string | null;

    // Classification
    primary_muscle: MuscleGroup;
    secondary_muscles: MuscleGroup[];
    movement_type: MovementType;
    equipment_required: string[];

    // Difficulty & Metrics
    difficulty_level: number | null;
    calories_per_minute: number | null;

    // Media
    video_url: string | null;
    thumbnail_url: string | null;
    instructions: string[];
    tips: string[];

    // Search
    tags: string[];

    // Admin
    created_by: string | null;
    is_active: boolean;
    is_public: boolean;
}

// ============================================
// WORKOUT SET (JSONB structure)
// ============================================

export interface WorkoutSet {
    set_number: number;
    set_type: SetType;

    // Targets
    target_reps: number | null;
    target_weight_kg: number | null;
    target_duration_seconds: number | null;
    target_rpe: number | null;
    rest_seconds: number;

    // Actuals (filled during workout)
    actual_reps: number | null;
    actual_weight_kg: number | null;
    actual_duration_seconds: number | null;
    actual_rpe: number | null;

    // Status
    completed: boolean;
    skipped: boolean;
    notes: string | null;
}

// ============================================
// WORKOUT EXERCISE (JSONB structure)
// ============================================

export interface WorkoutExercise {
    exercise_id: string;
    order: number;
    sets: WorkoutSet[];
    superset_group: number | null;
    notes: string | null;
}

// ============================================
// WORKOUT (Plan)
// ============================================

export interface Workout extends WithId, Timestamps {
    user_id: string;

    // Basic Info
    name: string;
    description: string | null;

    // Classification
    workout_type: WorkoutType;
    difficulty: FitnessLevel;
    target_muscles: MuscleGroup[];

    // Structure
    duration_weeks: number;
    days_per_week: number;
    avg_duration_minutes: number;

    // Exercises
    exercises: WorkoutExercise[];

    // AI Generated
    is_ai_generated: boolean;
    ai_generation_prompt: string | null;

    // Status & Visibility
    is_active: boolean;
    is_public: boolean;
    is_template: boolean;
}

// ============================================
// WORKOUT SESSION
// ============================================

export interface WorkoutSession extends WithId, Timestamps {
    user_id: string;
    workout_id: string | null;

    // Schedule
    scheduled_date: string;
    day_number: number;
    week_number: number;

    // Details
    name: string;
    focus: MuscleGroup[];
    estimated_duration_minutes: number;

    // Exercises snapshot
    exercises: WorkoutExercise[];

    // Execution
    status: WorkoutStatus;
    started_at: string | null;
    completed_at: string | null;
    actual_duration_minutes: number | null;

    // Calculated Metrics
    total_volume_kg: number;
    total_sets_completed: number;
    total_reps_completed: number;
    avg_rpe: number | null;
    calories_burned: number | null;

    // User Feedback
    user_rating: number | null;
    user_notes: string | null;
}

// ============================================
// WORKOUT LOG
// ============================================

export interface WorkoutLog extends WithId, Timestamps {
    user_id: string;
    session_id: string;
    exercise_id: string | null;

    // Order
    exercise_order: number;

    // Sets
    sets: WorkoutSet[];

    // Calculated
    total_volume_kg: number;
    total_reps: number;
    max_weight_kg: number | null;
    avg_rpe: number | null;

    // Notes
    notes: string | null;
    form_rating: number | null;
}

// ============================================
// PROGRESS METRIC
// ============================================

export interface ProgressMetric extends WithId, Timestamps {
    user_id: string;

    // Period
    metric_date: string;
    week_number: number | null;
    year: number | null;

    // Body Metrics
    weight_kg: number | null;
    body_fat_percent: number | null;

    // Volume Metrics
    weekly_volume_kg: number;
    volume_by_muscle: Record<MuscleGroup, number>;

    // Session Metrics
    total_workouts: number;
    total_duration_minutes: number;
    total_sets: number;
    total_reps: number;

    // Intensity
    avg_rpe: number | null;
    max_rpe: number | null;

    // Consistency
    planned_workouts: number;
    completed_workouts: number;
    consistency_score: number;
    streak_days: number;
}

// ============================================
// PERSONAL RECORD
// ============================================

export type RecordType = 'max_weight' | 'max_reps' | 'max_volume' | 'max_1rm';

export interface PersonalRecord extends WithId {
    user_id: string;
    exercise_id: string;
    record_type: RecordType;

    // Values
    weight_kg: number | null;
    reps: number | null;
    volume_kg: number | null;
    estimated_1rm: number | null;

    // Context
    session_id: string | null;
    achieved_at: string;

    // Previous Record
    previous_value: number | null;
    improvement_percent: number | null;

    created_at: string;
}
