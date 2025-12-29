/**
 * YOUMOVE - Analytics Module
 * 
 * Central export for all analytics functionality.
 */

// Calculations
export {
    // Volume
    calculateVolume,
    calculateWeeklyVolume,
    getWeeklyVolumeTrend,
    getVolumeByMuscle,

    // Frequency
    calculateFrequency,
    getMuscleFrequency,
    getTrainingPattern,

    // Progression
    calculateProgression,
    getAllProgressions,

    // Consistency
    calculateConsistency,

    // Stats
    getWeeklyStats,

    // Types
    type WorkoutLog,
    type ExerciseLog,
    type SetLog,
    type WeeklyStats,
    type ProgressionData,
    type ConsistencyData,
} from './calculations';

// Alerts
export {
    generateAlerts,
    THRESHOLDS,
    type Alert,
    type AlertType,
    type AlertCategory,
} from './alerts';

// Insights
export {
    generateInsights,
    type Insight,
    type InsightType,
} from './insights';

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

import { type WorkoutLog, getWeeklyStats, calculateConsistency, getAllProgressions } from './calculations';
import { generateAlerts, type Alert } from './alerts';
import { generateInsights, type Insight } from './insights';

export interface AnalyticsSummary {
    weeklyStats: ReturnType<typeof getWeeklyStats>;
    consistency: ReturnType<typeof calculateConsistency>;
    alerts: Alert[];
    insights: Insight[];
    topProgressions: ReturnType<typeof getAllProgressions>;
}

/**
 * Get complete analytics summary for a user
 */
export function getAnalyticsSummary(
    logs: WorkoutLog[],
    settings?: {
        expectedPerWeek?: number;
        goal?: 'strength' | 'hypertrophy' | 'endurance' | 'general_fitness';
        fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
    }
): AnalyticsSummary {
    const expectedPerWeek = settings?.expectedPerWeek || 4;

    return {
        weeklyStats: getWeeklyStats(logs),
        consistency: calculateConsistency(logs, expectedPerWeek, 4),
        alerts: generateAlerts(logs, settings),
        insights: generateInsights(logs, settings),
        topProgressions: getAllProgressions(logs, 8).slice(0, 5),
    };
}

/**
 * Get quick stats for dashboard widget
 */
export function getQuickStats(logs: WorkoutLog[]): {
    thisWeekWorkouts: number;
    thisWeekVolume: number;
    currentStreak: number;
    trend: 'up' | 'down' | 'stable';
} {
    const weeklyStats = getWeeklyStats(logs);
    const consistency = calculateConsistency(logs, 4, 4);

    // Calculate trend from volume
    const volumeTrend = getWeeklyVolumeTrend(logs, 2);
    let trend: 'up' | 'down' | 'stable' = 'stable';

    if (volumeTrend.length >= 2) {
        const current = volumeTrend[volumeTrend.length - 1];
        if (current.change_percent > 5) trend = 'up';
        if (current.change_percent < -5) trend = 'down';
    }

    return {
        thisWeekWorkouts: weeklyStats.workouts_completed,
        thisWeekVolume: weeklyStats.total_volume_kg,
        currentStreak: consistency.current_streak,
        trend,
    };
}

import { getWeeklyVolumeTrend } from './calculations';
