/**
 * YOUMOVE - AI Log Analysis
 * 
 * Analyzes workout logs to provide insights and recommendations.
 */

import { callOpenAIWithRetry, type AIResponse } from './openai-client';
import { PROMPTS } from '../prompts/system-prompts';
import { type FitnessLevel, type TrainingGoal } from './safety-limits';

// ============================================
// TYPES
// ============================================

export interface WorkoutLogEntry {
    session_id: string;
    date: string;
    workout_name: string;
    exercises: {
        exercise_id: string;
        exercise_name: string;
        muscle: string;
        sets_completed: number;
        total_reps: number;
        max_weight_kg: number;
        total_volume_kg: number;
    }[];
    duration_minutes: number;
    total_volume_kg: number;
    rpe_average: number;
    completed: boolean;
}

export interface AnalyzeLogsInput {
    user_id: string;
    user_profile: {
        fitness_level: FitnessLevel;
        goal: TrainingGoal;
        name?: string;
    };
    logs: WorkoutLogEntry[];
    personal_records?: {
        exercise_name: string;
        weight_kg: number;
        date: string;
    }[];
    period_days: number;
}

export interface LogAnalysisResult {
    success: boolean;
    analysis: {
        consistency_score: number;
        volume_trend: 'increasing' | 'stable' | 'decreasing';
        intensity_trend: 'increasing' | 'stable' | 'decreasing';
        strongest_muscles: string[];
        weakest_muscles: string[];
        fatigue_indicators: string[];
        achievements: {
            type: 'pr' | 'streak' | 'milestone';
            description: string;
            date: string;
        }[];
        concerns: {
            severity: 'low' | 'medium' | 'high';
            area: string;
            description: string;
            recommendation: string;
        }[];
    };
    summary: string;
    coach_message: string;
}

export interface AnalyzeLogsResponse {
    ai_response: AIResponse<LogAnalysisResult>;
    analysis: LogAnalysisResult['analysis'] | null;
    summary: string | null;
    coach_message: string | null;
}

// ============================================
// INPUT SUMMARIZER
// ============================================

function summarizeLogsInput(input: AnalyzeLogsInput): string {
    const lines: string[] = [];

    // User profile
    lines.push('## PERFIL DO USUÁRIO');
    lines.push(`- Nome: ${input.user_profile.name || 'Usuário'}`);
    lines.push(`- Nível: ${input.user_profile.fitness_level}`);
    lines.push(`- Objetivo: ${input.user_profile.goal}`);

    // Period
    lines.push(`\n## PERÍODO ANALISADO: ${input.period_days} dias`);

    // Summary stats
    const completedWorkouts = input.logs.filter(l => l.completed);
    const totalVolume = completedWorkouts.reduce((acc, l) => acc + l.total_volume_kg, 0);
    const avgRPE = completedWorkouts.length > 0
        ? completedWorkouts.reduce((acc, l) => acc + l.rpe_average, 0) / completedWorkouts.length
        : 0;

    lines.push('\n## ESTATÍSTICAS GERAIS');
    lines.push(`- Treinos realizados: ${completedWorkouts.length}/${input.logs.length}`);
    lines.push(`- Volume total: ${Math.round(totalVolume).toLocaleString()} kg`);
    lines.push(`- RPE médio: ${avgRPE.toFixed(1)}`);

    // Muscle distribution
    const muscleVolume: Record<string, number> = {};
    completedWorkouts.forEach(log => {
        log.exercises.forEach(ex => {
            muscleVolume[ex.muscle] = (muscleVolume[ex.muscle] || 0) + ex.total_volume_kg;
        });
    });

    lines.push('\n## VOLUME POR MÚSCULO');
    Object.entries(muscleVolume)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .forEach(([muscle, vol]) => {
            lines.push(`- ${muscle}: ${Math.round(vol).toLocaleString()} kg`);
        });

    // Workout log summary (last 5)
    lines.push('\n## ÚLTIMOS TREINOS');
    input.logs.slice(-5).forEach(log => {
        const status = log.completed ? '✅' : '❌';
        lines.push(`${status} ${log.date} - ${log.workout_name} (${log.duration_minutes}min, ${Math.round(log.total_volume_kg)}kg)`);
    });

    // PRs
    if (input.personal_records && input.personal_records.length > 0) {
        lines.push('\n## RECORDES PESSOAIS RECENTES');
        input.personal_records.slice(-5).forEach(pr => {
            lines.push(`- ${pr.exercise_name}: ${pr.weight_kg}kg (${pr.date})`);
        });
    }

    lines.push('\n## INSTRUÇÃO');
    lines.push('Analise esses dados e gere insights seguindo o schema JSON especificado.');

    return lines.join('\n');
}

