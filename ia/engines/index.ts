/**
 * YOUMOVE - Workout Engine (Main Export)
 * 
 * Orchestrates all deterministic workout functions.
 */

// Safety limits (HARDCODED - AI cannot modify)
export * from './safety-limits';

// Workout templates
export * from './workout-templates';

// Workout generator (deterministic)
export {
    generateWeeklyPlan,
    generateSingleWorkout,
    type UserProfile,
    type GeneratedWorkout,
    type GeneratedExercise,
    type WeeklyPlan,
} from './workout-generator';

// Safety validator (validates all workouts including AI)
export {
    validateWorkout,
    validateAISuggestion,
    applyAdjustments,
    type ValidationResult,
    type ValidationWarning,
    type ValidationError,
    type WorkoutToValidate,
    type WeeklyContextToValidate,
} from './safety-validator';

// Time adjuster
export {
    adjustWorkoutForTime,
    expandWorkoutForTime,
    calculateWorkoutDuration,
    type TimeAdjustmentResult,
    type TimeChange,
} from './time-adjuster';

// Progression engine
export {
    calculateProgression,
    calculateWorkoutProgression,
    summarizeProgression,
    type LastPerformance,
    type ProgressionSuggestion,
    type ProgressionContext,
    type ProgressionType,
} from './progression-engine';

// AI Integration
export {
    // OpenAI Client
    callOpenAI,
    callOpenAIWithRetry,
    getAuditLogs,
    // AI Functions
    generateWorkoutWithAI,
    analyzeLogsWithAI,
    generateWeeklyReportWithAI,
    getSuggestionsWithAI,
    chatWithCoachAI,
    generateQuickInsights,
    // Convenience
    quickGenerateWorkout,
    quickAnalyzeLogs,
    askCoach,
    // Prompts
    PROMPTS,
} from './ai-integration';
