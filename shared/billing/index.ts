/**
 * YOUMOVE - Billing Module
 * 
 * Central export for all billing and subscription functionality.
 */

// Plans
export {
    PLANS,
    FEATURE_DESCRIPTIONS,
    getPlan,
    getPlanPrice,
    getMonthlyEquivalent,
    getYearlySavings,
    getYearlySavingsPercent,
    compareFeatures,
    getFeatureDifferences,
    type Plan,
    type PlanId,
    type BillingCycle,
    type PlanFeatures,
    type FeatureFlag,
} from './plans';

// Feature Access
export {
    hasFeature,
    canUseFeature,
    recordFeatureUsage,
    getUserUsage,
    isSubscriptionActive,
    getEffectivePlan,
    getDaysUntilRenewal,
    isTrialing,
    isCanceled,
    requiresFeature,
    FeatureGateError,
    type UserSubscription,
    type SubscriptionStatus,
    type FeatureAccess,
    type UsageTracker,
} from './feature-access';

// Stripe Integration
export {
    STRIPE_CONFIG,
    STRIPE_PRICE_IDS,
    getStripePriceId,
    createCheckoutSession,
    createPortalSession,
    handleWebhook,
    verifyWebhookSignature,
    syncSubscription,
    cancelSubscription,
    resumeSubscription,
    changePlan,
    mapStripeStatus,
    getPlanIdFromPriceId,
    type CreateCheckoutParams,
    type CheckoutResult,
    type PortalResult,
    type WebhookEvent,
} from './stripe-integration';

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

import { PLANS, type PlanId } from './plans';
import {
    canUseFeature,
    recordFeatureUsage,
    type UserSubscription,
    type FeatureFlag
} from './feature-access';
import { createCheckoutSession, type BillingCycle } from './stripe-integration';

/**
 * Check if user can use a feature, and record usage if allowed
 */
export async function useFeatureWithTracking(
    subscription: UserSubscription,
    feature: FeatureFlag,
    userId: string
): Promise<{
    allowed: boolean;
    remaining?: number;
    error?: string;
}> {
    const access = canUseFeature(subscription, feature, userId);

    if (!access.allowed) {
        return {
            allowed: false,
            error: access.reason,
        };
    }

    recordFeatureUsage(userId, feature);

    return {
        allowed: true,
        remaining: access.usage?.remaining,
    };
}

/**
 * Get upgrade options for a user
 */
export function getUpgradeOptions(currentPlan: PlanId): Array<{
    plan: PlanId;
    name: string;
    price_monthly: number;
    price_yearly: number;
    savings_percent: number;
}> {
    const options: Array<{
        plan: PlanId;
        name: string;
        price_monthly: number;
        price_yearly: number;
        savings_percent: number;
    }> = [];

    const order: PlanId[] = ['free', 'pro', 'elite'];
    const currentIndex = order.indexOf(currentPlan);

    for (let i = currentIndex + 1; i < order.length; i++) {
        const planId = order[i];
        const plan = PLANS[planId];
        const monthlyTotal = plan.price_monthly_brl * 12;
        const savingsPercent = monthlyTotal > 0
            ? Math.round(((monthlyTotal - plan.price_yearly_brl) / monthlyTotal) * 100)
            : 0;

        options.push({
            plan: planId,
            name: plan.name,
            price_monthly: plan.price_monthly_brl,
            price_yearly: plan.price_yearly_brl,
            savings_percent: savingsPercent,
        });
    }

    return options;
}

/**
 * Quick checkout for upgrade
 */
export async function quickUpgrade(
    userId: string,
    userEmail: string,
    targetPlan: PlanId,
    cycle: BillingCycle = 'monthly'
): Promise<string> {
    const result = await createCheckoutSession({
        user_id: userId,
        user_email: userEmail,
        plan_id: targetPlan,
        billing_cycle: cycle,
    });

    return result.url;
}

// ============================================
// DEFAULT SUBSCRIPTION
// ============================================

export function createDefaultSubscription(userId: string): UserSubscription {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setFullYear(periodEnd.getFullYear() + 100); // "Forever" for free

    return {
        user_id: userId,
        plan_id: 'free',
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
    };
}
