/**
 * YOUMOVE - Stripe Integration (Preparation)
 * 
 * Ready for Stripe subscription integration.
 * Handles webhooks, customer management, and subscription lifecycle.
 */

import { PLANS, type PlanId, type BillingCycle } from './plans';
import type { UserSubscription, SubscriptionStatus } from './feature-access';

// ============================================
// STRIPE CONFIGURATION
// ============================================

export const STRIPE_CONFIG = {
    // API Keys (from env)
    SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

    // URLs
    SUCCESS_URL: '/billing/success',
    CANCEL_URL: '/billing/cancel',
    CUSTOMER_PORTAL_URL: '/billing/portal',

    // Trial
    TRIAL_DAYS: 7,

    // Tax
    TAX_RATE_ID: process.env.STRIPE_TAX_RATE_ID,
} as const;

// ============================================
// PRICE IDS (to be configured in Stripe Dashboard)
// ============================================

export const STRIPE_PRICE_IDS = {
    pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
    elite_monthly: process.env.STRIPE_PRICE_ELITE_MONTHLY,
    elite_yearly: process.env.STRIPE_PRICE_ELITE_YEARLY,
} as const;

export function getStripePriceId(planId: PlanId, cycle: BillingCycle): string | null {
    if (planId === 'free') return null;

    const key = `${planId}_${cycle}` as keyof typeof STRIPE_PRICE_IDS;
    return STRIPE_PRICE_IDS[key] || null;
}

// ============================================
// SUBSCRIPTION MANAGEMENT TYPES
// ============================================

export interface CreateCheckoutParams {
    user_id: string;
    user_email: string;
    plan_id: PlanId;
    billing_cycle: BillingCycle;
    success_url?: string;
    cancel_url?: string;
    trial_days?: number;
}

export interface CheckoutResult {
    session_id: string;
    url: string;
}

export interface PortalResult {
    url: string;
}

export interface WebhookEvent {
    type: string;
    data: {
        object: unknown;
    };
}

// ============================================
// CHECKOUT SESSION (placeholder)
// ============================================

/**
 * Create a Stripe Checkout session for subscription
 * 
 * TODO: Implement with actual Stripe SDK
 * ```ts
 * import Stripe from 'stripe';
 * const stripe = new Stripe(STRIPE_CONFIG.SECRET_KEY);
 * ```
 */
export async function createCheckoutSession(
    params: CreateCheckoutParams
): Promise<CheckoutResult> {
    const priceId = getStripePriceId(params.plan_id, params.billing_cycle);

    if (!priceId) {
        throw new Error(`No price ID configured for ${params.plan_id} ${params.billing_cycle}`);
    }

    // TODO: Implement actual Stripe checkout
    // const session = await stripe.checkout.sessions.create({
    //   mode: 'subscription',
    //   customer_email: params.user_email,
    //   line_items: [{ price: priceId, quantity: 1 }],
    //   success_url: params.success_url || STRIPE_CONFIG.SUCCESS_URL,
    //   cancel_url: params.cancel_url || STRIPE_CONFIG.CANCEL_URL,
    //   subscription_data: {
    //     trial_period_days: params.trial_days || STRIPE_CONFIG.TRIAL_DAYS,
    //     metadata: { user_id: params.user_id },
    //   },
    //   metadata: { user_id: params.user_id },
    // });

    console.log('[Stripe] Creating checkout session:', params);

    return {
        session_id: 'mock_session_' + Date.now(),
        url: '/billing/checkout?mock=true',
    };
}

/**
 * Create a Stripe Customer Portal session
 */
export async function createPortalSession(
    customerId: string,
    returnUrl?: string
): Promise<PortalResult> {
    // TODO: Implement actual Stripe portal
    // const session = await stripe.billingPortal.sessions.create({
    //   customer: customerId,
    //   return_url: returnUrl || '/',
    // });

    console.log('[Stripe] Creating portal session:', customerId);

    return {
        url: '/billing/portal?mock=true',
    };
}

// ============================================
// WEBHOOK HANDLERS (placeholders)
// ============================================

export type WebhookHandler = (event: WebhookEvent) => Promise<void>;

