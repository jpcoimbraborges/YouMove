/**
 * YOUMOVE - Validation Module
 * 
 * Central export for all validation and security functionality.
 */

// Input Validation
export {
    // Validators
    isString,
    isNumber,
    isPositiveNumber,
    isNonNegativeNumber,
    isInteger,
    isPositiveInteger,
    isInRange,
    isEmail,
    isUUID,
    isDate,
    isArray,
    isNonEmptyArray,

    // Sanitizers
    sanitizeString,
    sanitizeNumber,
    sanitizeInteger,
    sanitizeArray,

    // Workout validators
    validateReps,
    validateWeight,
    validateSets,
    validateRPE,
    validateRestSeconds,
    validateSetLog,
    validateUserProfile,

    // Constants
    WORKOUT_LIMITS,
    VALID_FITNESS_LEVELS,
    VALID_GOALS,

    // Types
    type ValidationResult,
    type ValidationError,
    type WorkoutInputLimits,
} from './input-validation';

// Safety Guardrails
export {
    // Checks
    checkWorkoutSafety,
    checkProgressionSafety,
    checkWeeklyVolumeSafety,
    getAgeGroup,

    // Limits
    ABSOLUTE_LIMITS,
    AGE_LIMITS,
    LEVEL_LIMITS,
    INJURY_RESTRICTIONS,

    // Types
    type SafetyCheck,
    type SafetyViolation,
    type UserContext,
} from './safety-guardrails';

// AI Abuse Prevention
export {
    // Checks
    checkAIAbuse,
    recordAIRequest,
    recordAIFailure,
    recordViolation,
    getUserAILimits,

    // Limits
    AI_LIMITS,

    // Types
    type AbuseCheckResult,
    type ViolationType,
    type UserAIHistory,
} from './ai-abuse-prevention';

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

import { validateSetLog, type SetLogInput } from './input-validation';
import { checkWorkoutSafety, type UserContext } from './safety-guardrails';
import { checkAIAbuse, recordAIRequest, recordAIFailure } from './ai-abuse-prevention';

/**
 * Validate and check safety for set log
 */
export function validateAndSanitizeSetLog(
    input: SetLogInput
): { valid: boolean; errors: string[]; sanitized?: unknown } {
    const result = validateSetLog(input);

    if (!result.valid) {
        return {
            valid: false,
            errors: result.errors.map(e => e.message),
        };
    }

    return {
        valid: true,
        errors: [],
        sanitized: result.sanitized,
    };
}

/**
 * Full safety check for workout
 */
export function validateWorkoutWithSafety(
    workout: Parameters<typeof checkWorkoutSafety>[0],
    userContext: UserContext
): {
    valid: boolean;
    errors: string[];
    warnings: string[];
} {
    const result = checkWorkoutSafety(workout, userContext);

    const errors = result.violations
        .filter(v => v.severity === 'critical' || v.severity === 'error')
        .map(v => v.message);

    const warnings = result.violations
        .filter(v => v.severity === 'warning')
        .map(v => v.message);

    return {
        valid: result.passed,
        errors,
        warnings,
    };
}

/**
 * Check AI request with automatic recording
 */
export async function checkAndRecordAIRequest<T>(
    userId: string,
    input: string,
    requestType: string,
    aiCall: () => Promise<{ success: boolean; tokens?: number; costUsd?: number; data?: T }>
): Promise<{
    allowed: boolean;
    success: boolean;
    reason?: string;
    data?: T;
}> {
    // Check abuse
    const check = checkAIAbuse(userId, input, requestType);
    if (!check.allowed) {
        return {
            allowed: false,
            success: false,
            reason: check.reason,
        };
    }

    // Make request
    try {
        const result = await aiCall();

        if (result.success) {
            recordAIRequest(userId, result.tokens || 0, result.costUsd || 0);
            return {
                allowed: true,
                success: true,
                data: result.data,
            };
        } else {
            recordAIFailure(userId);
            return {
                allowed: true,
                success: false,
                reason: 'AI request failed',
            };
        }
    } catch (error) {
        recordAIFailure(userId);
        return {
            allowed: true,
            success: false,
            reason: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
