/**
 * YOUMOVE - Input Validation
 * 
 * Comprehensive validation for all user inputs.
 * Prevents invalid data from reaching the system.
 */

// ============================================
// VALIDATION RESULT
// ============================================

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    sanitized?: unknown;
}

export interface ValidationError {
    field: string;
    code: string;
    message: string;
    value?: unknown;
}

// ============================================
// BASIC VALIDATORS
// ============================================

export function isString(value: unknown): value is string {
    return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

export function isPositiveNumber(value: unknown): value is number {
    return isNumber(value) && value > 0;
}

export function isNonNegativeNumber(value: unknown): value is number {
    return isNumber(value) && value >= 0;
}

export function isInteger(value: unknown): value is number {
    return isNumber(value) && Number.isInteger(value);
}

export function isPositiveInteger(value: unknown): value is number {
    return isInteger(value) && value > 0;
}

export function isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
}

export function isEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
}

export function isUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
}

export function isDate(value: string): boolean {
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime());
}

export function isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
}

export function isNonEmptyArray(value: unknown): value is unknown[] {
    return isArray(value) && value.length > 0;
}

// ============================================
// SANITIZERS
// ============================================

export function sanitizeString(value: unknown, maxLength = 1000): string {
    if (!isString(value)) return '';

    return value
        .trim()
        .slice(0, maxLength)
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/[<>]/g, '');   // Remove remaining angle brackets
}

export function sanitizeNumber(value: unknown, min = 0, max = 999999): number {
    if (!isNumber(value)) return min;
    return Math.max(min, Math.min(max, value));
}

export function sanitizeInteger(value: unknown, min = 0, max = 999999): number {
    return Math.round(sanitizeNumber(value, min, max));
}

export function sanitizeArray<T>(
    value: unknown,
    itemValidator: (item: unknown) => item is T,
    maxItems = 100
): T[] {
    if (!isArray(value)) return [];

    return value
        .slice(0, maxItems)
        .filter(itemValidator);
}

// ============================================
// WORKOUT INPUT VALIDATION
// ============================================

export interface WorkoutInputLimits {
    reps: { min: number; max: number };
    weight: { min: number; max: number };
    sets: { min: number; max: number };
    rest: { min: number; max: number };
    rpe: { min: number; max: number };
    duration: { min: number; max: number };
    exercises: { min: number; max: number };
}

export const WORKOUT_LIMITS: WorkoutInputLimits = {
    reps: { min: 1, max: 100 },
    weight: { min: 0, max: 1000 },  // kg
    sets: { min: 1, max: 20 },
    rest: { min: 0, max: 600 },     // seconds (10 min max)
    rpe: { min: 1, max: 10 },
    duration: { min: 5, max: 240 }, // minutes
    exercises: { min: 1, max: 20 },
};

export function validateReps(value: unknown): ValidationResult {
    const errors: ValidationError[] = [];

    if (!isPositiveInteger(value)) {
        errors.push({
            field: 'reps',
            code: 'INVALID_REPS',
            message: 'Repetições deve ser um número inteiro positivo',
            value,
        });
        return { valid: false, errors };
    }

    if (!isInRange(value, WORKOUT_LIMITS.reps.min, WORKOUT_LIMITS.reps.max)) {
        errors.push({
            field: 'reps',
            code: 'REPS_OUT_OF_RANGE',
            message: `Repetições deve estar entre ${WORKOUT_LIMITS.reps.min} e ${WORKOUT_LIMITS.reps.max}`,
            value,
        });
        return { valid: false, errors };
    }

    return { valid: true, errors: [], sanitized: value };
}

export function validateWeight(value: unknown): ValidationResult {
    const errors: ValidationError[] = [];

    if (!isNonNegativeNumber(value)) {
        errors.push({
            field: 'weight',
            code: 'INVALID_WEIGHT',
            message: 'Peso deve ser um número não negativo',
            value,
        });
        return { valid: false, errors };
    }

    if (!isInRange(value, WORKOUT_LIMITS.weight.min, WORKOUT_LIMITS.weight.max)) {
        errors.push({
            field: 'weight',
            code: 'WEIGHT_OUT_OF_RANGE',
            message: `Peso deve estar entre ${WORKOUT_LIMITS.weight.min} e ${WORKOUT_LIMITS.weight.max}kg`,
            value,
        });
        return { valid: false, errors };
    }

    return { valid: true, errors: [], sanitized: Math.round(value * 4) / 4 }; // Round to 0.25
}

export function validateSets(value: unknown): ValidationResult {
    const errors: ValidationError[] = [];

    if (!isPositiveInteger(value)) {
        errors.push({
            field: 'sets',
            code: 'INVALID_SETS',
            message: 'Séries deve ser um número inteiro positivo',
            value,
        });
        return { valid: false, errors };
    }

    if (!isInRange(value, WORKOUT_LIMITS.sets.min, WORKOUT_LIMITS.sets.max)) {
        errors.push({
            field: 'sets',
            code: 'SETS_OUT_OF_RANGE',
            message: `Séries deve estar entre ${WORKOUT_LIMITS.sets.min} e ${WORKOUT_LIMITS.sets.max}`,
            value,
        });
        return { valid: false, errors };
    }

    return { valid: true, errors: [], sanitized: value };
}

export function validateRPE(value: unknown): ValidationResult {
    const errors: ValidationError[] = [];

    if (value === null || value === undefined) {
        return { valid: true, errors: [], sanitized: null };
    }

    if (!isNumber(value)) {
        errors.push({
            field: 'rpe',
            code: 'INVALID_RPE',
            message: 'RPE deve ser um número',
            value,
        });
        return { valid: false, errors };
    }

    if (!isInRange(value, WORKOUT_LIMITS.rpe.min, WORKOUT_LIMITS.rpe.max)) {
        errors.push({
            field: 'rpe',
            code: 'RPE_OUT_OF_RANGE',
            message: `RPE deve estar entre ${WORKOUT_LIMITS.rpe.min} e ${WORKOUT_LIMITS.rpe.max}`,
            value,
        });
        return { valid: false, errors };
    }

    return { valid: true, errors: [], sanitized: Math.round(value * 2) / 2 }; // Round to 0.5
}

