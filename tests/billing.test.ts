/**
 * YOUMOVE - Billing / Feature Access Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    PLANS,
    getPlan,
    getPlanPrice,
    getMonthlyEquivalent,
    getYearlySavings,
    getYearlySavingsPercent,
    compareFeatures,
    getFeatureDifferences,
} from '../shared/billing/plans';
import {
    hasFeature,
    canUseFeature,
    recordFeatureUsage,
    getUserUsage,
    isSubscriptionActive,
    getEffectivePlan,
    getDaysUntilRenewal,
    type UserSubscription,
} from '../shared/billing/feature-access';

describe('Plan Definitions', () => {
    it('should have all plans defined', () => {
        expect(PLANS.free).toBeDefined();
        expect(PLANS.pro).toBeDefined();
        expect(PLANS.elite).toBeDefined();
    });

    it('should have correct pricing', () => {
        expect(PLANS.free.price_monthly_brl).toBe(0);
        expect(PLANS.free.price_yearly_brl).toBe(0);

        expect(PLANS.pro.price_monthly_brl).toBeGreaterThan(0);
        expect(PLANS.pro.price_yearly_brl).toBeGreaterThan(0);

        expect(PLANS.elite.price_monthly_brl).toBeGreaterThan(PLANS.pro.price_monthly_brl);
    });

    it('should have yearly discount', () => {
        const proMonthlyTotal = PLANS.pro.price_monthly_brl * 12;
        expect(PLANS.pro.price_yearly_brl).toBeLessThan(proMonthlyTotal);

        const eliteMonthlyTotal = PLANS.elite.price_monthly_brl * 12;
        expect(PLANS.elite.price_yearly_brl).toBeLessThan(eliteMonthlyTotal);
    });

    it('should have all features defined', () => {
        const requiredFeatures = [
            'ai_workouts_per_month',
            'ai_coach_messages_per_day',
            'manual_workouts',
            'custom_workouts',
            'ai_log_analysis',
            'progress_charts',
            'offline_mode',
        ];

        requiredFeatures.forEach(feature => {
            expect(PLANS.free.features).toHaveProperty(feature);
            expect(PLANS.pro.features).toHaveProperty(feature);
            expect(PLANS.elite.features).toHaveProperty(feature);
        });
    });
});

describe('Plan Utilities', () => {
    describe('getPlan', () => {
        it('should return correct plan', () => {
            expect(getPlan('free').name).toBe('Free');
            expect(getPlan('pro').name).toBe('Pro');
            expect(getPlan('elite').name).toBe('Elite');
        });
    });

    describe('getPlanPrice', () => {
        it('should return correct price for cycle', () => {
            expect(getPlanPrice('pro', 'monthly')).toBe(PLANS.pro.price_monthly_brl);
            expect(getPlanPrice('pro', 'yearly')).toBe(PLANS.pro.price_yearly_brl);
        });
    });

    describe('getMonthlyEquivalent', () => {
        it('should return monthly price for monthly', () => {
            expect(getMonthlyEquivalent('pro', 'monthly')).toBe(PLANS.pro.price_monthly_brl);
        });

        it('should calculate monthly equivalent for yearly', () => {
            const equivalent = getMonthlyEquivalent('pro', 'yearly');
            expect(equivalent).toBeLessThan(PLANS.pro.price_monthly_brl);
        });
    });

    describe('getYearlySavings', () => {
        it('should calculate savings correctly', () => {
            const savings = getYearlySavings('pro');
            const monthlyTotal = PLANS.pro.price_monthly_brl * 12;
            expect(savings).toBe(Math.round((monthlyTotal - PLANS.pro.price_yearly_brl) * 100) / 100);
        });
    });

    describe('compareFeatures', () => {
        it('should compare boolean features', () => {
            expect(compareFeatures('ai_log_analysis', 'free', 'pro')).toBeLessThan(0);
            expect(compareFeatures('ai_log_analysis', 'pro', 'free')).toBeGreaterThan(0);
        });

        it('should compare numeric features', () => {
            expect(compareFeatures('ai_workouts_per_month', 'free', 'pro')).toBeLessThan(0);
        });
    });

    describe('getFeatureDifferences', () => {
        it('should list differences between plans', () => {
            const diffs = getFeatureDifferences('free', 'pro');

            expect(diffs.length).toBeGreaterThan(0);
            expect(diffs.some(d => d.feature === 'ai_workouts_per_month')).toBe(true);
        });
    });
});

describe('Subscription Status', () => {
    const createSubscription = (overrides = {}): UserSubscription => {
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        return {
            user_id: 'user_123',
            plan_id: 'pro',
            status: 'active',
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            cancel_at_period_end: false,
            ...overrides,
        };
    };

    describe('isSubscriptionActive', () => {
        it('should return true for active subscription', () => {
            const sub = createSubscription({ status: 'active' });
            expect(isSubscriptionActive(sub)).toBe(true);
        });

        it('should return true for trialing subscription', () => {
            const sub = createSubscription({ status: 'trialing' });
            expect(isSubscriptionActive(sub)).toBe(true);
        });

        it('should return false for canceled subscription', () => {
            const sub = createSubscription({ status: 'canceled' });
            expect(isSubscriptionActive(sub)).toBe(false);
        });

        it('should return false for expired subscription', () => {
            const pastDate = new Date();
            pastDate.setMonth(pastDate.getMonth() - 1);

            const sub = createSubscription({
                current_period_end: pastDate.toISOString(),
            });
            expect(isSubscriptionActive(sub)).toBe(false);
        });
    });

    describe('getEffectivePlan', () => {
        it('should return plan for active subscription', () => {
            const sub = createSubscription({ plan_id: 'elite' });
            expect(getEffectivePlan(sub)).toBe('elite');
        });

        it('should return free for null subscription', () => {
            expect(getEffectivePlan(null)).toBe('free');
        });

        it('should return free for inactive subscription', () => {
            const sub = createSubscription({ status: 'canceled' });
            expect(getEffectivePlan(sub)).toBe('free');
        });
    });

    describe('getDaysUntilRenewal', () => {
        it('should calculate days correctly', () => {
            const periodEnd = new Date();
            periodEnd.setDate(periodEnd.getDate() + 15);

            const sub = createSubscription({
                current_period_end: periodEnd.toISOString(),
            });

            const days = getDaysUntilRenewal(sub);
            expect(days).toBe(15);
        });
    });
});

describe('Feature Access Control', () => {
    const freeSubscription: UserSubscription = {
        user_id: 'user_free',
        plan_id: 'free',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: false,
    };

    const proSubscription: UserSubscription = {
        user_id: 'user_pro',
        plan_id: 'pro',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: false,
    };

    describe('hasFeature', () => {
        it('should grant basic features to free', () => {
            expect(hasFeature(freeSubscription, 'manual_workouts')).toBe(true);
            expect(hasFeature(freeSubscription, 'offline_mode')).toBe(true);
            expect(hasFeature(freeSubscription, 'progress_charts')).toBe(true);
        });

        it('should restrict premium features from free', () => {
            expect(hasFeature(freeSubscription, 'custom_workouts')).toBe(false);
            expect(hasFeature(freeSubscription, 'ai_log_analysis')).toBe(false);
            expect(hasFeature(freeSubscription, 'advanced_analytics')).toBe(false);
        });

        it('should grant premium features to pro', () => {
            expect(hasFeature(proSubscription, 'custom_workouts')).toBe(true);
            expect(hasFeature(proSubscription, 'ai_log_analysis')).toBe(true);
            expect(hasFeature(proSubscription, 'advanced_analytics')).toBe(true);
        });
    });

    describe('canUseFeature', () => {
        it('should check usage limits for free', () => {
            const result = canUseFeature(freeSubscription, 'ai_workouts_per_month', 'user_free');

            expect(result.allowed).toBe(true);
            expect(result.usage).toBeDefined();
            expect(result.usage!.limit).toBe(PLANS.free.features.ai_workouts_per_month);
        });

        it('should track usage', () => {
            const userId = 'user_usage_test';

            // First use
            const result1 = canUseFeature(freeSubscription, 'ai_workouts_per_month', userId);
            expect(result1.allowed).toBe(true);

            recordFeatureUsage(userId, 'ai_workouts_per_month');

            // Check usage increased
            const usage = getUserUsage(userId, freeSubscription);
            expect(usage.ai_workouts_per_month.used).toBe(1);
        });

        it('should block when limit exceeded', () => {
            const userId = 'user_limit_test';

            // Use up all free AI workouts
            for (let i = 0; i < PLANS.free.features.ai_workouts_per_month; i++) {
                recordFeatureUsage(userId, 'ai_workouts_per_month');
            }

            const result = canUseFeature(
                { ...freeSubscription, user_id: userId },
                'ai_workouts_per_month',
                userId
            );

            expect(result.allowed).toBe(false);
            expect(result.upgrade_prompt).toBeDefined();
        });

        it('should have higher limits for pro', () => {
            const freeLimit = PLANS.free.features.ai_workouts_per_month;
            const proLimit = PLANS.pro.features.ai_workouts_per_month;

            expect(proLimit).toBeGreaterThan(freeLimit);
        });
    });
});

describe('Plan Feature Comparison', () => {
    it('should have more AI workouts in pro than free', () => {
        expect(PLANS.pro.features.ai_workouts_per_month)
            .toBeGreaterThan(PLANS.free.features.ai_workouts_per_month);
    });

    it('should have unlimited AI in elite (-1)', () => {
        expect(PLANS.elite.features.ai_workouts_per_month).toBe(-1);
        expect(PLANS.elite.features.ai_coach_messages_per_day).toBe(-1);
    });

    it('should have more history in pro than free', () => {
        expect(PLANS.pro.features.workout_history_days)
            .toBeGreaterThan(PLANS.free.features.workout_history_days);
    });

    it('should have unlimited history in elite (-1)', () => {
        expect(PLANS.elite.features.workout_history_days).toBe(-1);
    });

    it('should only have priority support in elite', () => {
        expect(PLANS.free.features.priority_support).toBe(false);
        expect(PLANS.pro.features.priority_support).toBe(false);
        expect(PLANS.elite.features.priority_support).toBe(true);
    });
});
