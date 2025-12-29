/**
 * YOUMOVE - Alerts System
 * 
 * Generates smart alerts based on workout data.
 * All alerts are deterministic (no AI).
 */

import {
    type WorkoutLog,
    type ConsistencyData,
    type ProgressionData,
    calculateFrequency,
    getVolumeByMuscle,
    getMuscleFrequency,
    calculateConsistency,
    getWeeklyVolumeTrend,
} from './calculations';

// ============================================
// TYPES
// ============================================

export interface Alert {
    id: string;
    type: AlertType;
    severity: 'info' | 'warning' | 'success' | 'error';
    category: AlertCategory;
    title: string;
    message: string;
    action?: {
        label: string;
        route: string;
    };
    created_at: string;
    dismissed: boolean;
    data?: Record<string, unknown>;
}

export type AlertType =
    | 'volume_spike'
    | 'volume_drop'
    | 'frequency_low'
    | 'frequency_high'
    | 'consistency_drop'
    | 'streak_milestone'
    | 'muscle_imbalance'
    | 'overtraining_risk'
    | 'recovery_needed'
    | 'plateau_detected'
    | 'pr_achieved'
    | 'goal_progress';

export type AlertCategory =
    | 'training'
    | 'recovery'
    | 'progress'
    | 'achievement'
    | 'warning';

// ============================================
// THRESHOLDS (configurable)
// ============================================

const THRESHOLDS = {
    // Volume
    VOLUME_SPIKE_PERCENT: 20,      // Alert if +20% in a week
    VOLUME_DROP_PERCENT: -25,      // Alert if -25% in a week

    // Frequency
    MIN_WEEKLY_FREQUENCY: 2,       // Alert if less than 2x/week
    MAX_WEEKLY_FREQUENCY: 6,       // Alert if more than 6x/week

    // Consistency
    CONSISTENCY_GOOD: 75,          // Green if above
    CONSISTENCY_WARNING: 50,       // Warning if below

    // Muscle balance
    MUSCLE_IMBALANCE_RATIO: 3,     // Alert if one muscle 3x another
    MIN_MUSCLE_FREQUENCY: 1,       // Each muscle at least 1x/week

    // Recovery
    MAX_CONSECUTIVE_DAYS: 5,       // Alert if more than 5 consecutive
    HIGH_RPE_THRESHOLD: 9,         // Alert if avg RPE > 9

    // Progression
    PLATEAU_WEEKS: 4,              // Consider plateau after 4 weeks no progress

    // Streaks
    STREAK_MILESTONES: [7, 14, 21, 30, 60, 90, 180, 365],
};

// ============================================
// MAIN ALERT GENERATOR
// ============================================

export function generateAlerts(
    logs: WorkoutLog[],
    userSettings?: {
        expectedPerWeek?: number;
        fitnessLevel?: string;
    }
): Alert[] {
    const alerts: Alert[] = [];
    const expectedPerWeek = userSettings?.expectedPerWeek || 4;

    // Get analysis data
    const volumeTrend = getWeeklyVolumeTrend(logs, 4);
    const consistency = calculateConsistency(logs, expectedPerWeek, 4);
    const frequency = calculateFrequency(logs, 4);
    const muscleFrequency = getMuscleFrequency(logs, 4);
    const volumeByMuscle = getVolumeByMuscle(logs, 14);

    // === VOLUME ALERTS ===
    alerts.push(...checkVolumeAlerts(volumeTrend));

    // === FREQUENCY ALERTS ===
    alerts.push(...checkFrequencyAlerts(frequency, expectedPerWeek));

    // === CONSISTENCY ALERTS ===
    alerts.push(...checkConsistencyAlerts(consistency));

    // === MUSCLE BALANCE ALERTS ===
    alerts.push(...checkMuscleBalanceAlerts(muscleFrequency, volumeByMuscle));

    // === RECOVERY ALERTS ===
    alerts.push(...checkRecoveryAlerts(logs));

    // === STREAK ALERTS ===
    alerts.push(...checkStreakAlerts(consistency));

    return alerts;
}

// ============================================
// VOLUME CHECKS
// ============================================