export function validateRestSeconds(value: unknown): ValidationResult {
    const errors: ValidationError[] = [];

    if (!isNonNegativeNumber(value)) {
        errors.push({
            field: 'rest',
            code: 'INVALID_REST',
            message: 'Descanso deve ser um número não negativo',
            value,
        });
        return { valid: false, errors };
    }

    if (!isInRange(value, WORKOUT_LIMITS.rest.min, WORKOUT_LIMITS.rest.max)) {
        errors.push({
            field: 'rest',
            code: 'REST_OUT_OF_RANGE',
            message: `Descanso deve estar entre ${WORKOUT_LIMITS.rest.min} e ${WORKOUT_LIMITS.rest.max} segundos`,
            value,
        });
        return { valid: false, errors };
    }

    return { valid: true, errors: [], sanitized: Math.round(value) };
}

// ============================================
// SET LOG VALIDATION
// ============================================

export interface SetLogInput {
    reps: unknown;
    weight: unknown;
    rpe?: unknown;
    notes?: unknown;
}

export function validateSetLog(input: SetLogInput): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate reps
    const repsResult = validateReps(input.reps);
    if (!repsResult.valid) {
        errors.push(...repsResult.errors);
    }

    // Validate weight
    const weightResult = validateWeight(input.weight);
    if (!weightResult.valid) {
        errors.push(...weightResult.errors);
    }

    // Validate RPE (optional)
    if (input.rpe !== undefined && input.rpe !== null) {
        const rpeResult = validateRPE(input.rpe);
        if (!rpeResult.valid) {
            errors.push(...rpeResult.errors);
        }
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    return {
        valid: true,
        errors: [],
        sanitized: {
            reps: repsResult.sanitized,
            weight: weightResult.sanitized,
            rpe: input.rpe !== undefined ? validateRPE(input.rpe).sanitized : null,
            notes: input.notes ? sanitizeString(input.notes, 500) : null,
        },
    };
}

// ============================================
// USER PROFILE VALIDATION
// ============================================

export interface UserProfileInput {
    name?: unknown;
    age?: unknown;
    weight_kg?: unknown;
    height_cm?: unknown;
    fitness_level?: unknown;
    goal?: unknown;
}

const VALID_FITNESS_LEVELS = ['beginner', 'intermediate', 'advanced', 'elite'];
const VALID_GOALS = ['strength', 'hypertrophy', 'endurance', 'general_fitness', 'weight_loss'];

export function validateUserProfile(input: UserProfileInput): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate name
    if (input.name !== undefined) {
        if (!isString(input.name) || input.name.trim().length < 2) {
            errors.push({
                field: 'name',
                code: 'INVALID_NAME',
                message: 'Nome deve ter pelo menos 2 caracteres',
                value: input.name,
            });
        }
    }

    // Validate age
    if (input.age !== undefined) {
        if (!isPositiveInteger(input.age) || !isInRange(input.age as number, 13, 100)) {
            errors.push({
                field: 'age',
                code: 'INVALID_AGE',
                message: 'Idade deve estar entre 13 e 100 anos',
                value: input.age,
            });
        }
    }

    // Validate weight
    if (input.weight_kg !== undefined) {
        if (!isPositiveNumber(input.weight_kg) || !isInRange(input.weight_kg as number, 30, 300)) {
            errors.push({
                field: 'weight_kg',
                code: 'INVALID_WEIGHT',
                message: 'Peso deve estar entre 30 e 300 kg',
                value: input.weight_kg,
            });
        }
    }

    // Validate height
    if (input.height_cm !== undefined) {
        if (!isPositiveInteger(input.height_cm) || !isInRange(input.height_cm as number, 100, 250)) {
            errors.push({
                field: 'height_cm',
                code: 'INVALID_HEIGHT',
                message: 'Altura deve estar entre 100 e 250 cm',
                value: input.height_cm,
            });
        }
    }

    // Validate fitness level
    if (input.fitness_level !== undefined) {
        if (!isString(input.fitness_level) || !VALID_FITNESS_LEVELS.includes(input.fitness_level)) {
            errors.push({
                field: 'fitness_level',
                code: 'INVALID_FITNESS_LEVEL',
                message: `Nível de fitness deve ser: ${VALID_FITNESS_LEVELS.join(', ')}`,
                value: input.fitness_level,
            });
        }
    }

    // Validate goal
    if (input.goal !== undefined) {
        if (!isString(input.goal) || !VALID_GOALS.includes(input.goal)) {
            errors.push({
                field: 'goal',
                code: 'INVALID_GOAL',
                message: `Objetivo deve ser: ${VALID_GOALS.join(', ')}`,
                value: input.goal,
            });
        }
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    return {
        valid: true,
        errors: [],
        sanitized: {
            name: input.name ? sanitizeString(input.name, 100) : undefined,
            age: input.age,
            weight_kg: input.weight_kg ? Math.round((input.weight_kg as number) * 10) / 10 : undefined,
            height_cm: input.height_cm ? Math.round(input.height_cm as number) : undefined,
            fitness_level: input.fitness_level,
            goal: input.goal,
        },
    };
}

// ============================================
// EXPORT
// ============================================

export {
    WORKOUT_LIMITS,
    VALID_FITNESS_LEVELS,
    VALID_GOALS,
};
