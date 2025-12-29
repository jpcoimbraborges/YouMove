/**
 * YOUMOVE - Input Validation Tests
 */

import { describe, it, expect } from 'vitest';
import {
    isString,
    isNumber,
    isPositiveNumber,
    isPositiveInteger,
    isInRange,
    isEmail,
    isUUID,
    sanitizeString,
    sanitizeNumber,
    validateReps,
    validateWeight,
    validateSets,
    validateRPE,
    validateSetLog,
    validateUserProfile,
    WORKOUT_LIMITS,
} from '../shared/validation/input-validation';

describe('Basic Validators', () => {
    describe('isString', () => {
        it('should return true for strings', () => {
            expect(isString('hello')).toBe(true);
            expect(isString('')).toBe(true);
        });

        it('should return false for non-strings', () => {
            expect(isString(123)).toBe(false);
            expect(isString(null)).toBe(false);
            expect(isString(undefined)).toBe(false);
            expect(isString({})).toBe(false);
        });
    });

    describe('isNumber', () => {
        it('should return true for valid numbers', () => {
            expect(isNumber(0)).toBe(true);
            expect(isNumber(42)).toBe(true);
            expect(isNumber(-10)).toBe(true);
            expect(isNumber(3.14)).toBe(true);
        });

        it('should return false for invalid numbers', () => {
            expect(isNumber(NaN)).toBe(false);
            expect(isNumber(Infinity)).toBe(false);
            expect(isNumber('42')).toBe(false);
            expect(isNumber(null)).toBe(false);
        });
    });

    describe('isPositiveNumber', () => {
        it('should return true for positive numbers', () => {
            expect(isPositiveNumber(1)).toBe(true);
            expect(isPositiveNumber(0.1)).toBe(true);
            expect(isPositiveNumber(999)).toBe(true);
        });

        it('should return false for zero and negatives', () => {
            expect(isPositiveNumber(0)).toBe(false);
            expect(isPositiveNumber(-1)).toBe(false);
        });
    });

    describe('isPositiveInteger', () => {
        it('should return true for positive integers', () => {
            expect(isPositiveInteger(1)).toBe(true);
            expect(isPositiveInteger(100)).toBe(true);
        });

        it('should return false for floats and non-positives', () => {
            expect(isPositiveInteger(1.5)).toBe(false);
            expect(isPositiveInteger(0)).toBe(false);
            expect(isPositiveInteger(-5)).toBe(false);
        });
    });

    describe('isInRange', () => {
        it('should validate ranges correctly', () => {
            expect(isInRange(5, 1, 10)).toBe(true);
            expect(isInRange(1, 1, 10)).toBe(true);
            expect(isInRange(10, 1, 10)).toBe(true);
            expect(isInRange(0, 1, 10)).toBe(false);
            expect(isInRange(11, 1, 10)).toBe(false);
        });
    });

    describe('isEmail', () => {
        it('should validate email formats', () => {
            expect(isEmail('test@example.com')).toBe(true);
            expect(isEmail('user.name@domain.co.uk')).toBe(true);
            expect(isEmail('invalid')).toBe(false);
            expect(isEmail('no@domain')).toBe(false);
            expect(isEmail('@nodomain.com')).toBe(false);
        });
    });

    describe('isUUID', () => {
        it('should validate UUID format', () => {
            expect(isUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
            expect(isUUID('not-a-uuid')).toBe(false);
            expect(isUUID('550e8400-e29b-41d4-a716')).toBe(false);
        });
    });
});

describe('Sanitizers', () => {
    describe('sanitizeString', () => {
        it('should trim whitespace', () => {
            expect(sanitizeString('  hello  ')).toBe('hello');
        });

        it('should remove HTML tags', () => {
            expect(sanitizeString('<script>alert("xss")</script>')).toBe('alert("xss")');
            expect(sanitizeString('<b>bold</b>')).toBe('bold');
        });

        it('should limit length', () => {
            const long = 'a'.repeat(2000);
            expect(sanitizeString(long, 100).length).toBe(100);
        });

        it('should handle non-strings', () => {
            expect(sanitizeString(123)).toBe('');
            expect(sanitizeString(null)).toBe('');
        });
    });

    describe('sanitizeNumber', () => {
        it('should clamp to range', () => {
            expect(sanitizeNumber(5, 0, 10)).toBe(5);
            expect(sanitizeNumber(-5, 0, 10)).toBe(0);
            expect(sanitizeNumber(15, 0, 10)).toBe(10);
        });

        it('should handle non-numbers', () => {
            expect(sanitizeNumber('abc', 0, 10)).toBe(0);
            expect(sanitizeNumber(null, 5, 10)).toBe(5);
        });
    });
});

describe('Workout Validators', () => {
    describe('validateReps', () => {
        it('should accept valid reps', () => {
            expect(validateReps(10).valid).toBe(true);
            expect(validateReps(1).valid).toBe(true);
            expect(validateReps(100).valid).toBe(true);
        });

        it('should reject invalid reps', () => {
            expect(validateReps(0).valid).toBe(false);
            expect(validateReps(-1).valid).toBe(false);
            expect(validateReps(101).valid).toBe(false);
            expect(validateReps('ten').valid).toBe(false);
        });

        it('should have correct error codes', () => {
            const result = validateReps(150);
            expect(result.errors[0].code).toBe('REPS_OUT_OF_RANGE');
        });
    });

    describe('validateWeight', () => {
        it('should accept valid weights', () => {
            expect(validateWeight(0).valid).toBe(true);
            expect(validateWeight(80.5).valid).toBe(true);
            expect(validateWeight(500).valid).toBe(true);
        });

        it('should reject invalid weights', () => {
            expect(validateWeight(-1).valid).toBe(false);
            expect(validateWeight(1001).valid).toBe(false);
        });

        it('should round to 0.25 increments', () => {
            const result = validateWeight(80.3);
            expect(result.sanitized).toBe(80.25);
        });
    });

    describe('validateSets', () => {
        it('should accept valid sets', () => {
            expect(validateSets(3).valid).toBe(true);
            expect(validateSets(1).valid).toBe(true);
            expect(validateSets(20).valid).toBe(true);
        });

        it('should reject invalid sets', () => {
            expect(validateSets(0).valid).toBe(false);
            expect(validateSets(21).valid).toBe(false);
            expect(validateSets(3.5).valid).toBe(false);
        });
    });

    describe('validateRPE', () => {
        it('should accept valid RPE', () => {
            expect(validateRPE(7).valid).toBe(true);
            expect(validateRPE(1).valid).toBe(true);
            expect(validateRPE(10).valid).toBe(true);
        });

        it('should accept null/undefined RPE', () => {
            expect(validateRPE(null).valid).toBe(true);
            expect(validateRPE(undefined).valid).toBe(true);
        });

        it('should reject invalid RPE', () => {
            expect(validateRPE(0).valid).toBe(false);
            expect(validateRPE(11).valid).toBe(false);
        });

        it('should round to 0.5 increments', () => {
            const result = validateRPE(7.3);
            expect(result.sanitized).toBe(7.5);
        });
    });

    describe('validateSetLog', () => {
        it('should accept valid set log', () => {
            const result = validateSetLog({
                reps: 10,
                weight: 80,
                rpe: 8,
            });
            expect(result.valid).toBe(true);
            expect(result.sanitized).toHaveProperty('reps', 10);
            expect(result.sanitized).toHaveProperty('weight', 80);
            expect(result.sanitized).toHaveProperty('rpe', 8);
        });

        it('should reject invalid set log', () => {
            const result = validateSetLog({
                reps: -1,
                weight: 80,
            });
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should allow optional RPE', () => {
            const result = validateSetLog({
                reps: 10,
                weight: 80,
            });
            expect(result.valid).toBe(true);
        });
    });
});

describe('User Profile Validation', () => {
    it('should accept valid profile', () => {
        const result = validateUserProfile({
            name: 'João',
            age: 30,
            weight_kg: 80,
            height_cm: 180,
            fitness_level: 'intermediate',
            goal: 'hypertrophy',
        });
        expect(result.valid).toBe(true);
    });

    it('should reject invalid age', () => {
        const result = validateUserProfile({ age: 10 });
        expect(result.valid).toBe(false);
        expect(result.errors[0].code).toBe('INVALID_AGE');
    });

    it('should reject invalid fitness level', () => {
        const result = validateUserProfile({ fitness_level: 'pro' });
        expect(result.valid).toBe(false);
        expect(result.errors[0].code).toBe('INVALID_FITNESS_LEVEL');
    });

    it('should reject invalid goal', () => {
        const result = validateUserProfile({ goal: 'get_huge' });
        expect(result.valid).toBe(false);
        expect(result.errors[0].code).toBe('INVALID_GOAL');
    });
});
