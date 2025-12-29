'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trophy, Medal, Star, Zap, Flame, Target, Award, Lock, Calendar, Dumbbell, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: any;
    color: string;
    unlocked: boolean;
    unlockedAt?: Date;
    requirement: string;
    progress?: number;
    total?: number;
}

export default function AchievementsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [stats, setStats] = useState({
        totalWorkouts: 0,
        currentStreak: 0,
        totalVolume: 0,
        personalRecords: 0
    });

    useEffect(() => {
        const loadAchievements = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                // Fetch workout sessions
                const { data: sessions } = await supabase
                    .from('workout_sessions')
                    .select('id, completed_at, total_volume')
                    .eq('user_id', user.id)
                    .not('completed_at', 'is', null)
                    .order('completed_at', { ascending: false });

                // Fetch personal records
                const { count: prCount } = await supabase
                    .from('personal_records')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                const totalWorkouts = sessions?.length || 0;
                const totalVolume = sessions?.reduce((sum: number, s: any) => sum + (s.total_volume || 0), 0) || 0;

                // Calculate streak
                let currentStreak = 0;
                if (sessions && sessions.length > 0) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const trainedToday = sessions.some((s: any) => {
                        const sessionDate = new Date(s.completed_at);
                        sessionDate.setHours(0, 0, 0, 0);
                        return sessionDate.getTime() === today.getTime();
                    });

                    let checkDate = new Date(today);
                    if (!trainedToday) {
                        checkDate.setDate(checkDate.getDate() - 1);
                    }

                    for (let i = 0; i < 365; i++) {
                        const dateStr = checkDate.toISOString().split('T')[0];
                        const hasWorkout = sessions.some((s: any) => s.completed_at?.startsWith(dateStr));

                        if (hasWorkout) {
                            currentStreak++;
                            checkDate.setDate(checkDate.getDate() - 1);
                        } else {
                            break;
                        }
                    }
                }

                setStats({
                    totalWorkouts,
                    currentStreak,
                    totalVolume,
                    personalRecords: prCount || 0
                });

                // Define achievements with unlock logic
                const achievementsList: Achievement[] = [
                    {
                        id: 'first_workout',
                        title: 'Primeiro Passo',
                        description: 'Complete seu primeiro treino',
                        icon: Zap,
                        color: '#3B82F6',
                        unlocked: totalWorkouts >= 1,
                        requirement: '1 treino completado',
                        progress: Math.min(totalWorkouts, 1),
                        total: 1
                    },
                    {
                        id: 'week_warrior',
                        title: 'Guerreiro da Semana',
                        description: 'Treine 7 dias seguidos',
                        icon: Flame,
                        color: '#F97316',
                        unlocked: currentStreak >= 7,
                        requirement: '7 dias de sequência',
                        progress: Math.min(currentStreak, 7),
                        total: 7
                    },
                    {
                        id: 'month_master',
                        title: 'Mestre do Mês',
                        description: 'Mantenha 30 dias de sequência',
                        icon: Trophy,
                        color: '#FBBF24',
                        unlocked: currentStreak >= 30,
                        requirement: '30 dias de sequência',
                        progress: Math.min(currentStreak, 30),
                        total: 30
                    },
                    {
                        id: 'volume_king',
                        title: 'Rei do Volume',
                        description: 'Atinja 10 toneladas de volume total',
                        icon: Dumbbell,
                        color: '#8B5CF6',
                        unlocked: totalVolume >= 10000,
                        requirement: '10,000kg de volume',
                        progress: Math.min(totalVolume, 10000),
                        total: 10000
                    },
                    {
                        id: 'pr_hunter',
                        title: 'Caçador de Recordes',
                        description: 'Estabeleça 5 recordes pessoais',
                        icon: Star,
                        color: '#EC4899',
                        unlocked: (prCount || 0) >= 5,
                        requirement: '5 recordes pessoais',
                        progress: Math.min(prCount || 0, 5),
                        total: 5
                    },
                    {
                        id: 'consistency_champion',
                        title: 'Campeão da Consistência',
                        description: 'Complete 50 treinos',
                        icon: Target,
                        color: '#10B981',
                        unlocked: totalWorkouts >= 50,
                        requirement: '50 treinos completados',
                        progress: Math.min(totalWorkouts, 50),
                        total: 50
                    },
                    {
                        id: 'century_club',
                        title: 'Clube dos 100',
                        description: 'Complete 100 treinos',
                        icon: Medal,
                        color: '#F59E0B',
                        unlocked: totalWorkouts >= 100,
                        requirement: '100 treinos completados',
                        progress: Math.min(totalWorkouts, 100),
                        total: 100
                    },
                    {
                        id: 'legend',
                        title: 'Lenda do Fitness',
                        description: 'Complete 365 treinos',
                        icon: Award,
                        color: '#EF4444',
                        unlocked: totalWorkouts >= 365,
                        requirement: '365 treinos completados',
                        progress: Math.min(totalWorkouts, 365),
                        total: 365
                    }
                ];

                setAchievements(achievementsList);
            } catch (error) {
                console.error('Error loading achievements:', error);
            } finally {
                setLoading(false);
            }
        };

        loadAchievements();
    }, [user]);

    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const totalCount = achievements.length;
    const completionPercentage = Math.round((unlockedCount / totalCount) * 100);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0E14' }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    <p className="text-gray-400 text-sm">Carregando conquistas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ background: '#0B0E14' }}>
            {/* Header */}
            <div className="sticky top-0 z-30 p-4 lg:p-6 border-b border-white/5 backdrop-blur-xl" style={{ background: 'rgba(11, 14, 20, 0.9)' }}>
                <div className="flex items-center gap-4 max-w-4xl mx-auto">
                    <button
                        onClick={() => router.push('/profile')}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl lg:text-2xl font-bold text-white">Conquistas</h1>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 lg:p-8 pb-28 max-w-4xl mx-auto">
                {/* Progress Summary */}
                <div className="rounded-2xl p-6 border border-yellow-500/20 mb-6" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(30, 25, 20, 0.5) 100%)' }}>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-yellow-500/20">
                            <Trophy size={32} className="text-yellow-400" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-white mb-1">
                                {unlockedCount}/{totalCount} Desbloqueadas
                            </h2>
                            <p className="text-gray-400 text-sm">Continue treinando para desbloquear mais!</p>
                        </div>
                    </div>
                    <div className="h-3 rounded-full bg-black/30 overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${completionPercentage}%`,
                                background: 'linear-gradient(90deg, #FBBF24 0%, #F59E0B 100%)'
                            }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-right">{completionPercentage}% completo</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    <div className="rounded-xl p-4 border border-white/5" style={{ background: '#1F2937' }}>
                        <Dumbbell size={20} className="text-blue-400 mb-2" />
                        <p className="text-2xl font-bold text-white">{stats.totalWorkouts}</p>
                        <p className="text-xs text-gray-400">Treinos</p>
                    </div>
                    <div className="rounded-xl p-4 border border-white/5" style={{ background: '#1F2937' }}>
                        <Flame size={20} className="text-orange-400 mb-2" />
                        <p className="text-2xl font-bold text-white">{stats.currentStreak}</p>
                        <p className="text-xs text-gray-400">Dias Streak</p>
                    </div>
                    <div className="rounded-xl p-4 border border-white/5" style={{ background: '#1F2937' }}>
                        <TrendingUp size={20} className="text-purple-400 mb-2" />
                        <p className="text-2xl font-bold text-white">{(stats.totalVolume / 1000).toFixed(1)}t</p>
                        <p className="text-xs text-gray-400">Volume Total</p>
                    </div>
                    <div className="rounded-xl p-4 border border-white/5" style={{ background: '#1F2937' }}>
                        <Star size={20} className="text-yellow-400 mb-2" />
                        <p className="text-2xl font-bold text-white">{stats.personalRecords}</p>
                        <p className="text-xs text-gray-400">Recordes</p>
                    </div>
                </div>

                {/* Achievements Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((achievement) => {
                        const Icon = achievement.icon;
                        const progress = achievement.progress || 0;
                        const total = achievement.total || 100;
                        const percentage = Math.min(100, (progress / total) * 100);

                        return (
                            <div
                                key={achievement.id}
                                className={`rounded-2xl p-5 border transition-all ${achievement.unlocked
                                    ? 'border-yellow-500/30 bg-yellow-500/10'
                                    : 'border-white/10'
                                    }`}
                                style={{
                                    background: achievement.unlocked
                                        ? 'rgba(251, 191, 36, 0.1)'
                                        : '#1F2937'
                                }}
                            >
                                <div className="flex items-start gap-4">
                                    <div
                                        className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${achievement.unlocked ? '' : 'opacity-50'
                                            }`}
                                        style={{ background: `${achievement.color}20` }}
                                    >
                                        {achievement.unlocked ? (
                                            <Icon size={28} style={{ color: achievement.color }} />
                                        ) : (
                                            <Lock size={28} className="text-gray-600" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-bold mb-1 ${achievement.unlocked ? 'text-white' : 'text-gray-400'
                                            }`}>
                                            {achievement.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 mb-3">{achievement.description}</p>

                                        {!achievement.unlocked && (
                                            <>
                                                <div className="h-2 rounded-full bg-black/30 overflow-hidden mb-2">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${percentage}%`,
                                                            background: achievement.color
                                                        }}
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    {progress.toLocaleString()} / {total.toLocaleString()} - {achievement.requirement}
                                                </p>
                                            </>
                                        )}

                                        {achievement.unlocked && (
                                            <div className="flex items-center gap-2 text-xs text-yellow-400">
                                                <Trophy size={14} />
                                                <span className="font-medium">Desbloqueado!</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Motivational Message */}
                <div className="mt-6 rounded-xl p-4 border border-white/5" style={{ background: '#1F2937' }}>
                    <p className="text-sm text-gray-400 text-center">
                        🔥 Continue treinando! Cada sessão te aproxima de novas conquistas.
                    </p>
                </div>
            </div>
        </div>
    );
}
