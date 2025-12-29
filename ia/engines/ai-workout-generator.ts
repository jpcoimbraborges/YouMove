/**
 * YOUMOVE - AI Workout Generation
 * 
 * Generates workouts using AI then validates against safety limits.
 */

import { callOpenAIWithRetry, type AIResponse } from './openai-client';
import { PROMPTS } from '../prompts/system-prompts';
import { validateAISuggestion, type ValidationResult } from './safety-validator';
import { type FitnessLevel, type TrainingGoal } from './safety-limits';

// ============================================
// TYPES
// ============================================

export interface GenerateWorkoutInput {
    user_id: string;
    user_profile: {
        fitness_level: FitnessLevel;
        goal: TrainingGoal;
        age: number;
        name?: string;
    };
    muscles: string[];
    available_minutes: number;
    equipment: string[];
    history_summary?: {
        last_workout_date: string;
        recent_exercises: string[];
        recent_volume: number;
    };
    preferences?: {
        avoid_exercises?: string[];
        favorite_exercises?: string[];
    };
}

export interface AIWorkoutExercise {
    exercise_id: string;
    exercise_name: string;
    sets: number;
    target_reps: number;
    rest_seconds: number;
    notes?: string;
    order: number;
}

export interface AIWorkoutResponse {
    success: boolean;
    workout: {
        name: string;
        difficulty: 'easy' | 'moderate' | 'hard';
        estimated_duration_minutes: number;
        focus_muscles: string[];
        exercises: AIWorkoutExercise[];
        warmup_notes: string;
        coach_tip: string;
    };
    reasoning: string;
}

export interface GenerateWorkoutResult {
    success: boolean;
    workout: AIWorkoutResponse['workout'] | null;
    validation: ValidationResult | null;
    ai_response: AIResponse<AIWorkoutResponse>;
    was_adjusted: boolean;
    adjustments?: string[];
}

// ============================================
// INPUT SUMMARIZER
// ============================================

function summarizeInput(input: GenerateWorkoutInput): string {
    const lines: string[] = [];

    // User profile
    lines.push('## PERFIL DO USUÁRIO');
    lines.push(`- Nível: ${input.user_profile.fitness_level}`);
    lines.push(`- Objetivo: ${input.user_profile.goal}`);
    lines.push(`- Idade: ${input.user_profile.age} anos`);

    // Workout requirements
    lines.push('\n## REQUISITOS DO TREINO');
    lines.push(`- Músculos: ${input.muscles.join(', ')}`);
    lines.push(`- Tempo disponível: ${input.available_minutes} minutos`);
    lines.push(`- Equipamentos: ${input.equipment.length > 0 ? input.equipment.join(', ') : 'Academia completa'}`);

    // History
    if (input.history_summary) {
        lines.push('\n## HISTÓRICO RECENTE');
        lines.push(`- Último treino: ${input.history_summary.last_workout_date}`);
        lines.push(`- Exercícios recentes: ${input.history_summary.recent_exercises.slice(0, 5).join(', ')}`);
    }

    // Preferences
    if (input.preferences) {
        lines.push('\n## PREFERÊNCIAS');
        if (input.preferences.avoid_exercises?.length) {
            lines.push(`- Evitar: ${input.preferences.avoid_exercises.join(', ')}`);
        }
        if (input.preferences.favorite_exercises?.length) {
            lines.push(`- Favoritos: ${input.preferences.favorite_exercises.join(', ')}`);
        }
    }

    lines.push('\n## INSTRUÇÃO');
    lines.push('Gere um treino seguindo o schema JSON especificado.');

    return lines.join('\n');
}

// ============================================
// MAIN FUNCTION
// ============================================

export async function generateWorkoutWithAI(
    input: GenerateWorkoutInput
): Promise<GenerateWorkoutResult> {
    // Build user message
    const userMessage = summarizeInput(input);

    // Call AI
    const aiResponse = await callOpenAIWithRetry<AIWorkoutResponse>({
        system_prompt: PROMPTS.WORKOUT_GENERATION,
        user_message: userMessage,
        user_id: input.user_id,
        request_type: 'workout_generation',
        temperature: 0.7,
        max_tokens: 2000,
    });

    // Handle AI error
    if (!aiResponse.success || !aiResponse.data) {
        return {
            success: false,
            workout: null,
            validation: null,
            ai_response: aiResponse,
            was_adjusted: false,
        };
    }

    // Validate AI response against safety limits
    const workoutToValidate = {
        exercises: aiResponse.data.workout.exercises.map(e => ({
            id: e.exercise_id,
            sets: e.sets,
            reps: e.target_reps,
            weight_kg: 0, // AI doesn't specify weight
            rest_seconds: e.rest_seconds,
            muscle: input.muscles[0] || 'chest',
            category: 'compound' as const,
        })),
        estimated_duration_minutes: aiResponse.data.workout.estimated_duration_minutes,
        goal: input.user_profile.goal,
        level: input.user_profile.fitness_level,
        user_age: input.user_profile.age,
    };

    const validation = validateAISuggestion(
        workoutToValidate,
        input.user_profile.fitness_level,
        input.user_profile.age
    );

    // Apply adjustments if needed
    let finalWorkout = aiResponse.data.workout;
    let wasAdjusted = false;
    const adjustments: string[] = [];

    if (validation.adjustments.length > 0) {
        wasAdjusted = true;

        // Apply adjustments to exercises
        finalWorkout = {
            ...finalWorkout,
            exercises: finalWorkout.exercises.map(ex => {
                const adj = validation.adjustments.find(a => a.field.includes(ex.exercise_id));
                if (adj) {
                    adjustments.push(adj.reason);
                    if (adj.field.includes('sets')) {
                        return { ...ex, sets: adj.adjusted_value as number };
                    }
                    if (adj.field.includes('rest')) {
                        return { ...ex, rest_seconds: adj.adjusted_value as number };
                    }
                }
                return ex;
            }),
        };
    }

    // Add warnings as notes
    if (validation.warnings.length > 0) {
        finalWorkout = {
            ...finalWorkout,
            coach_tip: `${finalWorkout.coach_tip} ⚠️ ${validation.warnings[0].message}`,
        };
    }

    return {
        success: true,
        workout: finalWorkout,
        validation,
        ai_response: aiResponse,
        was_adjusted: wasAdjusted,
        adjustments: adjustments.length > 0 ? adjustments : undefined,
    };
}