// ============================================
// MAIN FUNCTION
// ============================================

export async function analyzeLogsWithAI(
    input: AnalyzeLogsInput
): Promise<AnalyzeLogsResponse> {
    // Check for minimum data
    if (input.logs.length === 0) {
        return {
            ai_response: {
                success: false,
                data: null,
                error: { code: 'NO_DATA', message: 'Nenhum log para analisar' },
                usage: null,
                latency_ms: 0,
                request_id: 'no_data',
            },
            analysis: null,
            summary: null,
            coach_message: null,
        };
    }

    // Build user message
    const userMessage = summarizeLogsInput(input);

    // Call AI
    const aiResponse = await callOpenAIWithRetry<LogAnalysisResult>({
        system_prompt: PROMPTS.LOG_ANALYSIS,
        user_message: userMessage,
        user_id: input.user_id,
        request_type: 'log_analysis',
        temperature: 0.5, // Lower temperature for analysis
        max_tokens: 1500,
    });

    // Handle error
    if (!aiResponse.success || !aiResponse.data) {
        return {
            ai_response: aiResponse,
            analysis: null,
            summary: null,
            coach_message: null,
        };
    }

    return {
        ai_response: aiResponse,
        analysis: aiResponse.data.analysis,
        summary: aiResponse.data.summary,
        coach_message: aiResponse.data.coach_message,
    };
}

// ============================================
// WEEKLY REPORT
// ============================================

export interface WeeklyReportResult {
    success: boolean;
    report: {
        headline: string;
        emoji: string;
        stats: {
            workouts_completed: number;
            workouts_planned: number;
            total_volume_kg: number;
            total_sets: number;
            total_reps: number;
            avg_workout_duration: number;
            calories_burned_estimate: number;
        };
        highlights: string[];
        areas_to_improve: string[];
        next_week_focus: string;
        motivational_quote: string;
    };
    comparison_to_last_week: {
        volume_change_percent: number;
        consistency_change: 'better' | 'same' | 'worse';
        trend_description: string;
    };
}

export async function generateWeeklyReportWithAI(
    input: AnalyzeLogsInput & {
        last_week_volume?: number;
        last_week_workouts?: number;
    }
): Promise<{ ai_response: AIResponse<WeeklyReportResult>; report: WeeklyReportResult['report'] | null }> {
    const userMessage = `${summarizeLogsInput(input)}

## COMPARAÇÃO COM SEMANA ANTERIOR
- Volume semana passada: ${input.last_week_volume || 'N/A'} kg
- Treinos semana passada: ${input.last_week_workouts || 'N/A'}

Gere o relatório semanal seguindo o schema JSON especificado.`;

    const aiResponse = await callOpenAIWithRetry<WeeklyReportResult>({
        system_prompt: PROMPTS.WEEKLY_REPORT,
        user_message: userMessage,
        user_id: input.user_id,
        request_type: 'weekly_report',
        temperature: 0.8, // More creative for motivational content
        max_tokens: 1500,
    });

    return {
        ai_response: aiResponse,
        report: aiResponse.data?.report || null,
    };
}
