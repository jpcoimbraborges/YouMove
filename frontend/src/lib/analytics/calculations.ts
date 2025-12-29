/**
 * YOUMOVE - Workout Analytics
 * 
 * Automatic calculations for:
 * - Weekly volume
 * - Training frequency
 * - Load progression
 * - Consistency score
 * 
 * Plus actionable insights and alerts.
 */

// ============================================
// TYPES
// ============================================

export interface WorkoutLog {
    id: string;
    user_id: string;
    date: string; // YYYY-MM-DD
    workout_name: string;
    duration_minutes: number;
    exercises: ExerciseLog[];
    total_volume_kg: number;
    total_sets: number;
    total_reps: number;
    average_rpe: number | null;
    completed: boolean;
}

export interface ExerciseLog {
    exercise_id: string;
    exercise_name: string;
    muscle_group: string;
    sets: SetLog[];
    total_volume_kg: number;
    max_weight_kg: number;
}

export interface SetLog {
    reps: number;
    weight_kg: number;
    rpe: number | null;
}

export interface WeeklyStats {
    week_start: string;
    week_end: string;
    workouts_completed: number;
    workouts_planned: number;
    total_volume_kg: number;
    total_sets: number;
    total_reps: number;
    total_duration_minutes: number;
    average_rpe: number | null;
    training_days: number;
    rest_days: number;
    volume_by_muscle: Record<string, number>;
    top_exercises: Array<{ name: string; volume: number }>;
}

export interface ProgressionData {
    exercise_id: string;
    exercise_name: string;
    data_points: Array<{
        date: string;
        max_weight_kg: number;
        total_volume_kg: number;
        best_set: { reps: number; weight_kg: number };
    }>;
    trend: 'increasing' | 'stable' | 'decreasing';
    change_percent: number;
    estimated_1rm: number | null;
}

export interface ConsistencyData {
    period_days: number;
    expected_workouts: number;
    completed_workouts: number;
    consistency_percent: number;
    current_streak: number;
    longest_streak: number;
    missed_days: string[];
    trend: 'improving' | 'stable' | 'declining';
}

// ============================================
// VOLUME CALCULATIONS
// ============================================

/**
 * Calculate total volume (weight × reps)
 */
export function calculateVolume(sets: SetLog[]): number {
    return sets.reduce((total, set) => {
        return total + (set.weight_kg * set.reps);
    }, 0);
}

/**
 * Calculate weekly volume from logs
 */
export function calculateWeeklyVolume(
    logs: WorkoutLog[],
    weekStart: Date
): number {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return logs
        .filter(log => {
            const logDate = new Date(log.date);
            return logDate >= weekStart && logDate < weekEnd;
        })
        .reduce((total, log) => total + log.total_volume_kg, 0);
}

/**
 * Get weekly volume for last N weeks
 */
export function getWeeklyVolumeTrend(
    logs: WorkoutLog[],
    weeks: number = 8
): Array<{ week: string; volume: number; change_percent: number }> {
    const result: Array<{ week: string; volume: number; change_percent: number }> = [];
    const now = new Date();

    for (let i = weeks - 1; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const volume = calculateWeeklyVolume(logs, weekStart);
        const weekLabel = weekStart.toISOString().split('T')[0];

        const prevVolume = result.length > 0 ? result[result.length - 1].volume : volume;
        const changePercent = prevVolume > 0
            ? Math.round(((volume - prevVolume) / prevVolume) * 100)
            : 0;

        result.push({
            week: weekLabel,
            volume: Math.round(volume),
            change_percent: changePercent,
        });
    }

    return result;
}

/**
 * Get volume by muscle group
 */
export function getVolumeByMuscle(
    logs: WorkoutLog[],
    days: number = 7
): Record<string, number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const volumeByMuscle: Record<string, number> = {};

    logs
        .filter(log => new Date(log.date) >= cutoff)
        .forEach(log => {
            log.exercises.forEach(ex => {
                const muscle = ex.muscle_group;
                volumeByMuscle[muscle] = (volumeByMuscle[muscle] || 0) + ex.total_volume_kg;
            });
        });

    return volumeByMuscle;
}

// ============================================
// FREQUENCY CALCULATIONS
// ============================================

/**
 * Calculate training frequency (sessions per week)
 */
export function calculateFrequency(
    logs: WorkoutLog[],
    weeks: number = 4
): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (weeks * 7));

    const completedLogs = logs.filter(
        log => log.completed && new Date(log.date) >= cutoff
    );

    return Math.round((completedLogs.length / weeks) * 10) / 10;
}

