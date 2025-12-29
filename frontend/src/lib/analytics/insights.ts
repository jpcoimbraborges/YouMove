/**
 * YOUMOVE - Actionable Insights
 * 
 * Generates personalized, actionable insights based on workout data.
 * All insights are deterministic (no AI required).
 */

import {
    type WorkoutLog,
    type ProgressionData,
    calculateFrequency,
    getVolumeByMuscle,
    getMuscleFrequency,
    calculateConsistency,
    getAllProgressions,
    getWeeklyStats,
} from './calculations';

// ============================================
// TYPES
// ============================================

export interface Insight {
    id: string;
    type: InsightType;
    priority: 'high' | 'medium' | 'low';
    icon: string;
    title: string;
    description: string;
    action?: {
        label: string;
        route: string;
    };
    metric?: {
        value: string | number;
        label: string;
        trend?: 'up' | 'down' | 'stable';
    };
}

export type InsightType =
    | 'strength_gain'
    | 'volume_optimization'
    | 'frequency_suggestion'
    | 'muscle_focus'
    | 'recovery_tip'
    | 'plateau_breaker'
    | 'consistency_boost'
    | 'form_reminder'
    | 'deload_suggestion'
    | 'personal_record'
    | 'weekly_summary';

// ============================================
// MAIN INSIGHT GENERATOR
// ============================================

export function generateInsights(
    logs: WorkoutLog[],
    userSettings?: {
        expectedPerWeek?: number;
        goal?: 'strength' | 'hypertrophy' | 'endurance' | 'general_fitness';
        fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
    }
): Insight[] {
    const insights: Insight[] = [];
    const goal = userSettings?.goal || 'hypertrophy';
    const level = userSettings?.fitnessLevel || 'intermediate';

    if (logs.length === 0) {
        return [getStartingInsight()];
    }

    // Get analysis data
    const progressions = getAllProgressions(logs, 8);
    const weeklyStats = getWeeklyStats(logs);
    const consistency = calculateConsistency(logs, userSettings?.expectedPerWeek || 4, 4);
    const muscleVolume = getVolumeByMuscle(logs, 14);
    const muscleFreq = getMuscleFrequency(logs, 4);

    // === PROGRESSION INSIGHTS ===
    insights.push(...getProgressionInsights(progressions, goal));

    // === VOLUME INSIGHTS ===
    insights.push(...getVolumeInsights(weeklyStats, goal, level));

    // === CONSISTENCY INSIGHTS ===
    insights.push(...getConsistencyInsights(consistency));

    // === MUSCLE BALANCE INSIGHTS ===
    insights.push(...getMuscleInsights(muscleVolume, muscleFreq, goal));

    // === RECOVERY INSIGHTS ===
    insights.push(...getRecoveryInsights(logs, weeklyStats));

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return insights.slice(0, 5); // Return top 5
}

// ============================================
// STARTING INSIGHT
// ============================================

function getStartingInsight(): Insight {
    return {
        id: 'start_1',
        type: 'consistency_boost',
        priority: 'high',
        icon: '🚀',
        title: 'Vamos começar!',
        description: 'Complete seu primeiro treino para começar a receber insights personalizados.',
        action: {
            label: 'Iniciar treino',
            route: '/workout',
        },
    };
}

// ============================================
// PROGRESSION INSIGHTS
// ============================================

function getProgressionInsights(
    progressions: ProgressionData[],
    goal: string
): Insight[] {
    const insights: Insight[] = [];

    // Find exercises with best progression
    const improving = progressions.filter(p => p.trend === 'increasing');
    const plateaued = progressions.filter(p => p.trend === 'stable' && p.change_percent < 2);
    const declining = progressions.filter(p => p.trend === 'decreasing');

    if (improving.length > 0) {
        const best = improving[0];
        insights.push({
            id: `strength_${best.exercise_id}`,
            type: 'strength_gain',
            priority: 'low',
            icon: '💪',
            title: `${best.exercise_name} em ascensão!`,
            description: `Sua carga aumentou ${best.change_percent}% nas últimas semanas. Continue assim!`,
            metric: {
                value: `+${best.change_percent}%`,
                label: 'Progressão',
                trend: 'up',
            },
        });
    }

    if (plateaued.length > 0) {
        const exercise = plateaued[0];

        let suggestion = '';
        if (goal === 'strength') {
            suggestion = 'Tente reduzir as reps e aumentar a carga.';
        } else if (goal === 'hypertrophy') {
            suggestion = 'Experimente aumentar o número de séries ou usar técnicas de intensidade.';
        } else {
            suggestion = 'Varie o exercício ou ajuste o volume.';
        }

        insights.push({
            id: `plateau_${exercise.exercise_id}`,
            type: 'plateau_breaker',
            priority: 'medium',
            icon: '📊',
            title: `Platô em ${exercise.exercise_name}?`,
            description: `Sua carga está estável há algumas semanas. ${suggestion}`,
            action: {
                label: 'Ver progressão',
                route: '/progress',
            },
        });
    }

    if (declining.length > 0 && declining.length < progressions.length / 2) {
        const exercise = declining[0];
        insights.push({
            id: `decline_${exercise.exercise_id}`,
            type: 'recovery_tip',
            priority: 'medium',
            icon: '🔄',
            title: `Atenção com ${exercise.exercise_name}`,
            description: `Sua carga diminuiu ${Math.abs(exercise.change_percent)}%. Pode ser fadiga acumulada ou necessidade de deload.`,
        });
    }

    // 1RM estimate for strength-focused users
    if (goal === 'strength' && improving.length > 0) {
        const best = improving.find(p => p.estimated_1rm !== null);
        if (best && best.estimated_1rm) {
            insights.push({
                id: `1rm_${best.exercise_id}`,
                type: 'personal_record',
                priority: 'low',
                icon: '🎯',
                title: `1RM estimado: ${best.exercise_name}`,
                description: `Baseado no seu desempenho recente, seu 1RM estimado é ${best.estimated_1rm}kg.`,
                metric: {
                    value: `${best.estimated_1rm}kg`,
                    label: '1RM Estimado',
                },
            });
        }
    }

    return insights;
}

