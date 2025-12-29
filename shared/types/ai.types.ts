/**
 * YOUMOVE - AI Types
 * Types for AI/ChatGPT integration
 * Version: 1.0.0
 */

import type { MuscleGroup, Goal, FitnessLevel, WorkoutExercise } from './database.types';

// ============================================
// RECOMMENDATION TYPES
// ============================================

export type RecommendationCategory =
    | 'workout_adjustment'
    | 'exercise_swap'
    | 'volume_change'
    | 'rest_day'
    | 'deload_week'
    | 'progressive_overload'
    | 'new_exercise'
    | 'technique_focus'
    | 'recovery'
    | 'nutrition';

export type AlertType =
    | 'injury_risk'
    | 'overtraining'
    | 'undertraining'
    | 'muscle_imbalance'
    | 'plateau_detected'
    | 'goal_progress'
    | 'streak_milestone'
    | 'personal_record'
    | 'recovery_needed'
    | 'form_reminder'
    | 'hydration_reminder'
    | 'nutrition_tip';

export type AlertSeverity = 'info' | 'warning' | 'critical' | 'celebration';

export type RecommendationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

// ============================================
// AI RECOMMENDATION
// ============================================

export interface AIAction {
    label: string;
    type: 'navigate' | 'apply' | 'dismiss' | 'schedule';
    payload: Record<string, unknown> | null;
}

export interface AIRecommendation {
    id: string;
    user_id: string;
    category: RecommendationCategory;
    alert_type: AlertType | null;
    severity: AlertSeverity;

    // Content
    title: string;
    description: string;
    rationale: string | null;

    // Actions
    primary_action: AIAction | null;
    secondary_action: AIAction | null;

    // AI Metadata
    confidence_score: number | null;
    priority: number;
    supporting_data: Record<string, unknown> | null;
    model_version: string | null;

    // Status
    status: RecommendationStatus;
    user_feedback: string | null;
    read: boolean;
    dismissed: boolean;

    // Timing
    expires_at: string | null;
    responded_at: string | null;
    created_at: string;
    updated_at: string;
}

// ============================================
// AI ANALYSIS INPUTS
// ============================================

export interface UserAnalysisContext {
    profile: {
        fitness_level: FitnessLevel;
        primary_goal: Goal;
        injuries: string[];
        equipment: string[];
    };
    recent_workouts: {
        date: string;
        volume_kg: number;
        duration_minutes: number;
        avg_rpe: number | null;
        muscles_worked: MuscleGroup[];
    }[];
    weekly_stats: {
        total_volume_kg: number;
        total_workouts: number;
        consistency_percent: number;
        volume_change_percent: number;
    };
    personal_records_30d: number;
    streak_days: number;
}

// ============================================
// AI GENERATION PROMPTS
// ============================================

export interface WorkoutGenerationPrompt {
    user_context: {
        fitness_level: FitnessLevel;
        goal: Goal;
        available_equipment: string[];
        injuries_to_avoid: string[];
    };
    workout_params: {
        duration_minutes: number;
        focus_muscles: MuscleGroup[];
        workout_type: string;
    };
    constraints: {
        max_exercises: number;
        include_warmup: boolean;
        include_cooldown: boolean;
    };
}

export interface WorkoutGenerationResponse {
    name: string;
    description: string;
    exercises: WorkoutExercise[];
    estimated_duration_minutes: number;
    estimated_calories: number;
    difficulty_rating: number;
    tips: string[];
}

// ============================================
// AI COACH TYPES
// ============================================

export interface CoachPersonality {
    type: 'motivational' | 'strict' | 'friendly' | 'analytical';
    traits: string[];
    communication_style: string;
    example_phrases: string[];
}

export interface CoachContext {
    personality: CoachPersonality;
    user_name: string;
    user_goal: Goal;
    current_streak: number;
    last_workout_date: string | null;
    upcoming_workout: string | null;
}

export interface CoachInteraction {
    id: string;
    user_id: string;
    session_id?: string;

    // Messages
    user_message: string;
    coach_response: string;

    // Context
    context_type: 'general' | 'workout' | 'progress' | 'motivation' | 'technique';

    // Metadata
    tokens_used: number;
    response_time_ms: number;
    model: string;

    created_at: string;
}

// ============================================
// AI INSIGHT TYPES
// ============================================

export interface MuscleHeatmapData {
    muscle: MuscleGroup;
    volume_kg: number;
    sets_count: number;
    normalized_intensity: number; // 0-100
    recovery_status: 'fresh' | 'recovered' | 'fatigued' | 'overtrained';
    last_trained_at: string | null;
    days_since_training: number | null;
}

export interface BalanceAnalysis {
    push_pull_ratio: number | null;
    upper_lower_ratio: number | null;
    imbalances: {
        type: 'push_pull' | 'upper_lower' | 'left_right' | 'muscle_group';
        description: string;
        severity: 'low' | 'medium' | 'high';
    }[];
}

export interface ProgressTrend {
    exercise_id: string;
    exercise_name: string;
    trend: 'increasing' | 'stable' | 'decreasing' | 'insufficient_data';
    trend_strength: number; // 0-1
    current_max_weight: number;
    weight_change_30d: number;
    projected_1rm: number | null;
}

export interface WeeklyInsight {
    week_start: string;
    week_end: string;
    summary: string;
    highlights: string[];
    areas_for_improvement: string[];
    recommended_focus: MuscleGroup[];
    suggested_deload: boolean;
}