function checkVolumeAlerts(
    trend: ReturnType<typeof getWeeklyVolumeTrend>
): Alert[] {
    const alerts: Alert[] = [];

    if (trend.length < 2) return alerts;

    const current = trend[trend.length - 1];
    const previous = trend[trend.length - 2];

    if (current.change_percent > THRESHOLDS.VOLUME_SPIKE_PERCENT) {
        alerts.push({
            id: `volume_spike_${Date.now()}`,
            type: 'volume_spike',
            severity: 'warning',
            category: 'warning',
            title: '📈 Aumento significativo de volume',
            message: `Seu volume aumentou ${current.change_percent}% esta semana. Aumentos acima de 10-15% podem aumentar risco de lesão.`,
            action: {
                label: 'Ver detalhes',
                route: '/progress',
            },
            created_at: new Date().toISOString(),
            dismissed: false,
            data: { change_percent: current.change_percent },
        });
    }

    if (current.change_percent < THRESHOLDS.VOLUME_DROP_PERCENT && current.volume > 0) {
        alerts.push({
            id: `volume_drop_${Date.now()}`,
            type: 'volume_drop',
            severity: 'info',
            category: 'training',
            title: '📉 Queda de volume',
            message: `Seu volume caiu ${Math.abs(current.change_percent)}% esta semana. Tudo bem se foi planejado (deload).`,
            created_at: new Date().toISOString(),
            dismissed: false,
            data: { change_percent: current.change_percent },
        });
    }

    return alerts;
}

// ============================================
// FREQUENCY CHECKS
// ============================================

function checkFrequencyAlerts(frequency: number, expected: number): Alert[] {
    const alerts: Alert[] = [];

    if (frequency < THRESHOLDS.MIN_WEEKLY_FREQUENCY) {
        alerts.push({
            id: `frequency_low_${Date.now()}`,
            type: 'frequency_low',
            severity: 'warning',
            category: 'training',
            title: '⚠️ Frequência baixa',
            message: `Você está treinando ${frequency}x por semana. Tente aumentar para pelo menos ${THRESHOLDS.MIN_WEEKLY_FREQUENCY}x para manter progresso.`,
            action: {
                label: 'Ajustar plano',
                route: '/workout',
            },
            created_at: new Date().toISOString(),
            dismissed: false,
            data: { frequency, expected },
        });
    }

    if (frequency > THRESHOLDS.MAX_WEEKLY_FREQUENCY) {
        alerts.push({
            id: `frequency_high_${Date.now()}`,
            type: 'frequency_high',
            severity: 'warning',
            category: 'recovery',
            title: '😮‍💨 Frequência muito alta',
            message: `Você está treinando ${frequency}x por semana. Considere adicionar mais dias de descanso.`,
            action: {
                label: 'Ver recuperação',
                route: '/progress',
            },
            created_at: new Date().toISOString(),
            dismissed: false,
            data: { frequency },
        });
    }

    return alerts;
}

// ============================================
// CONSISTENCY CHECKS
// ============================================

function checkConsistencyAlerts(consistency: ConsistencyData): Alert[] {
    const alerts: Alert[] = [];

    if (consistency.consistency_percent < THRESHOLDS.CONSISTENCY_WARNING) {
        alerts.push({
            id: `consistency_drop_${Date.now()}`,
            type: 'consistency_drop',
            severity: 'warning',
            category: 'training',
            title: '📊 Consistência precisa de atenção',
            message: `Sua consistência está em ${consistency.consistency_percent}%. Tente manter acima de ${THRESHOLDS.CONSISTENCY_GOOD}% para melhores resultados.`,
            action: {
                label: 'Ver calendário',
                route: '/history',
            },
            created_at: new Date().toISOString(),
            dismissed: false,
            data: { consistency_percent: consistency.consistency_percent },
        });
    }

    if (consistency.trend === 'declining') {
        alerts.push({
            id: `consistency_declining_${Date.now()}`,
            type: 'consistency_drop',
            severity: 'info',
            category: 'training',
            title: '📉 Frequência diminuindo',
            message: 'Você está treinando menos do que nas semanas anteriores. Está tudo bem?',
            created_at: new Date().toISOString(),
            dismissed: false,
        });
    }

    return alerts;
}

// ============================================
// MUSCLE BALANCE CHECKS
// ============================================