// ============================================
// VOLUME INSIGHTS
// ============================================

function getVolumeInsights(
    weeklyStats: ReturnType<typeof getWeeklyStats>,
    goal: string,
    level: string
): Insight[] {
    const insights: Insight[] = [];

    // Volume recommendations by goal and level
    const volumeTargets: Record<string, Record<string, { min: number; max: number }>> = {
        hypertrophy: {
            beginner: { min: 5000, max: 15000 },
            intermediate: { min: 15000, max: 35000 },
            advanced: { min: 30000, max: 60000 },
        },
        strength: {
            beginner: { min: 4000, max: 12000 },
            intermediate: { min: 12000, max: 30000 },
            advanced: { min: 25000, max: 50000 },
        },
        endurance: {
            beginner: { min: 8000, max: 20000 },
            intermediate: { min: 20000, max: 45000 },
            advanced: { min: 40000, max: 80000 },
        },
        general_fitness: {
            beginner: { min: 5000, max: 15000 },
            intermediate: { min: 12000, max: 30000 },
            advanced: { min: 25000, max: 50000 },
        },
    };

    const target = volumeTargets[goal]?.[level] || volumeTargets.hypertrophy.intermediate;
    const currentVolume = weeklyStats.total_volume_kg;

    if (currentVolume < target.min) {
        insights.push({
            id: 'volume_low',
            type: 'volume_optimization',
            priority: 'high',
            icon: '📈',
            title: 'Volume abaixo do ideal',
            description: `Seu volume semanal (${currentVolume.toLocaleString()}kg) está abaixo do recomendado para ${goal}. Tente adicionar mais séries ou aumentar a carga.`,
            metric: {
                value: `${currentVolume.toLocaleString()}kg`,
                label: `Meta: ${target.min.toLocaleString()}kg+`,
                trend: 'down',
            },
            action: {
                label: 'Ajustar treino',
                route: '/workout',
            },
        });
    } else if (currentVolume > target.max) {
        insights.push({
            id: 'volume_high',
            type: 'recovery_tip',
            priority: 'medium',
            icon: '⚠️',
            title: 'Volume muito alto',
            description: `Seu volume semanal (${currentVolume.toLocaleString()}kg) está acima do ideal. Isso pode impactar a recuperação.`,
            metric: {
                value: `${currentVolume.toLocaleString()}kg`,
                label: `Ideal: até ${target.max.toLocaleString()}kg`,
                trend: 'up',
            },
        });
    } else {
        insights.push({
            id: 'volume_good',
            type: 'weekly_summary',
            priority: 'low',
            icon: '✅',
            title: 'Volume no alvo!',
            description: `Seu volume semanal (${currentVolume.toLocaleString()}kg) está na faixa ideal para seu objetivo.`,
            metric: {
                value: `${currentVolume.toLocaleString()}kg`,
                label: 'Volume semanal',
                trend: 'stable',
            },
        });
    }

    return insights;
}

// ============================================
// CONSISTENCY INSIGHTS
// ============================================

function getConsistencyInsights(consistency: ReturnType<typeof calculateConsistency>): Insight[] {
    const insights: Insight[] = [];

    if (consistency.current_streak >= 7) {
        insights.push({
            id: 'streak_active',
            type: 'consistency_boost',
            priority: 'low',
            icon: '🔥',
            title: `${consistency.current_streak} dias de streak!`,
            description: 'Sua consistência está excelente. Continue assim!',
            metric: {
                value: consistency.current_streak,
                label: 'Dias seguidos',
                trend: 'up',
            },
        });
    }

    if (consistency.consistency_percent < 60) {
        const missedCount = consistency.missed_days.length;

        insights.push({
            id: 'consistency_low',
            type: 'consistency_boost',
            priority: 'high',
            icon: '📅',
            title: 'Consistência precisa de foco',
            description: `Você completou ${consistency.consistency_percent}% dos treinos planejados. Tente definir horários fixos para treinar.`,
            action: {
                label: 'Ver calendário',
                route: '/history',
            },
            metric: {
                value: `${consistency.consistency_percent}%`,
                label: 'Consistência',
                trend: 'down',
            },
        });
    }

    if (consistency.trend === 'improving') {
        insights.push({
            id: 'consistency_improving',
            type: 'consistency_boost',
            priority: 'low',
            icon: '📈',
            title: 'Frequência melhorando!',
            description: 'Você está treinando mais frequentemente do que antes. Ótimo trabalho!',
        });
    }

    return insights;
}

