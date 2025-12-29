/**
 * YOUMOVE - AI Suggestions
 * 
 * Generates personalized suggestions and coaching interactions.
 */

import { callOpenAIWithRetry, type AIResponse } from './openai-client';
import { PROMPTS } from '../prompts/system-prompts';
import { type FitnessLevel, type TrainingGoal } from './safety-limits';

// ============================================
// TYPES
// ============================================

export interface SuggestionsInput {
    user_id: string;
    user_profile: {
        fitness_level: FitnessLevel;
        goal: TrainingGoal;
        name?: string;
        days_training: number;
    };
    recent_performance?: {
        consistency_percent: number;
        volume_trend: 'up' | 'stable' | 'down';
        avg_rpe: number;
        prs_this_month: number;
    };
    context?: string; // Specific question or situation
    focus_area?: 'training' | 'recovery' | 'nutrition' | 'mindset' | 'all';
}

export interface Suggestion {
    id: string;
    category: 'exercise' | 'nutrition' | 'recovery' | 'mindset' | 'technique';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    action: string;
    impact: string;
    confidence: number;
}

export interface SuggestionsResult {
    success: boolean;
    suggestions: Suggestion[];
    quick_wins: string[];
    long_term_focus: string;
}

// ============================================
// INPUT SUMMARIZER
// ============================================

function summarizeSuggestionsInput(input: SuggestionsInput): string {
    const lines: string[] = [];

    lines.push('## PERFIL DO USUÁRIO');
    lines.push(`- Nome: ${input.user_profile.name || 'Usuário'}`);
    lines.push(`- Nível: ${input.user_profile.fitness_level}`);
    lines.push(`- Objetivo: ${input.user_profile.goal}`);
    lines.push(`- Dias treinando: ${input.user_profile.days_training}`);

    if (input.recent_performance) {
        lines.push('\n## DESEMPENHO RECENTE');
        lines.push(`- Consistência: ${input.recent_performance.consistency_percent}%`);
        lines.push(`- Tendência de volume: ${input.recent_performance.volume_trend}`);
        lines.push(`- RPE médio: ${input.recent_performance.avg_rpe}`);
        lines.push(`- Recordes este mês: ${input.recent_performance.prs_this_month}`);
    }

    if (input.context) {
        lines.push('\n## CONTEXTO ESPECÍFICO');
        lines.push(input.context);
    }

    if (input.focus_area && input.focus_area !== 'all') {
        lines.push(`\n## ÁREA DE FOCO: ${input.focus_area}`);
    }

    lines.push('\n## INSTRUÇÃO');
    lines.push('Gere sugestões personalizadas seguindo o schema JSON especificado.');

    return lines.join('\n');
}

// ============================================
// MAIN FUNCTION
// ============================================

export async function getSuggestionsWithAI(
    input: SuggestionsInput
): Promise<{ ai_response: AIResponse<SuggestionsResult>; suggestions: Suggestion[] | null }> {
    const userMessage = summarizeSuggestionsInput(input);

    const aiResponse = await callOpenAIWithRetry<SuggestionsResult>({
        system_prompt: PROMPTS.SUGGESTION,
        user_message: userMessage,
        user_id: input.user_id,
        request_type: 'suggestions',
        temperature: 0.7,
        max_tokens: 1200,
    });

    return {
        ai_response: aiResponse,
        suggestions: aiResponse.data?.suggestions || null,
    };
}

// ============================================
// COACH CHAT
// ============================================

export interface CoachChatInput {
    user_id: string;
    user_name?: string;
    message: string;
    conversation_history?: {
        role: 'user' | 'coach';
        content: string;
    }[];
    user_context?: {
        fitness_level: FitnessLevel;
        goal: TrainingGoal;
        current_streak: number;
        today_workout_done: boolean;
    };
}

export interface CoachChatResponse {
    success: boolean;
    response: {
        message: string;
        follow_up_questions: string[];
        quick_actions: {
            label: string;
            action: string;
        }[];
        resources: {
            type: 'video' | 'article' | 'exercise';
            title: string;
            id: string;
        }[];
    };
    intent_detected: 'question' | 'feedback' | 'request' | 'complaint' | 'other';
    sentiment: 'positive' | 'neutral' | 'negative';
}