function checkMuscleBalanceAlerts(
    frequency: Record<string, number>,
    volume: Record<string, number>
): Alert[] {
    const alerts: Alert[] = [];

    // Check for undertrained muscles
    const mainMuscles = ['chest', 'back', 'shoulders', 'quadriceps', 'hamstrings'];
    const undertrainedMuscles: string[] = [];

    mainMuscles.forEach(muscle => {
        if ((frequency[muscle] || 0) < THRESHOLDS.MIN_MUSCLE_FREQUENCY) {
            undertrainedMuscles.push(muscle);
        }
    });

    if (undertrainedMuscles.length > 0) {
        const muscleNames: Record<string, string> = {
            chest: 'Peito',
            back: 'Costas',
            shoulders: 'Ombros',
            quadriceps: 'Quadríceps',
            hamstrings: 'Posterior',
        };

        const names = undertrainedMuscles.map(m => muscleNames[m] || m).join(', ');

        alerts.push({
            id: `muscle_imbalance_${Date.now()}`,
            type: 'muscle_imbalance',
            severity: 'info',
            category: 'training',
            title: '💪 Músculos precisando de atenção',
            message: `${names} não foram treinados recentemente. Tente incluí-los no próximo treino.`,
            action: {
                label: 'Gerar treino',
                route: '/workout?mode=ai',
            },
            created_at: new Date().toISOString(),
            dismissed: false,
            data: { muscles: undertrainedMuscles },
        });
    }

    // Check for push/pull imbalance
    const pushVolume = (volume['chest'] || 0) + (volume['shoulders'] || 0) + (volume['triceps'] || 0);
    const pullVolume = (volume['back'] || 0) + (volume['biceps'] || 0);

    if (pushVolume > 0 && pullVolume > 0) {
        const ratio = pushVolume / pullVolume;

        if (ratio > 1.5) {
            alerts.push({
                id: `push_pull_imbalance_${Date.now()}`,
                type: 'muscle_imbalance',
                severity: 'info',
                category: 'training',
                title: '⚖️ Desequilíbrio Push/Pull',
                message: 'Você está treinando mais push (empurrar) do que pull (puxar). Isso pode causar desequilíbrios posturais.',
                created_at: new Date().toISOString(),
                dismissed: false,
                data: { push_volume: pushVolume, pull_volume: pullVolume, ratio },
            });
        }
    }

    return alerts;
}

// ============================================
// RECOVERY CHECKS
// ============================================

function checkRecoveryAlerts(logs: WorkoutLog[]): Alert[] {
    const alerts: Alert[] = [];

    // Check for high consecutive training days
    const sortedLogs = logs
        .filter(l => l.completed)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (sortedLogs.length >= 2) {
        let consecutiveDays = 1;

        for (let i = 1; i < sortedLogs.length; i++) {
            const current = new Date(sortedLogs[i - 1].date);
            const previous = new Date(sortedLogs[i].date);
            const diffDays = Math.floor((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                consecutiveDays++;
            } else {
                break;
            }
        }

        if (consecutiveDays >= THRESHOLDS.MAX_CONSECUTIVE_DAYS) {
            alerts.push({
                id: `recovery_needed_${Date.now()}`,
                type: 'recovery_needed',
                severity: 'warning',
                category: 'recovery',
                title: '🛌 Dia de descanso recomendado',
                message: `Você treinou ${consecutiveDays} dias seguidos. Considere um dia de descanso para recuperação.`,
                created_at: new Date().toISOString(),
                dismissed: false,
                data: { consecutive_days: consecutiveDays },
            });
        }
    }

    // Check for high average RPE
    const recentLogs = sortedLogs.slice(0, 5);
    const rpeValues = recentLogs
        .filter(l => l.average_rpe !== null)
        .map(l => l.average_rpe!);

    if (rpeValues.length >= 3) {
        const avgRPE = rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length;

        if (avgRPE >= THRESHOLDS.HIGH_RPE_THRESHOLD) {
            alerts.push({
                id: `overtraining_risk_${Date.now()}`,
                type: 'overtraining_risk',
                severity: 'warning',
                category: 'recovery',
                title: '⚠️ Intensidade muito alta',
                message: `Seu RPE médio está em ${avgRPE.toFixed(1)}. Considere reduzir a intensidade ou fazer um deload.`,
                created_at: new Date().toISOString(),
                dismissed: false,
                data: { avg_rpe: avgRPE },
            });
        }
    }

    return alerts;
}

// ============================================
// STREAK CHECKS
// ============================================

function checkStreakAlerts(consistency: ConsistencyData): Alert[] {
    const alerts: Alert[] = [];

    // Check for milestone streaks
    const milestone = THRESHOLDS.STREAK_MILESTONES.find(m => m === consistency.current_streak);

    if (milestone) {
        const messages: Record<number, string> = {
            7: '🔥 1 semana de streak! Continue assim!',
            14: '🔥🔥 2 semanas! Você está pegando o ritmo!',
            21: '🔥🔥🔥 3 semanas! Um novo hábito está nascendo!',
            30: '🏆 1 MÊS! Incrível consistência!',
            60: '🏆🏆 2 MESES! Você é imparável!',
            90: '🏆🏆🏆 3 MESES! Lenda!',
            180: '👑 6 MESES! Dedicação absoluta!',
            365: '🎉 1 ANO! Você é uma inspiração!',
        };

        alerts.push({
            id: `streak_milestone_${milestone}_${Date.now()}`,
            type: 'streak_milestone',
            severity: 'success',
            category: 'achievement',
            title: `🎯 ${milestone} dias de streak!`,
            message: messages[milestone] || 'Parabéns pelo seu streak!',
            created_at: new Date().toISOString(),
            dismissed: false,
            data: { streak: milestone },
        });
    }

    return alerts;
}

// ============================================
// EXPORT (THRESHOLDS only - generateAlerts already exported above)
// ============================================

export { THRESHOLDS };
