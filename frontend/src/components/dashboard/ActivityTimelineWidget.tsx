'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Dumbbell, Utensils, Scale, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ActivityItem {
    id: string;
    type: 'workout' | 'meal' | 'weight';
    title: string;
    subtitle?: string;
    timestamp: string;
    href?: string;
}

interface ActivityTimelineWidgetProps {
    userId: string;
}

export function ActivityTimelineWidget({ userId }: ActivityTimelineWidgetProps) {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            if (!userId) return;

            try {
                const allActivities: ActivityItem[] = [];

                // Fetch recent workouts
                const { data: workouts } = await supabase
                    .from('workout_sessions')
                    .select('id, completed_at, workout_name, total_volume')
                    .eq('user_id', userId)
                    .not('completed_at', 'is', null)
                    .order('completed_at', { ascending: false })
                    .limit(3);

                if (workouts) {
                    workouts.forEach((w: any) => {
                        allActivities.push({
                            id: w.id,
                            type: 'workout',
                            title: w.workout_name || 'Treino Completo',
                            subtitle: w.total_volume ? `${Math.round(w.total_volume)}kg volume` : undefined,
                            timestamp: w.completed_at,
                            href: `/history`
                        });
                    });
                }

                // Fetch recent meals
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);

                const { data: meals } = await supabase
                    .from('nutrition_logs')
                    .select('id, log_date, meal_type, item_name, calories, created_at')
                    .eq('user_id', userId)
                    .gte('log_date', yesterday.toISOString().split('T')[0])
                    .order('created_at', { ascending: false })
                    .limit(3);

                if (meals) {
                    meals.forEach((m: any) => {
                        const mealTypeMap: Record<string, string> = {
                            'breakfast': 'Café da Manhã',
                            'lunch': 'Almoço',
                            'dinner': 'Jantar',
                            'snack': 'Lanche'
                        };

                        allActivities.push({
                            id: m.id,
                            type: 'meal',
                            title: mealTypeMap[m.meal_type] || 'Refeição',
                            subtitle: m.item_name || (m.calories ? `${m.calories} kcal` : undefined),
                            timestamp: m.created_at,
                            href: '/nutrition'
                        });
                    });
                }

                // Sort all activities by timestamp (most recent first)
                allActivities.sort((a, b) =>
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                );

                // Keep only top 5
                setActivities(allActivities.slice(0, 5));
            } catch (error) {
                console.error('Error fetching activities:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, [userId]);

    const getRelativeTime = (timestamp: string): string => {
        const now = new Date();
        const past = new Date(timestamp);
        const diffMs = now.getTime() - past.getTime();
        const diffSec = Math.round(diffMs / 1000);
        const diffMin = Math.round(diffSec / 60);
        const diffHour = Math.round(diffMin / 60);
        const diffDay = Math.round(diffHour / 24);

        if (diffMin < 1) return 'agora mesmo';
        if (diffMin < 60) return `há ${diffMin} min`;
        if (diffHour < 24) return `há ${diffHour}h`;
        if (diffDay === 1) return 'ontem';
        if (diffDay < 7) return `há ${diffDay} dias`;
        return past.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'workout':
                return Dumbbell;
            case 'meal':
                return Utensils;
            case 'weight':
                return Scale;
            default:
                return Clock;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'workout':
                return { text: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' };
            case 'meal':
                return { text: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' };
            case 'weight':
                return { text: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' };
            default:
                return { text: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/30' };
        }
    };

    if (loading) {
        return (
            <div className="rounded-2xl p-6 border border-white/5" style={{ background: '#1c2128' }}>
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-white/5 rounded w-1/2" />
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-white/5 rounded" />
                    ))}
                </div>
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="rounded-2xl p-6 border border-white/5" style={{ background: '#1c2128' }}>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Clock size={18} className="text-blue-400" />
                    Atividades Recentes
                </h2>
                <div className="text-center py-8">
                    <Clock size={32} className="text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Nenhuma atividade ainda</p>
                    <p className="text-gray-600 text-xs mt-1">Comece um treino ou registre uma refeição!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl p-6 border border-white/5" style={{ background: '#1c2128' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Clock size={18} className="text-blue-400" />
                    Atividades Recentes
                </h2>
                <Link
                    href="/history"
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                    Ver tudo
                    <ChevronRight size={14} />
                </Link>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
                {activities.map((activity, index) => {
                    const Icon = getActivityIcon(activity.type);
                    const colors = getActivityColor(activity.type);

                    return (
                        <Link
                            key={activity.id}
                            href={activity.href || '/dashboard'}
                            className="group flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 
                                       transition-all duration-200 cursor-pointer"
                        >
                            {/* Icon */}
                            <div className={`w-10 h-10 rounded-lg ${colors.bg} border ${colors.border} 
                                            flex items-center justify-center shrink-0 
                                            group-hover:scale-110 transition-transform`}>
                                <Icon size={18} className={colors.text} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate 
                                             group-hover:text-blue-300 transition-colors">
                                    {activity.title}
                                </p>
                                {activity.subtitle && (
                                    <p className="text-xs text-gray-500 truncate mt-0.5">
                                        {activity.subtitle}
                                    </p>
                                )}
                            </div>

                            {/* Timestamp */}
                            <span className="text-xs text-gray-600 shrink-0">
                                {getRelativeTime(activity.timestamp)}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
