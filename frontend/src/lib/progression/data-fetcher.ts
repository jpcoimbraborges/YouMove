/**
 * YOUMOVE - Progression Data Fetcher
 * 
 * Helper functions to fetch and transform workout session data
 * into the format required by the progression analyzer.
 */

import { supabase } from '@/lib/supabase';
import type { ExerciseHistory, ExerciseSession } from './analyzer';

// ============================================
// FETCH EXERCISE HISTORY
// ============================================

export async function fetchExerciseHistory(
    userId: string,
    exerciseId: string,
    exerciseName: string,
    limit: number = 10
): Promise<ExerciseHistory | null> {
    try {
        // Fetch recent workout sessions
        const { data: sessions, error } = await supabase
            .from('workout_sessions')
            .select('id, completed_at, exercises_completed')
            .eq('user_id', userId)
            .not('completed_at', 'is', null)
            .order('completed_at', { ascending: false })
            .limit(30);  // Fetch more to filter later

        if (error) {
            console.error('Error fetching workout sessions:', error);
            return null;
        }

        if (!sessions || sessions.length === 0) {
            return null;
        }

        // Extract sessions containing this specific exercise
        const exerciseSessions: ExerciseSession[] = [];

        for (const session of sessions) {
            if (!session.exercises_completed) continue;

            // exercises_completed is JSONB array
            const exercises = Array.isArray(session.exercises_completed)
                ? session.exercises_completed
                : [];

            // Find this exercise in the session
            const exerciseData = exercises.find((ex: any) =>
                ex.exercise_id === exerciseId ||
                ex.id === exerciseId ||
                ex.exercise_name?.toLowerCase() === exerciseName.toLowerCase() ||
                ex.name?.toLowerCase() === exerciseName.toLowerCase()
            );

            if (exerciseData && exerciseData.sets) {
                // Transform to ExerciseSession format
                const sets = Array.isArray(exerciseData.sets) ? exerciseData.sets : [];

                // Extract completed reps from each set
                const completedReps = sets.map((set: any) => set.reps || set.completed_reps || 0);

                // Get target reps (usually from first set or exercise config)
                const targetReps = exerciseData.target_reps ||
                    exerciseData.reps ||
                    (sets[0]?.target_reps) ||
                    12;  // default

                // Get weight (assume all sets use same weight for simplicity)
                const weightKg = sets[0]?.weight_kg ||
                    sets[0]?.weight ||
                    exerciseData.weight_kg ||
                    0;

                exerciseSessions.push({
                    date: session.completed_at,
                    sets: sets.length,
                    target_reps: targetReps,
                    weight_kg: weightKg,
                    completed_reps: completedReps,
                    rpe: exerciseData.rpe  // If available
                });
            }

            // Stop if we have enough sessions
            if (exerciseSessions.length >= limit) {
                break;
            }
        }

        if (exerciseSessions.length === 0) {
            return null;
        }

        return {
            exercise_id: exerciseId,
            exercise_name: exerciseName,
            sessions: exerciseSessions
        };

    } catch (error) {
        console.error('Error in fetchExerciseHistory:', error);
        return null;
    }
}

// ============================================
// FETCH WORKOUT HISTORY (ALL EXERCISES)
// ============================================

export async function fetchWorkoutHistory(
    userId: string,
    workoutId: string
): Promise<ExerciseHistory[]> {
    try {
        // 1. Get workout details
        const { data: workout, error: workoutError } = await supabase
            .from('workouts')
            .select('exercises')
            .eq('id', workoutId)
            .eq('user_id', userId)
            .single();

        if (workoutError || !workout) {
            console.error('Error fetching workout:', workoutError);
            return [];
        }

        const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];

        // 2. Fetch history for each exercise
        const histories = await Promise.all(
            exercises.map(async (exercise: any) => {
                const exerciseId = exercise.id || exercise.exercise_id;
                const exerciseName = exercise.name || exercise.exercise_name;

                if (!exerciseId && !exerciseName) {
                    return null;
                }

                return await fetchExerciseHistory(
                    userId,
                    exerciseId,
                    exerciseName,
                    5  // Last 5 sessions per exercise
                );
            })
        );

        // Filter out nulls
        return histories.filter((h): h is ExerciseHistory => h !== null);

    } catch (error) {
        console.error('Error in fetchWorkoutHistory:', error);
        return [];
    }
}

// ============================================
// HELPER: GET USER FITNESS LEVEL
// ============================================

export async function getUserFitnessLevel(userId: string): Promise<'beginner' | 'intermediate' | 'advanced' | 'elite'> {
    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('fitness_level')
            .eq('id', userId)
            .single();

        if (!profile?.fitness_level) {
            return 'intermediate';  // Default
        }

        // Map Portuguese to English
        const levelMap: Record<string, 'beginner' | 'intermediate' | 'advanced' | 'elite'> = {
            'Iniciante': 'beginner',
            'beginner': 'beginner',
            'Intermediário': 'intermediate',
            'intermediate': 'intermediate',
            'Avançado': 'advanced',
            'advanced': 'advanced',
            'Atleta': 'elite',
            'elite': 'elite'
        };

        return levelMap[profile.fitness_level] || 'intermediate';

    } catch (error) {
        console.error('Error fetching user fitness level:', error);
        return 'intermediate';
    }
}