export const WEBHOOK_HANDLERS: Record<string, WebhookHandler> = {
    'checkout.session.completed': async (event) => {
        const session = event.data.object as {
            customer: string;
            subscription: string;
            metadata: { user_id: string };
        };

        console.log('[Stripe Webhook] Checkout completed:', session);

        // TODO: Update user subscription in database
        // await supabase.from('subscriptions').upsert({
        //   user_id: session.metadata.user_id,
        //   stripe_customer_id: session.customer,
        //   stripe_subscription_id: session.subscription,
        //   status: 'active',
        // });
    },

    'customer.subscription.updated': async (event) => {
        const subscription = event.data.object as {
            id: string;
            customer: string;
            status: string;
            current_period_start: number;
            current_period_end: number;
            cancel_at_period_end: boolean;
            items: { data: Array<{ price: { id: string } }> };
        };

        console.log('[Stripe Webhook] Subscription updated:', subscription);

        // TODO: Update subscription status in database
    },

    'customer.subscription.deleted': async (event) => {
        const subscription = event.data.object as {
            id: string;
            customer: string;
        };

        console.log('[Stripe Webhook] Subscription deleted:', subscription);

        // TODO: Mark subscription as canceled in database
    },

    'invoice.payment_failed': async (event) => {
        const invoice = event.data.object as {
            customer: string;
            subscription: string;
        };

        console.log('[Stripe Webhook] Payment failed:', invoice);

        // TODO: Handle payment failure (send email, update status)
    },

    'invoice.payment_succeeded': async (event) => {
        const invoice = event.data.object as {
            customer: string;
            subscription: string;
        };

        console.log('[Stripe Webhook] Payment succeeded:', invoice);

        // TODO: Update subscription status, send receipt
    },
};

/**
 * Process a Stripe webhook event
 */
export async function handleWebhook(event: WebhookEvent): Promise<void> {
    const handler = WEBHOOK_HANDLERS[event.type];

    if (handler) {
        await handler(event);
    } else {
        console.log('[Stripe Webhook] Unhandled event type:', event.type);
    }
}

/**
 * Verify webhook signature
 * 
 * TODO: Implement with actual Stripe SDK
 */
export function verifyWebhookSignature(
    payload: string,
    signature: string
): WebhookEvent {
    // TODO: Verify with Stripe
    // const event = stripe.webhooks.constructEvent(
    //   payload,
    //   signature,
    //   STRIPE_CONFIG.WEBHOOK_SECRET
    // );

    return JSON.parse(payload);
}

// ============================================
// SUBSCRIPTION SYNC
// ============================================

/**
 * Sync subscription from Stripe to local DB
 */
export async function syncSubscription(
    stripeSubscriptionId: string
): Promise<UserSubscription | null> {
    // TODO: Fetch from Stripe and update DB
    // const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    console.log('[Stripe] Syncing subscription:', stripeSubscriptionId);

    return null;
}

/**
 * Get subscription status from Stripe status
 */
export function mapStripeStatus(stripeStatus: string): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
        active: 'active',
        trialing: 'trialing',
        past_due: 'past_due',
        canceled: 'canceled',
        unpaid: 'unpaid',
        incomplete: 'incomplete',
        incomplete_expired: 'canceled',
    };

    return statusMap[stripeStatus] || 'canceled';
}

/**
 * Get plan ID from Stripe price ID
 */
export function getPlanIdFromPriceId(priceId: string): PlanId {
    for (const [key, value] of Object.entries(STRIPE_PRICE_IDS)) {
        if (value === priceId) {
            return key.split('_')[0] as PlanId;
        }
    }
    return 'free';
}

// ============================================
// SUBSCRIPTION ACTIONS
// ============================================

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(
    subscriptionId: string
): Promise<void> {
    // TODO: Cancel in Stripe
    // await stripe.subscriptions.update(subscriptionId, {
    //   cancel_at_period_end: true,
    // });

    console.log('[Stripe] Canceling subscription:', subscriptionId);
}

/**
 * Resume a canceled subscription
 */
export async function resumeSubscription(
    subscriptionId: string
): Promise<void> {
    // TODO: Resume in Stripe
    // await stripe.subscriptions.update(subscriptionId, {
    //   cancel_at_period_end: false,
    // });

    console.log('[Stripe] Resuming subscription:', subscriptionId);
}

/**
 * Change subscription plan
 */
export async function changePlan(
    subscriptionId: string,
    newPlanId: PlanId,
    newCycle: BillingCycle
): Promise<void> {
    const newPriceId = getStripePriceId(newPlanId, newCycle);

    if (!newPriceId) {
        throw new Error(`No price ID for ${newPlanId} ${newCycle}`);
    }

    // TODO: Update in Stripe
    // const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    // await stripe.subscriptions.update(subscriptionId, {
    //   items: [{
    //     id: subscription.items.data[0].id,
    //     price: newPriceId,
    //   }],
    //   proration_behavior: 'create_prorations',
    // });

    console.log('[Stripe] Changing plan:', { subscriptionId, newPlanId, newCycle });
}

// ============================================
// EXPORT
// ============================================

export {
    STRIPE_CONFIG,
    STRIPE_PRICE_IDS,
    createCheckoutSession,
    createPortalSession,
    handleWebhook,
    verifyWebhookSignature,
    syncSubscription,
    cancelSubscription,
    resumeSubscription,
    changePlan,
};
