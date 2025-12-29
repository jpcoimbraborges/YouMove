'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
    User, Settings, Bell, LogOut, ChevronRight, Crown, Target, Dumbbell,
    Scale, Ruler, HelpCircle, MessageSquare, Star, Edit3, Zap, Lightbulb,
    TrendingUp, TrendingDown, Trophy, Flame, Activity, Heart, Check, Calendar
} from 'lucide-react';

import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// Translation maps for database enum values
const dbToLevel: Record<string, string> = {
    'beginner': 'Iniciante',
    'intermediate': 'Intermediário',
    'advanced': 'Avançado',
    'elite': 'Atleta'
};

const dbToGoal: Record<string, string> = {
    'lose_weight': 'Perder Peso',
    'build_muscle': 'Ganhar Massa',
    'improve_endurance': 'Melhorar Resistência',
    'increase_strength': 'Aumentar Força',
    'general_fitness': 'Fitness Geral',
    'flexibility': 'Flexibilidade',
    'sport_specific': 'Esporte Específico'
};

// Sample achievements data
const achievements = [
    { id: 1, name: 'Primeiro Treino', icon: Zap, color: '#3B82F6', unlocked: true },
    { id: 2, name: '7 Dias Seguidos', icon: Flame, color: '#F97316', unlocked: true },
    { id: 3, name: 'Recordista', icon: Trophy, color: '#FBBF24', unlocked: true },
];

interface ProfileData {
    full_name: string;
    weight_kg: number | null;
    height_cm: number | null;
    primary_goal: string | null;
    fitness_level: string | null;
    birth_date: string | null;
}