/**
 * Get frequency by muscle group (times per week)
 */
export function getMuscleFrequency(
    logs: WorkoutLog[],
    weeks: number = 4
): Record<string, number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (weeks * 7));

    const muscleCount: Record<string, number> = {};

    logs
        .filter(log => log.completed && new Date(log.date) >= cutoff)
        .forEach(log => {
            const musclesHit = new Set<string>();
            log.exercises.forEach(ex => musclesHit.add(ex.muscle_group));
            musclesHit.forEach(muscle => {
                muscleCount[muscle] = (muscleCount[muscle] || 0) + 1;
            });
        });

    // Convert to per-week
    const result: Record<string, number> = {};
    Object.entries(muscleCount).forEach(([muscle, count]) => {
        result[muscle] = Math.round((count / weeks) * 10) / 10;
    });

    return result;
}

/**
 * Get training days pattern
 */
export function getTrainingPattern(
    logs: WorkoutLog[],
    weeks: number = 4
): { dayOfWeek: number; count: number; name: string }[] {
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (weeks * 7));

    const dayCounts = [0, 0, 0, 0, 0, 0, 0];

    logs
        .filter(log => log.completed && new Date(log.date) >= cutoff)
        .forEach(log => {
            const dayOfWeek = new Date(log.date).getDay();
            dayCounts[dayOfWeek]++;
        });

    return dayCounts.map((count, i) => ({
        dayOfWeek: i,
        count,
        name: dayNames[i],
    }));
}

// ============================================
// PROGRESSION CALCULATIONS
// ============================================

/**
 * Calculate load progression for an exercise
 */
export function calculateProgression(
    logs: WorkoutLog[],
    exerciseId: string,
    weeks: number = 8
): ProgressionData | null {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (weeks * 7));

    const dataPoints: ProgressionData['data_points'] = [];
    let exerciseName = '';

    logs
        .filter(log => log.completed && new Date(log.date) >= cutoff)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .forEach(log => {
            const exercise = log.exercises.find(e => e.exercise_id === exerciseId);
            if (!exercise || exercise.sets.length === 0) return;

            exerciseName = exercise.exercise_name;

            // Find best set (highest weight × reps)
            let bestSet = exercise.sets[0];
            let bestScore = 0;

            exercise.sets.forEach(set => {
                const score = set.weight_kg * set.reps;
                if (score > bestScore) {
                    bestScore = score;
                    bestSet = set;
                }
            });

            dataPoints.push({
                date: log.date,
                max_weight_kg: exercise.max_weight_kg,
                total_volume_kg: exercise.total_volume_kg,
                best_set: { reps: bestSet.reps, weight_kg: bestSet.weight_kg },
            });
        });

    if (dataPoints.length < 2) return null;

    // Calculate trend
    const firstHalf = dataPoints.slice(0, Math.floor(dataPoints.length / 2));
    const secondHalf = dataPoints.slice(Math.floor(dataPoints.length / 2));

    const avgFirst = firstHalf.reduce((a, d) => a + d.max_weight_kg, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, d) => a + d.max_weight_kg, 0) / secondHalf.length;

    const changePercent = avgFirst > 0
        ? Math.round(((avgSecond - avgFirst) / avgFirst) * 100)
        : 0;

    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (changePercent > 5) trend = 'increasing';
    if (changePercent < -5) trend = 'decreasing';

    // Estimate 1RM using Epley formula: weight × (1 + reps/30)
    const lastPoint = dataPoints[dataPoints.length - 1];
    const estimated1rm = lastPoint
        ? Math.round(lastPoint.best_set.weight_kg * (1 + lastPoint.best_set.reps / 30))
        : null;

    return {
        exercise_id: exerciseId,
        exercise_name: exerciseName,
        data_points: dataPoints,
        trend,
        change_percent: changePercent,
        estimated_1rm: estimated1rm,
    };
}

/**
 * Get all exercises with progression data
 */
export function getAllProgressions(
    logs: WorkoutLog[],
    weeks: number = 8
): ProgressionData[] {
    // Get unique exercises
    const exerciseIds = new Set<string>();
    logs.forEach(log => {
        log.exercises.forEach(ex => exerciseIds.add(ex.exercise_id));
    });

    const progressions: ProgressionData[] = [];

    exerciseIds.forEach(id => {
        const progression = calculateProgression(logs, id, weeks);
        if (progression) {
            progressions.push(progression);
        }
    });

    return progressions.sort((a, b) => b.change_percent - a.change_percent);
}

// ============================================
// CONSISTENCY CALCULATIONS
// ============================================

/**
 * Calculate consistency score
 */