// ============================================
// MUSCLE INSIGHTS
// ============================================

function getMuscleInsights(
    volumeByMuscle: Record<string, number>,
    frequencyByMuscle: Record<string, number>,
    goal: string
): Insight[] {
    const insights: Insight[] = [];

    // Find strongest and weakest muscles
    const muscles = Object.entries(volumeByMuscle).sort((a, b) => b[1] - a[1]);

    if (muscles.length < 2) return insights;

    const strongest = muscles[0];
    const weakest = muscles[muscles.length - 1];

    const muscleNames: Record<string, string> = {
        chest: 'Peito',
        back: 'Costas',
        shoulders: 'Ombros',
        biceps: 'Bíceps',
        triceps: 'Tríceps',
        quadriceps: 'Quadríceps',
        hamstrings: 'Posterior',
        glutes: 'Glúteos',
        calves: 'Panturrilha',
        core: 'Core',
    };

    // Muscle focus suggestion
    const ratio = strongest[1] / (weakest[1] || 1);

    if (ratio > 3 && weakest[1] > 0) {
        insights.push({
            id: 'muscle_focus',
            type: 'muscle_focus',
            priority: 'medium',
            icon: '🎯',
            title: `Foco sugerido: ${muscleNames[weakest[0]] || weakest[0]}`,
            description: `Seu ${muscleNames[weakest[0]] || weakest[0]} tem recebido menos volume comparado a ${muscleNames[strongest[0]] || strongest[0]}. Equilibre para evitar desequilíbrios.`,
            action: {
                label: 'Gerar treino focado',
                route: `/workout?focus=${weakest[0]}`,
            },
        });
    }

    // Check for leg day skip
    const legVolume = (volumeByMuscle['quadriceps'] || 0) + (volumeByMuscle['hamstrings'] || 0) + (volumeByMuscle['glutes'] || 0);
    const upperVolume = (volumeByMuscle['chest'] || 0) + (volumeByMuscle['back'] || 0) + (volumeByMuscle['shoulders'] || 0);

    if (upperVolume > 0 && legVolume < upperVolume * 0.3) {
        insights.push({
            id: 'leg_day',
            type: 'muscle_focus',
            priority: 'medium',
            icon: '🦵',
            title: 'Não pule o leg day!',
            description: 'Seu volume de pernas está bem abaixo do superior. Treinar pernas melhora hormônios anabólicos e equilíbrio.',
            action: {
                label: 'Treino de pernas',
                route: '/workout?muscles=quadriceps,hamstrings,glutes',
            },
        });
    }

    return insights;
}

// ============================================
// RECOVERY INSIGHTS
// ============================================

function getRecoveryInsights(
    logs: WorkoutLog[],
    weeklyStats: ReturnType<typeof getWeeklyStats>
): Insight[] {
    const insights: Insight[] = [];

    // Average RPE check
    if (weeklyStats.average_rpe !== null && weeklyStats.average_rpe >= 8.5) {
        insights.push({
            id: 'deload_suggestion',
            type: 'deload_suggestion',
            priority: 'high',
            icon: '😮‍💨',
            title: 'Considere um deload',
            description: `Seu RPE médio está em ${weeklyStats.average_rpe}. Uma semana de deload (50% do volume) pode ajudar na recuperação.`,
            action: {
                label: 'O que é deload?',
                route: '/help/deload',
            },
        });
    }

    // Rest days check
    if (weeklyStats.rest_days < 2) {
        insights.push({
            id: 'more_rest',
            type: 'recovery_tip',
            priority: 'medium',
            icon: '🛌',
            title: 'Mais dias de descanso',
            description: 'Você teve apenas 1 dia de descanso esta semana. O corpo precisa de tempo para se recuperar e crescer.',
        });
    }

    // Duration check
    if (weeklyStats.total_duration_minutes > weeklyStats.workouts_completed * 90) {
        insights.push({
            id: 'session_length',
            type: 'recovery_tip',
            priority: 'low',
            icon: '⏱️',
            title: 'Treinos muito longos?',
            description: 'Seus treinos estão durando mais de 90 minutos em média. Treinos mais curtos e intensos podem ser mais eficientes.',
        });
    }

    return insights;
}

// Note: generateInsights is already exported inline (export function ...)
