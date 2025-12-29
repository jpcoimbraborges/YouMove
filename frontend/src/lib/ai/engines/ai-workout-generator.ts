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
        weight_kg?: number;
        height_cm?: number;
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
    duration_type?: 'single' | 'weekly'; // ADDED param
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
        estimated_calories_burn: number;
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
    if (input.user_profile.name) {
        lines.push(`- Nome: ${input.user_profile.name}`);
    }
    lines.push(`- Nível de condicionamento: ${input.user_profile.fitness_level}`);
    lines.push(`- Objetivo principal: ${input.user_profile.goal}`);
    lines.push(`- Idade: ${input.user_profile.age} anos`);
    if (input.user_profile.weight_kg) {
        lines.push(`- Peso corporal: ${input.user_profile.weight_kg} kg`);
    }
    if (input.user_profile.height_cm) {
        lines.push(`- Altura: ${input.user_profile.height_cm} cm`);
    }

    // Workout requirements
    lines.push('\n## REQUISITOS DO TREINO');
    lines.push(`- Grupos musculares: ${input.muscles.join(', ')}`);
    lines.push(`- Tempo disponível: ${input.available_minutes} minutos`);

    // Equipment section with context
    if (input.equipment.length > 0) {
        lines.push(`\n## EQUIPAMENTOS DISPONÍVEIS`);
        lines.push(`O usuário TEM ACESSO APENAS aos seguintes equipamentos:`);
        input.equipment.forEach(eq => {
            lines.push(`  • ${eq}`);
        });
        lines.push(`\n⚠️ IMPORTANTE: Só utilize exercícios que possam ser realizados com estes equipamentos!`);
    } else {
        lines.push(`- Equipamentos: Academia completa (todos disponíveis)`);
    }

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
// MAIN FUNCTION (SINGLE WORKOUT)
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

// ============================================
// WEEKLY GENERATION
// ============================================

export interface AIWeeklyPlanResponse {
    success: boolean;
    weekly_plan: {
        name: string;
        description: string;
        goal_focus: string;
        days: Array<{
            day: string;
            is_rest: boolean;
            focus: string;
            workout?: AIWorkoutResponse['workout'];
        }>
    };
    estimated_weekly_calories: number;
    reasoning: string;
}

export interface GenerateWeeklyResult {
    success: boolean;
    plan: AIWeeklyPlanResponse['weekly_plan'] | null;
    error?: any;
}

export async function generateWeeklyPlanWithAI(input: GenerateWorkoutInput): Promise<GenerateWeeklyResult> {
    const userMessage = summarizeInput(input) +
        "\n\nCONTEXTO ADICIONAL: O usuário solicitou um plano de treino SEMANAL completo de 7 dias.";

    const aiResponse = await callOpenAIWithRetry<AIWeeklyPlanResponse>({
        system_prompt: PROMPTS.WEEKLY_PLAN,
        user_message: userMessage,
        user_id: input.user_id,
        request_type: 'workout_generation',
        temperature: 0.7,
        max_tokens: 3000,
    });

    if (!aiResponse.success || !aiResponse.data) {
        return { success: false, plan: null, error: aiResponse.error };
    }

    // The OpenAI response returns the full schema object with weekly_plan inside
    const weeklyPlanData = aiResponse.data as AIWeeklyPlanResponse;

    if (!weeklyPlanData.weekly_plan) {
        console.error('[Weekly Plan] Missing weekly_plan in response:', weeklyPlanData);
        return {
            success: false,
            plan: null,
            error: { message: 'Weekly plan data missing from AI response', code: 'INVALID_RESPONSE' }
        };
    }

    return { success: true, plan: weeklyPlanData.weekly_plan };
}
