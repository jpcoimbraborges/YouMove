/**
 * YOUMOVE - Subscription Plans
 * 
 * Defines plan tiers, features, and limits.
 * Ready for Stripe integration.
 */

// ============================================
// PLAN DEFINITIONS
// ============================================

export type PlanId = 'free' | 'pro' | 'elite';
export type BillingCycle = 'monthly' | 'yearly';

export interface Plan {
    id: PlanId;
    name: string;
    description: string;
    tagline: string;

    // Pricing
    price_monthly_brl: number;
    price_yearly_brl: number;

    // Stripe IDs (to be configured)
    stripe_price_id_monthly?: string;
    stripe_price_id_yearly?: string;

    // Features
    features: PlanFeatures;

    // UI
    highlighted: boolean;
    badge?: string;
    color: string;
}

export interface PlanFeatures {
    // Workout generation
    ai_workouts_per_month: number;
    manual_workouts: boolean;
    custom_workouts: boolean;

    // AI Features
    ai_coach_messages_per_day: number;
    ai_log_analysis: boolean;
    ai_weekly_reports: boolean;
    ai_suggestions: boolean;

    // Tracking
    workout_history_days: number;
    progress_charts: boolean;
    advanced_analytics: boolean;
    export_data: boolean;

    // Social
    share_workouts: boolean;
    leaderboards: boolean;

    // Support
    priority_support: boolean;

    // Extras
    offline_mode: boolean;
    custom_exercises: boolean;
    rest_timer_customization: boolean;
    dark_mode: boolean;
    remove_ads: boolean;
}

// ============================================
// PLAN CONFIGURATIONS
// ============================================

export const PLANS: Record<PlanId, Plan> = {
    free: {
        id: 'free',
        name: 'Free',
        description: 'Comece sua jornada fitness',
        tagline: 'Grátis para sempre',

        price_monthly_brl: 0,
        price_yearly_brl: 0,

        features: {
            // Workout generation
            ai_workouts_per_month: 2,
            manual_workouts: true,
            custom_workouts: false,

            // AI Features
            ai_coach_messages_per_day: 3,
            ai_log_analysis: false,
            ai_weekly_reports: false,
            ai_suggestions: false,

            // Tracking
            workout_history_days: 30,
            progress_charts: true,
            advanced_analytics: false,
            export_data: false,

            // Social
            share_workouts: false,
            leaderboards: true,

            // Support
            priority_support: false,

            // Extras
            offline_mode: true,
            custom_exercises: false,
            rest_timer_customization: false,
            dark_mode: true,
            remove_ads: false,
        },

        highlighted: false,
        color: '#64748b', // slate
    },

    pro: {
        id: 'pro',
        name: 'Pro',
        description: 'Para quem leva treino a sério',
        tagline: 'Mais popular',

        price_monthly_brl: 29.90,
        price_yearly_brl: 239.90, // ~2 months free

        features: {
            // Workout generation
            ai_workouts_per_month: 30,
            manual_workouts: true,
            custom_workouts: true,

            // AI Features
            ai_coach_messages_per_day: 50,
            ai_log_analysis: true,
            ai_weekly_reports: true,
            ai_suggestions: true,

            // Tracking
            workout_history_days: 365,
            progress_charts: true,
            advanced_analytics: true,
            export_data: true,

            // Social
            share_workouts: true,
            leaderboards: true,

            // Support
            priority_support: false,

            // Extras
            offline_mode: true,
            custom_exercises: true,
            rest_timer_customization: true,
            dark_mode: true,
            remove_ads: true,
        },

        highlighted: true,
        badge: 'Mais Popular',
        color: '#3b82f6', // blue
    },

    elite: {
        id: 'elite',
        name: 'Elite',
        description: 'Máximo desempenho, sem limites',
        tagline: 'Para atletas',

        price_monthly_brl: 59.90,
        price_yearly_brl: 479.90, // ~2 months free

        features: {
            // Workout generation
            ai_workouts_per_month: -1, // Unlimited
            manual_workouts: true,
            custom_workouts: true,

            // AI Features
            ai_coach_messages_per_day: -1, // Unlimited
            ai_log_analysis: true,
            ai_weekly_reports: true,
            ai_suggestions: true,

            // Tracking
            workout_history_days: -1, // Unlimited
            progress_charts: true,
            advanced_analytics: true,
            export_data: true,

            // Social
            share_workouts: true,
            leaderboards: true,

            // Support
            priority_support: true,

            // Extras
            offline_mode: true,
            custom_exercises: true,
            rest_timer_customization: true,
            dark_mode: true,
            remove_ads: true,
        },

        highlighted: false,
        badge: 'Sem Limites',
        color: '#8b5cf6', // purple
    },
};

// ============================================
// FEATURE FLAGS
// ============================================

export type FeatureFlag = keyof PlanFeatures;

