/**
 * YOUMOVE - Feature Access Control
 * 
 * Controls access to features based on user subscription.
 * Central point for all feature gating.
 */

import {
    PLANS,
    type PlanId,
    type FeatureFlag,
    type PlanFeatures
} from './plans';

// ============================================
// TYPES
// ============================================

export interface UserSubscription {
    user_id: string;
    plan_id: PlanId;
    status: SubscriptionStatus;
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    stripe_subscription_id?: string;
    stripe_customer_id?: string;
}

export type SubscriptionStatus =
    | 'active'
    | 'trialing'
    | 'past_due'
    | 'canceled'
    | 'unpaid'
    | 'incomplete';

export interface FeatureAccess {
    allowed: boolean;
    reason?: string;
    upgrade_prompt?: {
        message: string;
        required_plan: PlanId;
    };
    usage?: {
        used: number;
        limit: number;
        remaining: number;
    };
}

export interface UsageTracker {
    user_id: string;
    period_start: string;
    ai_workouts_used: number;
    ai_messages_today: number;
    last_message_date: string;
}

// ============================================
// USAGE STORAGE (in-memory for now)
// ============================================

const usageTrackers: Map<string, UsageTracker> = new Map();

function getUsageTracker(userId: string): UsageTracker {
    const existing = usageTrackers.get(userId);
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    if (existing) {
        // Reset daily counter if new day
        if (existing.last_message_date !== today) {
            existing.ai_messages_today = 0;
            existing.last_message_date = today;
        }

        // Reset monthly counter if new month
        if (existing.period_start !== monthStart) {
            existing.ai_workouts_used = 0;
            existing.period_start = monthStart;
        }

        return existing;
    }

    const newTracker: UsageTracker = {
        user_id: userId,
        period_start: monthStart,
        ai_workouts_used: 0,
        ai_messages_today: 0,
        last_message_date: today,
    };

    usageTrackers.set(userId, newTracker);
    return newTracker;
}

function updateUsage(userId: string, updates: Partial<UsageTracker>): void {
    const tracker = getUsageTracker(userId);
    Object.assign(tracker, updates);
    usageTrackers.set(userId, tracker);
}

// ============================================
// ACCESS CHECK FUNCTIONS
// ============================================

/**
 * Check if user has access to a boolean feature
 */
export function hasFeature(
    subscription: UserSubscription,
    feature: FeatureFlag
): boolean {
    // Check if subscription is active
    if (!isSubscriptionActive(subscription)) {
        // Fall back to free plan
        return !!PLANS.free.features[feature];
    }

    const plan = PLANS[subscription.plan_id];
    const value = plan.features[feature];

    if (typeof value === 'boolean') {
        return value;
    }

    // For numeric features, true if > 0 or unlimited (-1)
    return value === -1 || value > 0;
}

/**
 * Check if user can use a limited feature
 */
export function canUseFeature(
    subscription: UserSubscription,
    feature: FeatureFlag,
    userId: string
): FeatureAccess {
    const effectivePlan = isSubscriptionActive(subscription)
        ? subscription.plan_id
        : 'free';

    const plan = PLANS[effectivePlan];
    const limit = plan.features[feature];
    const tracker = getUsageTracker(userId);

    // Boolean features
    if (typeof limit === 'boolean') {
        if (limit) {
            return { allowed: true };
        }

        return {
            allowed: false,
            reason: 'Este recurso não está disponível no seu plano',
            upgrade_prompt: {
                message: `Faça upgrade para ${getMinimumPlanForFeature(feature)} para desbloquear`,
                required_plan: getMinimumPlanIdForFeature(feature),
            },
        };
    }

    // Unlimited features
    if (limit === -1) {
        return { allowed: true };
    }

    // Limited features
    let used = 0;

    switch (feature) {
        case 'ai_workouts_per_month':
            used = tracker.ai_workouts_used;
            break;
        case 'ai_coach_messages_per_day':
            used = tracker.ai_messages_today;
            break;
        case 'workout_history_days':
            // This is a retention limit, not a usage limit
            return { allowed: true, usage: { used: 0, limit, remaining: limit } };
        default:
            return { allowed: true };
    }

    const remaining = Math.max(0, limit - used);

    if (used >= limit) {
        return {
            allowed: false,
            reason: `Limite de ${limit} ${getFeatureUnit(feature)} atingido`,
            upgrade_prompt: {
                message: `Faça upgrade para mais ${getFeatureUnit(feature)}`,
                required_plan: getNextPlanWithMoreOf(effectivePlan, feature),
            },
            usage: { used, limit, remaining: 0 },
        };
    }

    return {
        allowed: true,
        usage: { used, limit, remaining },
    };
}

/**
 * Record usage of a limited feature
 */
