/**
 * YOUMOVE - Analytics Schema Definitions
 * Schemas for workout metrics, progress tracking, and AI insights
 */

import { z } from 'zod';
import { MuscleGroupSchema } from './workout.schema';

// ============================================
// Weekly Volume Load
// ============================================
export const WeeklyVolumeSchema = z.object({
    user_id: z.string().uuid(),
    week_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    week_number: z.number().min(1).max(53),
    year: z.number().min(2020).max(2100),

    // Volume Metrics
    total_volume_kg: z.number().min(0), // Total weight × reps
    volume_by_muscle: z.record(z.string(), z.number()).optional(),

    // Session Metrics
    total_workouts: z.number().min(0),
    total_duration_minutes: z.number().min(0),
    total_sets: z.number().min(0),
    total_reps: z.number().min(0),

    // Intensity
    avg_rpe: z.number().min(1).max(10).nullable(),
    max_rpe: z.number().min(1).max(10).nullable(),

    // Comparison
    volume_change_percent: z.number().nullable(), // vs previous week

    // Metadata
    calculated_at: z.string().datetime(),
});

export type WeeklyVolume = z.infer<typeof WeeklyVolumeSchema>;

// ============================================
// Progressive Overload Tracking
// ============================================
export const ProgressiveOverloadSchema = z.object({
    user_id: z.string().uuid(),
    exercise_id: z.string().uuid(),

    // Current Performance
    current_max_weight_kg: z.number().min(0),
    current_max_reps: z.number().min(0),
    current_estimated_1rm: z.number().min(0).nullable(), // Estimated 1 Rep Max

    // Historical Bests
    all_time_max_weight_kg: z.number().min(0),
    all_time_max_reps: z.number().min(0),
    all_time_best_1rm: z.number().min(0).nullable(),

    // Progress Deltas
    weight_delta_30d: z.number(), // Change in last 30 days
    reps_delta_30d: z.number(),
    volume_delta_30d_percent: z.number(),

    // Trends
    trend: z.enum(['increasing', 'stable', 'decreasing', 'insufficient_data']),
    trend_strength: z.number().min(0).max(1), // 0-1 confidence

    // Last Updated
    last_performed_at: z.string().datetime().nullable(),
    updated_at: z.string().datetime(),
});

export type ProgressiveOverload = z.infer<typeof ProgressiveOverloadSchema>;

// ============================================
// Consistency Score
// ============================================
export const ConsistencyScoreSchema = z.object({
    user_id: z.string().uuid(),
    period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),

    // Consistency Metrics
    planned_workouts: z.number().min(0),
    completed_workouts: z.number().min(0),
    skipped_workouts: z.number().min(0),
    partial_workouts: z.number().min(0),

    // Score
    consistency_score: z.number().min(0).max(100), // 0-100%
    streak_current_days: z.number().min(0),
    streak_best_days: z.number().min(0),

    // Day Distribution
    workouts_by_day: z.array(z.number()).length(7), // Sun-Sat
    preferred_time_slot: z.enum(['morning', 'afternoon', 'evening', 'night']).nullable(),

    // Engagement
    avg_workout_rating: z.number().min(1).max(5).nullable(),
    notes_count: z.number().min(0),

    updated_at: z.string().datetime(),
});

export type ConsistencyScore = z.infer<typeof ConsistencyScoreSchema>;

// ============================================
// Muscle Heatmap Data
// ============================================
export const MuscleHeatmapSchema = z.object({
    user_id: z.string().uuid(),
    period_days: z.number().min(1).max(365),
    calculated_at: z.string().datetime(),

    // Volume per muscle group (normalized 0-100)
    muscle_intensity: z.record(MuscleGroupSchema, z.object({
        volume_kg: z.number().min(0),
        sets_count: z.number().min(0),
        normalized_intensity: z.number().min(0).max(100),
        recovery_status: z.enum(['fresh', 'recovered', 'fatigued', 'overtrained']),
        last_trained_at: z.string().datetime().nullable(),
        days_since_training: z.number().min(0).nullable(),
    })),

    // Balance Analysis
    push_pull_ratio: z.number().nullable(),
    upper_lower_ratio: z.number().nullable(),
    imbalances: z.array(z.object({
        type: z.enum(['push_pull', 'upper_lower', 'left_right', 'muscle_group']),
        description: z.string(),
        severity: z.enum(['low', 'medium', 'high']),
    })),
});

export type MuscleHeatmap = z.infer<typeof MuscleHeatmapSchema>;

// ============================================
// AI-Generated Alerts
// ============================================
export const AlertTypeSchema = z.enum([
    'injury_risk',
    'overtraining',
    'undertraining',
    'muscle_imbalance',
    'plateau_detected',
    'goal_progress',
    'streak_milestone',
    'personal_record',
    'recovery_needed',
    'form_reminder',
    'hydration_reminder',
    'nutrition_tip',
]);

export const AlertSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    type: AlertTypeSchema,
    severity: z.enum(['info', 'warning', 'critical', 'celebration']),

    // Content
    title: z.string().max(100),
    message: z.string().max(500),
    action_text: z.string().max(50).nullable(),
    action_url: z.string().nullable(),

    // AI Context
    ai_generated: z.boolean().default(true),
    confidence_score: z.number().min(0).max(1).nullable(),
    supporting_data: z.record(z.string(), z.unknown()).nullable(),

    // Status
    read: z.boolean().default(false),
    dismissed: z.boolean().default(false),
    actioned: z.boolean().default(false),

    // Timing
    created_at: z.string().datetime(),
    expires_at: z.string().datetime().nullable(),
});

export type Alert = z.infer<typeof AlertSchema>;
export type AlertType = z.infer<typeof AlertTypeSchema>;

// ============================================
// AI Recommendations
// ============================================
export const RecommendationSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),

    // Type
    category: z.enum([
        'workout_adjustment',
        'exercise_swap',
        'volume_change',
        'rest_day',
        'deload_week',
        'progressive_overload',
        'new_exercise',
        'technique_focus',
        'recovery',
        'nutrition',
    ]),

    // Content
    title: z.string().max(100),
    description: z.string().max(1000),
    rationale: z.string().max(500), // Why AI suggests this

    // Actions
    primary_action: z.object({
        label: z.string(),
        type: z.enum(['navigate', 'apply', 'dismiss', 'schedule']),
        payload: z.record(z.string(), z.unknown()).nullable(),
    }),
    secondary_action: z.object({
        label: z.string(),
        type: z.enum(['navigate', 'apply', 'dismiss', 'schedule']),
        payload: z.record(z.string(), z.unknown()).nullable(),
    }).nullable(),

    // AI Metadata
    confidence_score: z.number().min(0).max(1),
    priority: z.number().min(1).max(10),

    // Status
    status: z.enum(['pending', 'accepted', 'rejected', 'expired']).default('pending'),
    user_feedback: z.string().max(500).nullable(),

    // Timing
    created_at: z.string().datetime(),
    expires_at: z.string().datetime().nullable(),
    responded_at: z.string().datetime().nullable(),
});

export type Recommendation = z.infer<typeof RecommendationSchema>;