export async function chatWithCoachAI(
    input: CoachChatInput
): Promise<{ ai_response: AIResponse<CoachChatResponse>; response: CoachChatResponse['response'] | null }> {
    // Build conversation context
    let conversationText = '';

    if (input.conversation_history && input.conversation_history.length > 0) {
        conversationText = '\n## HISTÓRICO DA CONVERSA\n';
        input.conversation_history.slice(-5).forEach(msg => {
            conversationText += `${msg.role === 'user' ? '👤 Usuário' : '🏋️ Coach'}: ${msg.content}\n`;
        });
    }

    let contextText = '';
    if (input.user_context) {
        contextText = `\n## CONTEXTO DO USUÁRIO
- Nível: ${input.user_context.fitness_level}
- Objetivo: ${input.user_context.goal}
- Streak atual: ${input.user_context.current_streak} dias
- Treino de hoje: ${input.user_context.today_workout_done ? '✅ Feito' : '⏳ Pendente'}
`;
    }

    const userMessage = `${contextText}${conversationText}
## MENSAGEM ATUAL
${input.user_name ? `${input.user_name} diz:` : 'Usuário diz:'} "${input.message}"

Responda seguindo o schema JSON especificado.`;

    const aiResponse = await callOpenAIWithRetry<CoachChatResponse>({
        system_prompt: PROMPTS.COACH_CHAT,
        user_message: userMessage,
        user_id: input.user_id,
        request_type: 'coach_chat',
        temperature: 0.8, // More conversational
        max_tokens: 800,
    });

    return {
        ai_response: aiResponse,
        response: aiResponse.data?.response || null,
    };
}

// ============================================
// QUICK INSIGHTS
// ============================================

export interface QuickInsight {
    type: 'tip' | 'alert' | 'celebration' | 'reminder';
    title: string;
    message: string;
    action_label?: string;
    action_route?: string;
}

export function generateQuickInsights(
    userStats: {
        consistency: number;
        streak: number;
        pending_workout: boolean;
        last_pr_days_ago?: number;
        fatigue_score?: number;
    }
): QuickInsight[] {
    const insights: QuickInsight[] = [];

    // Streak celebration
    if (userStats.streak === 7) {
        insights.push({
            type: 'celebration',
            title: '🔥 1 Semana!',
            message: 'Você completou 7 dias consecutivos de treino! Continue assim!',
        });
    } else if (userStats.streak === 30) {
        insights.push({
            type: 'celebration',
            title: '🏆 1 Mês!',
            message: 'Incrível! Um mês inteiro de consistência!',
        });
    }

    // Consistency warning
    if (userStats.consistency < 50) {
        insights.push({
            type: 'alert',
            title: '📉 Consistência baixa',
            message: 'Você está completando menos da metade dos treinos. Vamos ajustar a frequência?',
            action_label: 'Ajustar plano',
            action_route: '/profile/goals',
        });
    }

    // Workout reminder
    if (userStats.pending_workout) {
        insights.push({
            type: 'reminder',
            title: '💪 Treino de hoje',
            message: 'Você ainda não treinou hoje. Vamos lá!',
            action_label: 'Iniciar treino',
            action_route: '/workout',
        });
    }

    // PR motivation
    if (userStats.last_pr_days_ago && userStats.last_pr_days_ago > 14) {
        insights.push({
            type: 'tip',
            title: '🎯 Em busca do PR',
            message: `Faz ${userStats.last_pr_days_ago} dias desde seu último recorde. Hora de quebrar barreiras!`,
        });
    }

    // Fatigue alert
    if (userStats.fatigue_score && userStats.fatigue_score > 7) {
        insights.push({
            type: 'alert',
            title: '😴 Sinais de fadiga',
            message: 'Seus indicadores mostram fadiga acumulada. Considere um dia de descanso ativo.',
        });
    }

    return insights;
}