export function recordFeatureUsage(
    userId: string,
    feature: FeatureFlag
): void {
    const tracker = getUsageTracker(userId);

    switch (feature) {
        case 'ai_workouts_per_month':
            updateUsage(userId, { ai_workouts_used: tracker.ai_workouts_used + 1 });
            break;
        case 'ai_coach_messages_per_day':
            updateUsage(userId, { ai_messages_today: tracker.ai_messages_today + 1 });
            break;
    }
}

/**
 * Get user's current usage for all limited features
 */
export function getUserUsage(
    userId: string,
    subscription: UserSubscription
): Record<string, { used: number; limit: number; remaining: number }> {
    const effectivePlan = isSubscriptionActive(subscription)
        ? subscription.plan_id
        : 'free';

    const plan = PLANS[effectivePlan];
    const tracker = getUsageTracker(userId);

    return {
        ai_workouts_per_month: {
            used: tracker.ai_workouts_used,
            limit: plan.features.ai_workouts_per_month,
            remaining: plan.features.ai_workouts_per_month === -1
                ? -1
                : Math.max(0, plan.features.ai_workouts_per_month - tracker.ai_workouts_used),
        },
        ai_coach_messages_per_day: {
            used: tracker.ai_messages_today,
            limit: plan.features.ai_coach_messages_per_day,
            remaining: plan.features.ai_coach_messages_per_day === -1
                ? -1
                : Math.max(0, plan.features.ai_coach_messages_per_day - tracker.ai_messages_today),
        },
    };
}

// ============================================
// SUBSCRIPTION HELPERS
// ============================================

export function isSubscriptionActive(subscription: UserSubscription): boolean {
    const activeStatuses: SubscriptionStatus[] = ['active', 'trialing'];

    if (!activeStatuses.includes(subscription.status)) {
        return false;
    }

    // Check if within period
    const now = new Date();
    const periodEnd = new Date(subscription.current_period_end);

    return now <= periodEnd;
}

export function getEffectivePlan(subscription: UserSubscription | null): PlanId {
    if (!subscription || !isSubscriptionActive(subscription)) {
        return 'free';
    }
    return subscription.plan_id;
}

export function getDaysUntilRenewal(subscription: UserSubscription): number {
    const now = new Date();
    const periodEnd = new Date(subscription.current_period_end);
    const diffMs = periodEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function isTrialing(subscription: UserSubscription): boolean {
    return subscription.status === 'trialing';
}

export function isCanceled(subscription: UserSubscription): boolean {
    return subscription.cancel_at_period_end || subscription.status === 'canceled';
}

// ============================================
// HELPERS
// ============================================

function getMinimumPlanForFeature(feature: FeatureFlag): string {
    if (PLANS.free.features[feature]) return 'Free';
    if (PLANS.pro.features[feature]) return 'Pro';
    return 'Elite';
}

function getMinimumPlanIdForFeature(feature: FeatureFlag): PlanId {
    if (PLANS.free.features[feature]) return 'free';
    if (PLANS.pro.features[feature]) return 'pro';
    return 'elite';
}

function getNextPlanWithMoreOf(currentPlan: PlanId, feature: FeatureFlag): PlanId {
    const order: PlanId[] = ['free', 'pro', 'elite'];
    const currentIndex = order.indexOf(currentPlan);

    for (let i = currentIndex + 1; i < order.length; i++) {
        const plan = PLANS[order[i]];
        const currentValue = PLANS[currentPlan].features[feature];
        const planValue = plan.features[feature];

        if (typeof planValue === 'number' && typeof currentValue === 'number') {
            if (planValue === -1 || planValue > currentValue) {
                return order[i];
            }
        }
    }

    return 'elite';
}

function getFeatureUnit(feature: FeatureFlag): string {
    switch (feature) {
        case 'ai_workouts_per_month':
            return 'treinos IA por mês';
        case 'ai_coach_messages_per_day':
            return 'mensagens por dia';
        case 'workout_history_days':
            return 'dias de histórico';
        default:
            return 'usos';
    }
}

// ============================================
// FEATURE GATE DECORATOR
// ============================================

export function requiresFeature(feature: FeatureFlag) {
    return function <T extends (...args: any[]) => any>(
        target: T,
        context: ClassMethodDecoratorContext
    ) {
        return function (this: any, ...args: any[]) {
            const subscription = this.subscription as UserSubscription;
            const userId = this.userId as string;

            const access = canUseFeature(subscription, feature, userId);

            if (!access.allowed) {
                throw new FeatureGateError(feature, access.reason || 'Acesso negado');
            }

            return target.apply(this, args);
        };
    };
}

export class FeatureGateError extends Error {
    constructor(
        public feature: FeatureFlag,
        message: string
    ) {
        super(message);
        this.name = 'FeatureGateError';
    }
}

// ============================================
// EXPORT
// ============================================

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
};