// Mini Sparkline Component
function WeightSparkline({ data }: { data: number[] }) {
    if (!data || data.length === 0) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const height = 24;
    const width = 60;

    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    const trend = data[data.length - 1] < data[0] ? 'down' : 'up';
    const color = trend === 'down' ? '#10B981' : '#EF4444';

    return (
        <svg width={width} height={height} className="opacity-80">
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

// XP Progress Ring Component
function XPRing({ progress, size = 96 }: { progress: number; size?: number }) {
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <svg width={size} height={size} className="absolute inset-0 -rotate-90">
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="rgba(59, 130, 246, 0.2)"
                strokeWidth={strokeWidth}
            />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#3B82F6"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500"
            />
        </svg>
    );
}

export default function ProfilePage() {
    const router = useRouter();
    const { user: authUser, signOut } = useAuth();
    const { aiTipsEnabled, setAiTipsEnabled } = useTheme();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [stats, setStats] = useState({ workouts: 0, streak: 0, prs: 0 });
    const [weightHistory, setWeightHistory] = useState<number[]>([]);
    const [connectedApps, setConnectedApps] = useState({ appleHealth: false, googleFit: false });

    // Fetch profile data from Supabase
    useEffect(() => {
        const fetchProfileData = async () => {
            if (!authUser) {
                setLoading(false);
                return;
            }

            try {
                // Fetch profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, weight_kg, height_cm, primary_goal, fitness_level, birth_date')
                    .eq('id', authUser.id)
                    .single();

                if (profile) {
                    setProfileData(profile);
                }

                // Fetch workout sessions for stats
                const { data: sessions } = await supabase
                    .from('workout_sessions')
                    .select('id, completed_at')
                    .eq('user_id', authUser.id)
                    .not('completed_at', 'is', null)
                    .order('completed_at', { ascending: false })
                    .limit(30);

                // Calculate streak
                let streak = 0;
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
                            streak++;
                            checkDate.setDate(checkDate.getDate() - 1);
                        } else {
                            break;
                        }
                    }
                }

                // Fetch personal records count
                const { count: prCount } = await supabase
                    .from('personal_records')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', authUser.id);

                // Fetch weight history from progress_metrics
                const { data: metrics } = await supabase
                    .from('progress_metrics')
                    .select('weight_kg, metric_date')
                    .eq('user_id', authUser.id)
                    .not('weight_kg', 'is', null)
                    .order('metric_date', { ascending: false })
                    .limit(7);

                if (metrics && metrics.length > 0) {
                    setWeightHistory(metrics.reverse().map((m: any) => m.weight_kg));
                } else if (profile?.weight_kg) {
                    // If no history, create a simple trend based on current weight
                    setWeightHistory([profile.weight_kg]);
                }

                setStats({
                    workouts: sessions?.length || 0,
                    streak,
                    prs: prCount || 0
                });
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [authUser]);

    const user = {
        name: profileData?.full_name || authUser?.user_metadata?.full_name || 'Usuário',
        email: authUser?.email || 'email@exemplo.com',
        avatar: null,
        subscription: 'free' as const,
        goal: (() => {
            if (!profileData?.primary_goal) {
                console.log('[Profile] primary_goal is null or undefined');
                return 'Não definido';
            }

            console.log('[Profile] primary_goal from DB:', profileData.primary_goal);
            const translated = dbToGoal[profileData.primary_goal];

            if (translated) {
                console.log('[Profile] Translated goal:', translated);
                return translated;
            }

            console.log('[Profile] No translation found, using raw value:', profileData.primary_goal);
            return profileData.primary_goal;
        })(),
        level: profileData?.fitness_level ? (dbToLevel[profileData.fitness_level] || profileData.fitness_level) : 'Iniciante',
        weight: profileData?.weight_kg || null,
        height: profileData?.height_cm || null,
        xpProgress: Math.min(100, (stats.workouts * 5) % 100), // 5 XP per workout, level up every 20 workouts
        currentLevel: Math.floor(stats.workouts / 20) + 1,
        workouts: stats.workouts,
        streak: stats.streak,
        prs: stats.prs
    };

    const handleLogout = async () => {
        await signOut();
    };

    const menuSections = [
        {
            title: 'Conta',
            items: [
                { icon: User, label: 'Editar Perfil', href: '/profile/edit', hasToggle: false },
                { icon: Target, label: 'Meus Objetivos', href: '/profile/goals', hasToggle: false },
                { icon: Dumbbell, label: 'Equipamentos', href: '/profile/equipment', hasToggle: false },
            ],
        },
        {
            title: 'Preferências',
            items: [
                { icon: Bell, label: 'Notificações', href: '/profile/notifications', hasToggle: false },
                { icon: Scale, label: 'Unidades', href: '/profile/units', hasToggle: false },
            ],
        },
        {
            title: 'Suporte',
            items: [
                { icon: HelpCircle, label: 'Central de Ajuda', href: '/help', hasToggle: false },
                { icon: MessageSquare, label: 'Fale Conosco', href: '/contact', hasToggle: false },
                { icon: Star, label: 'Avaliar App', href: '/rate', hasToggle: false },
            ],
        },
    ];

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center" style={{ background: '#0B0E14' }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    <p className="text-gray-400 text-sm">Carregando perfil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen overflow-hidden" style={{ background: '#0B0E14' }}>
            {/* Main Content */}
            <main className="h-full overflow-y-auto pb-24 lg:pb-8">
                {/* Header */}
                <div className="sticky top-0 z-30 p-4 lg:p-6 border-b border-white/5 backdrop-blur-xl" style={{ background: 'rgba(11, 14, 20, 0.9)' }}>
                    <div className="flex items-center justify-between max-w-5xl mx-auto">
                        <h1 className="text-xl lg:text-2xl font-bold text-white">Meu Perfil</h1>
                        <Link href="/settings" className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                            <Settings size={20} />
                        </Link>
                    </div>
                </div>

                <div className="p-4 lg:p-8 max-w-5xl mx-auto">
                    {/* Desktop: 2 Column Layout */}
                    <div className="lg:grid lg:grid-cols-3 lg:gap-6">

                        {/* LEFT COLUMN (1/3) - Identity + Plan */}
                        <div className="lg:col-span-1 space-y-4 mb-6 lg:mb-0">

                            {/* Identity Card (Hero) */}
                            <div className="rounded-2xl p-6 border border-white/5" style={{ background: '#1F2937' }}>
                                <div className="flex flex-col items-center text-center">
                                    {/* Avatar with XP Ring */}
                                    <div className="relative mb-4">
                                        <XPRing progress={user.xpProgress} size={96} />
                                        <div
                                            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white"
                                            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }}
                                        >
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <Link
                                            href="/profile/edit"
                                            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center bg-blue-500 hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/30"
                                        >
                                            <Edit3 size={14} className="text-white" />
                                        </Link>
                                    </div>

                                    {/* Name & Email */}
                                    <h2 className="text-xl font-bold text-white mb-1">{user.name}</h2>
                                    <p className="text-sm text-gray-400 mb-4">{user.email}</p>

                                    {/* Level Progress Bar */}
                                    <div className="w-full">
                                        <div className="flex items-center justify-between text-xs mb-2">
                                            <span className="text-blue-400 font-medium">Nível {user.currentLevel} - {user.level}</span>
                                            <span className="text-gray-500">Nível {user.currentLevel + 1}</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${user.xpProgress}%`,
                                                    background: 'linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%)'
                                                }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1.5 text-center">{user.xpProgress}% para o próximo nível</p>
                                    </div>
                                </div>
                            </div>

                            {/* Plan Status Banner */}
                            <Link href="/pricing" className="block">
                                <div
                                    className="rounded-2xl p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition-all group"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(120, 80, 20, 0.4) 0%, rgba(30, 25, 20, 0.9) 100%)'
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                                style={{ background: 'linear-gradient(135deg, #FBBF24 0%, #B45309 100%)' }}
                                            >
                                                <Crown size={18} className="text-white" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-yellow-500/70">Plano Atual</p>
                                                <p className="font-bold text-yellow-400">Membro Free</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="text-yellow-500 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                    <p className="text-xs text-yellow-500/60 mt-2">Upgrade para PRO e desbloqueie treinos ilimitados</p>
                                </div>
                            </Link>

                            {/* Achievements Preview */}
                            <div className="rounded-2xl p-4 border border-white/5" style={{ background: '#1F2937' }}>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                        <Trophy size={16} className="text-yellow-500" />
                                        Conquistas Recentes
                                    </h3>
                                    <Link href="/profile/achievements" className="text-xs text-blue-400 hover:text-blue-300">
                                        Ver todas
                                    </Link>
                                </div>
                                <div className="flex items-center justify-around">
                                    {achievements.map((achievement) => (
                                        <div key={achievement.id} className="flex flex-col items-center gap-1.5">
                                            <div
                                                className="w-12 h-12 rounded-xl flex items-center justify-center"
                                                style={{ background: `${achievement.color}20` }}
                                            >
                                                <achievement.icon size={20} style={{ color: achievement.color }} />
                                            </div>
                                            <span className="text-[10px] text-gray-400 text-center max-w-[60px] leading-tight">
                                                {achievement.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN (2/3) - Data + Settings */}
                        <div className="lg:col-span-2 space-y-4">

                            {/* Stats Bar */}
                            <div className="rounded-2xl p-4 border border-white/5 flex items-center justify-around" style={{ background: '#1F2937' }}>
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Dumbbell size={16} className="text-blue-400" />
                                        <span className="text-2xl font-bold text-white">{user.workouts}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">Treinos</span>
                                </div>
                                <div className="w-px h-10 bg-white/10" />
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Flame size={16} className="text-orange-400" />
                                        <span className="text-2xl font-bold text-white">{user.streak}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">Dias Streak</span>
                                </div>
                                <div className="w-px h-10 bg-white/10" />
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Zap size={16} className="text-yellow-400" />
                                        <span className="text-2xl font-bold text-white">{user.prs}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">Recordes</span>
                                </div>
                            </div>

                            {/* Body Data Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Height Card */}
                                <div className="rounded-2xl p-5 border border-white/5 relative overflow-hidden" style={{ background: '#1F2937' }}>
                                    <Ruler
                                        size={80}
                                        className="absolute -right-4 -bottom-4 text-blue-500/10 rotate-45"
                                        strokeWidth={1}
                                    />
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/10">
                                                <Ruler size={16} className="text-blue-400" />
                                            </div>
                                            <span className="text-sm text-gray-400">Altura</span>
                                        </div>
                                        <p className="text-3xl font-bold text-white">
                                            {user.height || '--'}
                                            {user.height && <span className="text-lg text-gray-400 font-normal ml-1">cm</span>}
                                        </p>
                                    </div>
                                </div>

                                {/* Weight Card with Sparkline */}
                                <div className="rounded-2xl p-5 border border-white/5 relative overflow-hidden" style={{ background: '#1F2937' }}>
                                    <Scale
                                        size={80}
                                        className="absolute -right-4 -bottom-4 text-green-500/10"
                                        strokeWidth={1}
                                    />
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-500/10">
                                                    <Scale size={16} className="text-green-400" />
                                                </div>
                                                <span className="text-sm text-gray-400">Peso</span>
                                            </div>
                                            {weightHistory.length > 1 && <WeightSparkline data={weightHistory} />}
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <p className="text-3xl font-bold text-white">
                                                {user.weight || '--'}
                                                {user.weight && <span className="text-lg text-gray-400 font-normal ml-1">kg</span>}
                                            </p>
                                            {weightHistory.length > 1 && (
                                                <span className={`text-xs flex items-center gap-0.5 mb-1 ${weightHistory[weightHistory.length - 1] < weightHistory[0] ? 'text-green-400' : 'text-red-400'
                                                    }`}>
                                                    {weightHistory[weightHistory.length - 1] < weightHistory[0] ? (
                                                        <><TrendingDown size={12} />-{(weightHistory[0] - weightHistory[weightHistory.length - 1]).toFixed(1)}kg</>
                                                    ) : (
                                                        <><TrendingUp size={12} />+{(weightHistory[weightHistory.length - 1] - weightHistory[0]).toFixed(1)}kg</>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Current Goal */}
                            <div className="rounded-2xl p-4 border border-blue-500/20" style={{ background: '#1F2937' }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10">
                                            <Target size={18} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Objetivo Atual</p>
                                            <p className="font-semibold text-white">{user.goal}</p>
                                        </div>
                                    </div>
                                    <Link
                                        href="/profile/edit"
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-blue-400 hover:bg-blue-500/10 transition-colors border border-blue-500/30"
                                    >
                                        Alterar
                                    </Link>
                                </div>
                            </div>

                            {/* Integrations */}
                            <div className="rounded-2xl p-4 border border-white/5" style={{ background: '#1F2937' }}>
                                <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                                    <Activity size={16} className="text-blue-400" />
                                    Integrações
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setConnectedApps(prev => ({ ...prev, appleHealth: !prev.appleHealth }))}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${connectedApps.appleHealth
                                            ? 'border-green-500/30 bg-green-500/10'
                                            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-pink-500 to-red-500">
                                            <Heart size={18} className="text-white" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="text-sm font-medium text-white">Apple Health</p>
                                            <p className="text-[10px] text-gray-400">
                                                {connectedApps.appleHealth ? 'Conectado' : 'Conectar'}
                                            </p>
                                        </div>
                                        {connectedApps.appleHealth && (
                                            <Check size={16} className="text-green-400" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setConnectedApps(prev => ({ ...prev, googleFit: !prev.googleFit }))}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${connectedApps.googleFit
                                            ? 'border-green-500/30 bg-green-500/10'
                                            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 via-green-500 to-yellow-500">
                                            <Activity size={18} className="text-white" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="text-sm font-medium text-white">Google Fit</p>
                                            <p className="text-[10px] text-gray-400">
                                                {connectedApps.googleFit ? 'Conectado' : 'Conectar'}
                                            </p>
                                        </div>
                                        {connectedApps.googleFit && (
                                            <Check size={16} className="text-green-400" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* AI Tips Toggle */}
                            <div className="rounded-2xl p-4 border border-white/5" style={{ background: '#1F2937' }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10">
                                            <Lightbulb size={18} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">Dicas do Coach IA</p>
                                            <p className="text-xs text-gray-400">Mostrar insights durante o treino</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setAiTipsEnabled(!aiTipsEnabled)}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${aiTipsEnabled ? 'bg-blue-500' : 'bg-white/10'
                                            }`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${aiTipsEnabled ? 'translate-x-6' : 'translate-x-0'
                                            }`} />
                                    </button>
                                </div>
                            </div>

                            {/* Menu Sections */}
                            {menuSections.map(section => (
                                <div key={section.title} className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: '#1F2937' }}>
                                    <h3 className="text-xs text-gray-400 font-medium px-4 py-3 uppercase tracking-wider border-b border-white/5">
                                        {section.title}
                                    </h3>
                                    {section.items.map((item, i) => (
                                        <button
                                            key={item.label}
                                            onClick={() => router.push(item.href)}
                                            className="w-full flex items-center justify-between p-4 transition-colors hover:bg-white/5 group"
                                            style={{
                                                borderBottom: i < section.items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-500/10">
                                                    <item.icon size={16} className="text-blue-400" />
                                                </div>
                                                <span className="text-sm font-medium text-white">{item.label}</span>
                                            </div>
                                            <ChevronRight size={16} className="text-gray-500 group-hover:text-gray-300 group-hover:translate-x-0.5 transition-all" />
                                        </button>
                                    ))}
                                </div>
                            ))}

                            {/* Logout Button */}
                            <button
                                onClick={() => setShowLogoutModal(true)}
                                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-red-400 hover:bg-red-500/10 transition-colors border border-red-500/30"
                            >
                                <LogOut size={18} />
                                <span className="font-medium">Sair da Conta</span>
                            </button>

                            {/* Mobile App Info */}
                            <div className="lg:hidden flex flex-col items-center gap-2 pt-4 pb-8">
                                <Image src="/app-icon.png" alt="YouMove" width={28} height={28} className="rounded-lg opacity-50" />
                                <p className="text-xs text-gray-500">YouMove v1.0.0</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Logout Modal */}
            {showLogoutModal && (
                <div
                    className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center bg-black/80 backdrop-blur-sm"
                    onClick={() => setShowLogoutModal(false)}
                >
                    <div
                        className="w-full max-w-md rounded-t-[2rem] lg:rounded-2xl p-8 pb-12 lg:pb-8 border-t lg:border border-white/5 shadow-2xl"
                        style={{ background: '#1F2937' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="lg:hidden absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-white/20" />

                        <div className="flex flex-col items-center mb-8 mt-4 lg:mt-0">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
                                <div className="w-20 h-20 rounded-full flex items-center justify-center border border-white/5 relative z-10" style={{ background: '#0B0E14' }}>
                                    <LogOut size={32} className="text-red-500 ml-1" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold mb-2 text-white">Já vai embora?</h2>
                            <p className="text-gray-400 text-sm text-center max-w-[280px]">
                                Seus treinos estão salvos. Esperamos ver você de volta em breve! 💪
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleLogout}
                                className="w-full py-4 rounded-xl font-bold text-white transition-all active:scale-[0.98]"
                                style={{ background: '#EF4444' }}
                            >
                                Sim, Sair da Conta
                            </button>
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="w-full py-4 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
