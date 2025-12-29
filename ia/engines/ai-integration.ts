/**
 * YOUMOVE - AI Integration (Main Export)
 * 
 * Public API for all AI functionality.
 */

// OpenAI Client
export {
    callOpenAI,
    callOpenAIWithRetry,
    getAuditLogs,
    type AIRequest,
    type AIResponse,
    type AIError,
    type AuditLog,
} from './openai-client';

// System Prompts
export { PROMPTS } from '../prompts/system-prompts';

// AI Workout Generation
export {
    generateWorkoutWithAI,
    type GenerateWorkoutInput,
    type AIWorkoutExercise,
    type AIWorkoutResponse,
    type GenerateWorkoutResult,
} from './ai-workout-generator';

// AI Log Analysis
export {
    analyzeLogsWithAI,
    generateWeeklyReportWithAI,
    type WorkoutLogEntry,
    type AnalyzeLogsInput,
    type LogAnalysisResult,
    type WeeklyReportResult,
} from './ai-log-analysis';

// AI Suggestions
export {
    getSuggestionsWithAI,
    chatWithCoachAI,
    generateQuickInsights,
    type SuggestionsInput,
    type Suggestion,
    type CoachChatInput,
    type CoachChatResponse,
    type QuickInsight,
} from './ai-suggestions';

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

import { generateWorkoutWithAI, type GenerateWorkoutInput } from './ai-workout-generator';
import { analyzeLogsWithAI, type AnalyzeLogsInput } from './ai-log-analysis';
import { chatWithCoachAI, type CoachChatInput } from './ai-suggestions';

/**
 * Quick workout generation with minimal input
 */
export async function quickGenerateWorkout(params: {
    user_id: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'elite';
    goal: 'strength' | 'hypertrophy' | 'endurance' | 'general_fitness';
    muscles: string[];
    minutes: number;
}) {
    const input: GenerateWorkoutInput = {
        user_id: params.user_id,
        user_profile: {
            fitness_level: params.level,
            goal: params.goal,
            age: 30, // Default
        },
        muscles: params.muscles,
        available_minutes: params.minutes,
        equipment: [], // Full gym assumed
    };

    return generateWorkoutWithAI(input);
}

/**
 * Quick log analysis for dashboard
 */
export async function quickAnalyzeLogs(params: {
    user_id: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'elite';
    goal: 'strength' | 'hypertrophy' | 'endurance' | 'general_fitness';
    logs: AnalyzeLogsInput['logs'];
    days?: number;
}) {
    const input: AnalyzeLogsInput = {
        user_id: params.user_id,
        user_profile: {
            fitness_level: params.level,
            goal: params.goal,
        },
        logs: params.logs,
        period_days: params.days || 30,
    };

    return analyzeLogsWithAI(input);
}

/**
 * Quick coach chat
 */
export async function askCoach(params: {
    user_id: string;
    message: string;
    user_name?: string;
}) {
    const input: CoachChatInput = {
        user_id: params.user_id,
        user_name: params.user_name,
        message: params.message,
    };

    return chatWithCoachAI(input);
}
