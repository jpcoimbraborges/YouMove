/**
 * YOUMOVE - API Types
 * Request/Response DTOs for API communication
 * Version: 1.0.0
 */

import type {
    UserProfile,
    Exercise,
    Workout,
    WorkoutSession,
    WorkoutLog,
    ProgressMetric,
    WorkoutExercise,
    WorkoutSet,
    FitnessLevel,
    Goal,
    Gender,
    MuscleGroup,
    WorkoutType,
    WorkoutStatus,
} from './database.types';

// ============================================
// API RESPONSE WRAPPER
// ============================================

export interface ApiResponse<T> {
    success: boolean;
    data: T | null;
    error: ApiError | null;
    meta?: ApiMeta;
}

export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}

export interface ApiMeta {
    page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
}

// ============================================
// PAGINATION
// ============================================

export interface PaginationParams {
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
    items: T[];
    meta: Required<ApiMeta>;
}

// ============================================
// AUTH DTOs
// ============================================

export interface SignUpRequest {
    email: string;
    password: string;
    full_name: string;
}

export interface SignInRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: UserProfile;
    access_token: string;
    refresh_token: string;
    expires_at: number;
}

export interface ResetPasswordRequest {
    email: string;
}

export interface UpdatePasswordRequest {
    current_password: string;
    new_password: string;
}

// ============================================
// USER PROFILE DTOs
// ============================================

export interface CreateProfileRequest {
    full_name: string;
    birth_date?: string;
    gender?: Gender;
    height_cm?: number;
    weight_kg?: number;
    fitness_level?: FitnessLevel;
    primary_goal?: Goal;
    preferred_workout_duration?: number;
    preferred_workout_days?: number[];
    equipment_available?: string[];
    injuries_or_limitations?: string[];
}

export interface UpdateProfileRequest extends Partial<CreateProfileRequest> {
    avatar_url?: string;
    theme?: 'light' | 'dark' | 'system';
    unit_system?: 'metric' | 'imperial';
    language?: string;
    push_notifications_enabled?: boolean;
    workout_reminders?: boolean;
    reminder_time?: string;
    ai_coach_personality?: 'motivational' | 'strict' | 'friendly' | 'analytical';
    ai_suggestions_enabled?: boolean;
}

export interface OnboardingRequest {
    full_name: string;
    birth_date: string;
    gender: Gender;
    height_cm: number;
    weight_kg: number;
    fitness_level: FitnessLevel;
    primary_goal: Goal;
    preferred_workout_duration: number;
    preferred_workout_days: number[];
    equipment_available: string[];
    injuries_or_limitations: string[];
}

// ============================================
// EXERCISE DTOs
// ============================================

export interface ExerciseFilters {
    muscle_group?: MuscleGroup;
    movement_type?: 'compound' | 'isolation';
    equipment?: string[];
    difficulty_min?: number;
    difficulty_max?: number;
    search?: string;
}

export interface CreateExerciseRequest {
    name: string;
    name_pt?: string;
    description?: string;
    primary_muscle: MuscleGroup;
    secondary_muscles?: MuscleGroup[];
    movement_type: 'compound' | 'isolation';
    equipment_required?: string[];
    difficulty_level?: number;
    instructions?: string[];
    tips?: string[];
    tags?: string[];
}

export interface UpdateExerciseRequest extends Partial<CreateExerciseRequest> {
    video_url?: string;
    thumbnail_url?: string;
}

// ============================================
// WORKOUT DTOs
// ============================================

export interface CreateWorkoutRequest {
    name: string;
    description?: string;
    workout_type: WorkoutType;
    difficulty?: FitnessLevel;
    target_muscles?: MuscleGroup[];
    duration_weeks?: number;
    days_per_week?: number;
    avg_duration_minutes?: number;
    exercises: WorkoutExercise[];
    is_public?: boolean;
}

export interface UpdateWorkoutRequest extends Partial<CreateWorkoutRequest> {
    is_active?: boolean;
}

export interface WorkoutFilters {
    workout_type?: WorkoutType;
    difficulty?: FitnessLevel;
    target_muscle?: MuscleGroup;
    duration_min?: number;
    duration_max?: number;
    is_ai_generated?: boolean;
    is_public?: boolean;
}

// ============================================
// WORKOUT SESSION DTOs
// ============================================

export interface CreateSessionRequest {
    workout_id?: string;
    scheduled_date: string;
    name: string;
    focus?: MuscleGroup[];
    estimated_duration_minutes?: number;
    exercises: WorkoutExercise[];
}

export interface StartSessionRequest {
    session_id: string;
}

export interface UpdateSessionRequest {
    status?: WorkoutStatus;
    exercises?: WorkoutExercise[];
    user_rating?: number;
    user_notes?: string;
}

export interface CompleteSessionRequest {
    session_id: string;
    exercises: WorkoutExercise[];
    user_rating?: number;
    user_notes?: string;
}

export interface SessionFilters {
    start_date?: string;
    end_date?: string;
    status?: WorkoutStatus;
    workout_id?: string;
}

// ============================================
// WORKOUT LOG DTOs
// ============================================

export interface CreateLogRequest {
    session_id: string;
    exercise_id: string;
    exercise_order: number;
    sets: WorkoutSet[];
    notes?: string;
    form_rating?: number;
}

export interface UpdateLogRequest {
    sets?: WorkoutSet[];
    notes?: string;
    form_rating?: number;
}

// ============================================
// PROGRESS DTOs
// ============================================

export interface LogBodyMetricsRequest {
    weight_kg?: number;
    body_fat_percent?: number;
    metric_date?: string;
}

export interface ProgressFilters {
    start_date?: string;
    end_date?: string;
    metrics?: ('volume' | 'consistency' | 'body' | 'intensity')[];
}

export interface ProgressSummary {
    period: {
        start_date: string;
        end_date: string;
        days: number;
    };
    workouts: {
        total: number;
        completed: number;
        skipped: number;
        consistency_percent: number;
    };
    volume: {
        total_kg: number;
        change_percent: number;
        by_muscle: Partial<Record<MuscleGroup, number>>;
    };
    intensity: {
        avg_rpe: number;
        max_rpe: number;
    };
    streaks: {
        current: number;
        best: number;
    };
    personal_records: number;
}

// ============================================
// AI DTOs
// ============================================

export interface GenerateWorkoutRequest {
    goal: Goal;
    fitness_level: FitnessLevel;
    available_equipment: string[];
    workout_duration_minutes: number;
    days_per_week: number;
    focus_muscles?: MuscleGroup[];
    injuries_to_avoid?: string[];
    preferences?: string;
}

export interface AICoachMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface AICoachRequest {
    message: string;
    context?: {
        recent_workouts?: WorkoutSession[];
        current_session?: WorkoutSession;
        user_goal?: Goal;
    };
}

export interface AICoachResponse {
    message: string;
    suggestions?: string[];
    workout_adjustment?: Partial<WorkoutExercise>;
}