export const FEATURE_DESCRIPTIONS: Record<FeatureFlag, {
    name: string;
    description: string;
    icon: string;
}> = {
    ai_workouts_per_month: {
        name: 'Treinos com IA',
        description: 'Geração de treinos personalizados por inteligência artificial',
        icon: '🤖',
    },
    manual_workouts: {
        name: 'Treinos Manuais',
        description: 'Crie e execute treinos manualmente',
        icon: '📝',
    },
    custom_workouts: {
        name: 'Treinos Customizados',
        description: 'Salve e reutilize seus próprios treinos',
        icon: '⭐',
    },
    ai_coach_messages_per_day: {
        name: 'Coach Virtual',
        description: 'Converse com o coach de IA para dicas e orientações',
        icon: '💬',
    },
    ai_log_analysis: {
        name: 'Análise de Logs',
        description: 'Análise inteligente do seu histórico de treinos',
        icon: '📊',
    },
    ai_weekly_reports: {
        name: 'Relatórios Semanais',
        description: 'Relatório personalizado toda semana',
        icon: '📈',
    },
    ai_suggestions: {
        name: 'Sugestões Inteligentes',
        description: 'Recomendações baseadas no seu progresso',
        icon: '💡',
    },
    workout_history_days: {
        name: 'Histórico de Treinos',
        description: 'Acesso ao seu histórico de treinos',
        icon: '📅',
    },
    progress_charts: {
        name: 'Gráficos de Progresso',
        description: 'Visualize sua evolução em gráficos',
        icon: '📉',
    },
    advanced_analytics: {
        name: 'Analytics Avançado',
        description: 'Métricas detalhadas e insights profundos',
        icon: '🔬',
    },
    export_data: {
        name: 'Exportar Dados',
        description: 'Exporte seus dados em CSV ou JSON',
        icon: '📤',
    },
    share_workouts: {
        name: 'Compartilhar Treinos',
        description: 'Compartilhe treinos com amigos',
        icon: '🔗',
    },
    leaderboards: {
        name: 'Ranking',
        description: 'Compare seu progresso com outros usuários',
        icon: '🏆',
    },
    priority_support: {
        name: 'Suporte Prioritário',
        description: 'Atendimento prioritário via chat',
        icon: '⚡',
    },
    offline_mode: {
        name: 'Modo Offline',
        description: 'Use o app sem conexão com internet',
        icon: '📴',
    },
    custom_exercises: {
        name: 'Exercícios Customizados',
        description: 'Adicione seus próprios exercícios',
        icon: '➕',
    },
    rest_timer_customization: {
        name: 'Timer Personalizável',
        description: 'Configure tempos de descanso personalizados',
        icon: '⏱️',
    },
    dark_mode: {
        name: 'Modo Escuro',
        description: 'Interface em modo escuro',
        icon: '🌙',
    },
    remove_ads: {
        name: 'Sem Anúncios',
        description: 'Experiência livre de anúncios',
        icon: '🚫',
    },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getPlan(planId: PlanId): Plan {
    return PLANS[planId];
}

export function getPlanPrice(planId: PlanId, cycle: BillingCycle): number {
    const plan = PLANS[planId];
    return cycle === 'monthly' ? plan.price_monthly_brl : plan.price_yearly_brl;
}

export function getMonthlyEquivalent(planId: PlanId, cycle: BillingCycle): number {
    const plan = PLANS[planId];
    if (cycle === 'monthly') return plan.price_monthly_brl;
    return Math.round((plan.price_yearly_brl / 12) * 100) / 100;
}

export function getYearlySavings(planId: PlanId): number {
    const plan = PLANS[planId];
    const monthlyTotal = plan.price_monthly_brl * 12;
    return Math.round((monthlyTotal - plan.price_yearly_brl) * 100) / 100;
}

export function getYearlySavingsPercent(planId: PlanId): number {
    const plan = PLANS[planId];
    if (plan.price_monthly_brl === 0) return 0;
    const monthlyTotal = plan.price_monthly_brl * 12;
    return Math.round(((monthlyTotal - plan.price_yearly_brl) / monthlyTotal) * 100);
}

export function compareFeatures(
    feature: FeatureFlag,
    plan1: PlanId,
    plan2: PlanId
): number {
    const val1 = PLANS[plan1].features[feature];
    const val2 = PLANS[plan2].features[feature];

    if (typeof val1 === 'boolean' && typeof val2 === 'boolean') {
        return (val1 ? 1 : 0) - (val2 ? 1 : 0);
    }

    if (typeof val1 === 'number' && typeof val2 === 'number') {
        // -1 means unlimited
        if (val1 === -1) return 1;
        if (val2 === -1) return -1;
        return val1 - val2;
    }

    return 0;
}

export function getFeatureDifferences(
    fromPlan: PlanId,
    toPlan: PlanId
): Array<{
    feature: FeatureFlag;
    name: string;
    icon: string;
    fromValue: string;
    toValue: string;
}> {
    const differences: Array<{
        feature: FeatureFlag;
        name: string;
        icon: string;
        fromValue: string;
        toValue: string;
    }> = [];

    const from = PLANS[fromPlan].features;
    const to = PLANS[toPlan].features;

    (Object.keys(from) as FeatureFlag[]).forEach(feature => {
        const fromVal = from[feature];
        const toVal = to[feature];

        if (fromVal !== toVal) {
            const desc = FEATURE_DESCRIPTIONS[feature];
            differences.push({
                feature,
                name: desc.name,
                icon: desc.icon,
                fromValue: formatFeatureValue(fromVal),
                toValue: formatFeatureValue(toVal),
            });
        }
    });

    return differences;
}

function formatFeatureValue(value: boolean | number): string {
    if (typeof value === 'boolean') {
        return value ? '✓' : '✗';
    }
    if (value === -1) return 'Ilimitado';
    return String(value);
}

// ============================================
// EXPORT
// ============================================

export { PLANS, FEATURE_DESCRIPTIONS };