export function calculateConsistency(
    logs: WorkoutLog[],
    expectedPerWeek: number = 4,
    weeks: number = 4
): ConsistencyData {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (weeks * 7));

    const completedLogs = logs
        .filter(log => log.completed && new Date(log.date) >= cutoff)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const expectedWorkouts = expectedPerWeek * weeks;
    const completedWorkouts = completedLogs.length;
    const consistencyPercent = Math.min(100, Math.round((completedWorkouts / expectedWorkouts) * 100));

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Create a set of workout dates
    const workoutDates = new Set(completedLogs.map(l => l.date));
    const missedDays: string[] = [];

    // Check each day in the period
    const checkDate = new Date(cutoff);
    const expectedDays = new Set<number>(); // Days of week expected

    // Simple expectation: if 4x/week, expect Mon/Tue/Thu/Fri
    if (expectedPerWeek >= 4) {
        expectedDays.add(1).add(2).add(4).add(5);
    } else if (expectedPerWeek >= 3) {
        expectedDays.add(1).add(3).add(5);
    } else {
        expectedDays.add(1).add(4);
    }

    while (checkDate <= now) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const dayOfWeek = checkDate.getDay();

        if (workoutDates.has(dateStr)) {
            tempStreak++;
            currentStreak = tempStreak;
            if (tempStreak > longestStreak) {
                longestStreak = tempStreak;
            }
        } else if (expectedDays.has(dayOfWeek)) {
            missedDays.push(dateStr);
            tempStreak = 0;
        }

        checkDate.setDate(checkDate.getDate() + 1);
    }

    // Calculate trend (compare last 2 weeks to previous 2 weeks)
    const midpoint = new Date(cutoff);
    midpoint.setDate(midpoint.getDate() + (weeks * 7) / 2);

    const firstHalfCount = completedLogs.filter(l => new Date(l.date) < midpoint).length;
    const secondHalfCount = completedLogs.filter(l => new Date(l.date) >= midpoint).length;

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (secondHalfCount > firstHalfCount + 1) trend = 'improving';
    if (secondHalfCount < firstHalfCount - 1) trend = 'declining';

    return {
        period_days: weeks * 7,
        expected_workouts: expectedWorkouts,
        completed_workouts: completedWorkouts,
        consistency_percent: consistencyPercent,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        missed_days: missedDays.slice(-7), // Last 7 missed
        trend,
    };
}

// ============================================
// WEEKLY STATS
// ============================================

/**
 * Get comprehensive weekly stats
 */
export function getWeeklyStats(
    logs: WorkoutLog[],
    weekStart?: Date
): WeeklyStats {
    const start = weekStart || getWeekStart(new Date());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const weekLogs = logs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= start && logDate <= end && log.completed;
    });

    const volumeByMuscle: Record<string, number> = {};
    const exerciseVolume: Record<string, number> = {};
    let totalRPE = 0;
    let rpeCount = 0;

    weekLogs.forEach(log => {
        log.exercises.forEach(ex => {
            volumeByMuscle[ex.muscle_group] = (volumeByMuscle[ex.muscle_group] || 0) + ex.total_volume_kg;
            exerciseVolume[ex.exercise_name] = (exerciseVolume[ex.exercise_name] || 0) + ex.total_volume_kg;
        });

        if (log.average_rpe !== null) {
            totalRPE += log.average_rpe;
            rpeCount++;
        }
    });

    // Get unique training days
    const trainingDays = new Set(weekLogs.map(l => l.date)).size;

    // Top exercises
    const topExercises = Object.entries(exerciseVolume)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, volume]) => ({ name, volume: Math.round(volume) }));

    return {
        week_start: start.toISOString().split('T')[0],
        week_end: end.toISOString().split('T')[0],
        workouts_completed: weekLogs.length,
        workouts_planned: 4, // Default, should come from user settings
        total_volume_kg: Math.round(weekLogs.reduce((a, l) => a + l.total_volume_kg, 0)),
        total_sets: weekLogs.reduce((a, l) => a + l.total_sets, 0),
        total_reps: weekLogs.reduce((a, l) => a + l.total_reps, 0),
        total_duration_minutes: weekLogs.reduce((a, l) => a + l.duration_minutes, 0),
        average_rpe: rpeCount > 0 ? Math.round((totalRPE / rpeCount) * 10) / 10 : null,
        training_days: trainingDays,
        rest_days: 7 - trainingDays,
        volume_by_muscle: volumeByMuscle,
        top_exercises: topExercises,
    };
}

function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
}

// Note: All functions are already exported inline (export function ...)
