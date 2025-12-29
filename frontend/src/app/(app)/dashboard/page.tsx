'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
    LayoutGrid,
    Sparkles,
    TrendingUp,
    Utensils,
    Users,
    Bell,
    Calendar,
    Scale,
    Flame,
    Moon,
    Play,
    Dumbbell,
    Activity,
    Zap,
    Target,
    Trophy,
    Clock
} from 'lucide-react';
import { QuickActionsWidget } from '@/components/dashboard/QuickActionsWidget';
import { NutritionSummaryWidget } from '@/components/dashboard/NutritionSummaryWidget';
import { ActivityTimelineWidget } from '@/components/dashboard/ActivityTimelineWidget';

interface ProfileData {
    full_name: string | null;
    weight_kg: number | null;
    height_cm: number | null;
    birth_date: string | null;
    fitness_level: string | null;
    primary_goal: string | null;
}

interface WorkoutSession {
    id: string;
    completed_at: string;
    workout_name: string | null;
    // Production DB columns (different from migration schema!)
    total_volume: number;           // not total_volume_kg
    total_sets: number;             // not total_sets_completed  
    total_reps: number;
    duration_seconds: number | null; // not actual_duration_minutes
    calories_burned?: number | null;
}

interface UserWorkout {
    id: string;
    name: string;
    target_muscles: string[];
    exercises: any[];
    workout_type: string;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [recentSessions, setRecentSessions] = useState<WorkoutSession[]>([]);
    const [streakDays, setStreakDays] = useState(0);
    const [weeklyProgress, setWeeklyProgress] = useState(0);
    const [nextWorkout, setNextWorkout] = useState<UserWorkout | null>(null);
    const [weeklyCalories, setWeeklyCalories] = useState(0);
    const [weeklyWorkouts, setWeeklyWorkouts] = useState(0);
    const [loading, setLoading] = useState(true);

    const userName = profileData?.full_name?.split(' ')[0]
        || user?.user_metadata?.full_name?.split(' ')[0]
        || user?.email?.split('@')[0]
        || 'Atleta';

    // Get greeting based on time
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    // Calculate BMR (Basal Metabolic Rate) for calorie estimation
    const calculateBMR = (weight: number, height: number, age: number, gender: string = 'male') => {
        // Mifflin-St Jeor Equation
        if (gender === 'male') {
            return (10 * weight) + (6.25 * height) - (5 * age) + 5;
        } else {
            return (10 * weight) + (6.25 * height) - (5 * age) - 161;
        }
    };

    // Calculate age from birth date
    const calculateAge = (birthDate: string) => {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                // Fetch profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, weight_kg, height_cm, birth_date, fitness_level, primary_goal, gender')
                    .eq('id', user.id)
                    .single();

                if (profile) setProfileData(profile);

                // Fetch recent sessions with all metrics
                const { data: sessions } = await supabase
                    .from('workout_sessions')
                    .select('id, completed_at, workout_name, total_volume, total_sets, total_reps, duration_seconds')
                    .eq('user_id', user.id)
                    .not('completed_at', 'is', null)
                    .order('completed_at', { ascending: false })
                    .limit(30);

                if (sessions) {
                    setRecentSessions(sessions);

                    // Calculate weekly stats
                    const now = new Date();
                    const weekAgo = new Date(now);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    weekAgo.setHours(0, 0, 0, 0); // Start of day 7 days ago

                    // Filter sessions from last 7 days
                    const weekSessions = sessions.filter((s: WorkoutSession) => {
                        if (!s.completed_at) return false;
                        const completedDate = new Date(s.completed_at);
                        return completedDate >= weekAgo;
                    });

                    console.log('📊 Dashboard - Weekly sessions:', weekSessions.length, 'Total volume:', weekSessions.reduce((sum: number, s: WorkoutSession) => sum + (s.total_volume || 0), 0));

                    // Calculate calories from volume (5 kcal per kg)
                    const totalCalories = weekSessions.reduce((sum: number, s: WorkoutSession) => {
                        const vol = s.total_volume || 0;
                        return sum + Math.round(vol * 0.05);
                    }, 0);

                    setWeeklyCalories(totalCalories);
                    setWeeklyWorkouts(weekSessions.length);

                    // Calculate weekly progress (based on goal of 5 workouts/week)
                    const progress = Math.min(100, Math.round((weekSessions.length / 5) * 100));
                    setWeeklyProgress(progress);

                    // Calculate streak
                    let streak = 0;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    // Check if trained today
                    const trainedToday = sessions.some((s: WorkoutSession) => {
                        const sessionDate = new Date(s.completed_at);
                        sessionDate.setHours(0, 0, 0, 0);
                        return sessionDate.getTime() === today.getTime();
                    });

                    // Start from today or yesterday
                    let checkDate = new Date(today);
                    if (!trainedToday) {
                        checkDate.setDate(checkDate.getDate() - 1);
                    }

                    for (let i = 0; i < 365; i++) {
                        const dateStr = checkDate.toISOString().split('T')[0];
                        const hasWorkout = sessions.some((s: WorkoutSession) => s.completed_at?.startsWith(dateStr));

                        if (hasWorkout) {
                            streak++;
                            checkDate.setDate(checkDate.getDate() - 1);
                        } else {
                            break;
                        }
                    }
                    setStreakDays(streak);
                }

                // Fetch next workout
                const { data: workouts } = await supabase
                    .from('workouts')
                    .select('id, name, target_muscles, exercises, workout_type')
                    .eq('user_id', user.id)
                    .eq('is_active', true)
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (workouts && workouts.length > 0) {
                    setNextWorkout(workouts[0]);
                }

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    // Sidebar navigation items
    const navItems = [
        { icon: LayoutGrid, label: 'Dashboard', href: '/dashboard', active: true },
        { icon: Sparkles, label: 'Treinos IA', href: '/workout?mode=ai', active: false },
        { icon: TrendingUp, label: 'Progresso', href: '/progress', active: false },
        { icon: Utensils, label: 'Nutrição', href: '/nutrition', active: false },
        { icon: Users, label: 'Comunidade', href: '/community', active: false },
    ];

    // Get muscle group icon
    const getMuscleGroupIcon = () => {
        const muscles = nextWorkout?.target_muscles || [];
        if (muscles.some((m: string) => m.toLowerCase().includes('chest') || m.toLowerCase().includes('peito'))) return Dumbbell;
        if (muscles.some((m: string) => m.toLowerCase().includes('leg') || m.toLowerCase().includes('perna'))) return Activity;
        return Zap;
    };

    const MuscleIcon = getMuscleGroupIcon();

    // Format muscle focus for display
    const getMuscleFocus = () => {
        const muscles = nextWorkout?.target_muscles || [];
        if (muscles.length === 0) return 'Full Body';

        const translations: Record<string, string> = {
            'chest': 'Peito', 'back': 'Costas', 'legs': 'Pernas', 'shoulders': 'Ombros',
            'arms': 'Braços', 'biceps': 'Bíceps', 'triceps': 'Tríceps', 'abs': 'Abdômen',
            'core': 'Core', 'glutes': 'Glúteos', 'quadriceps': 'Quadríceps', 'hamstrings': 'Posteriores',
            'peito': 'Peito', 'costas': 'Costas', 'pernas': 'Pernas', 'ombros': 'Ombros'
        };

        const translated = muscles.map((m: string) => {
            const lower = m.toLowerCase();
            return translations[lower] || m;
        }).slice(0, 3);

        return translated.join(' e ');
    };

    // Calculate daily calorie goal (BMR * activity factor)
    const getDailyCalorieGoal = () => {
        if (!profileData?.weight_kg || !profileData?.height_cm) return 2000;

        const age = profileData.birth_date ? calculateAge(profileData.birth_date) : 30;
        const bmr = calculateBMR(profileData.weight_kg, profileData.height_cm, age, (profileData as any).gender || 'male');

        // Activity factor (moderate exercise 3-5 days/week)
        return Math.round(bmr * 1.55);
    };

    // Estimate sleep hours (placeholder - could be integrated with health apps)
    const getSleepHours = () => {
        // This would ideally come from a health tracking integration
        // For now, return a reasonable default
        return '7h 30m';
    };

    // Stats cards data with real data
    const statsCards = [
        {
            icon: Calendar,
            label: 'Sequência:',
            value: `${streakDays} Dia${streakDays !== 1 ? 's' : ''}`,
            color: '#3b82f6',
            href: '/progress'
        },
        {
            icon: Scale,
            label: 'Peso Atual:',
            value: profileData?.weight_kg ? `${profileData.weight_kg}kg` : '---',
            color: '#3b82f6',
            href: '/profile'
        },
        {
            icon: Flame,
            label: 'Calorias:',
            value: `${getDailyCalorieGoal()} kcal`,
            color: '#3b82f6',
            href: '/nutrition'
        },
        {
            icon: Moon,
            label: 'Sono:',
            value: getSleepHours(),
            color: '#3b82f6',
            href: '/profile'
        },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f1419' }}>
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Carregando dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ background: '#0f1419' }}>
            {/* Main Content */}
            <main className="p-6 lg:p-8 pb-28 lg:pb-8 overflow-y-auto">
                {/* Header */}
                <header className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl lg:text-3xl font-bold text-white">
                        {getGreeting()}, {userName}
                    </h1>
                    <div className="flex items-center gap-4">
                        <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                            <Bell size={20} strokeWidth={1.5} />
                        </button>
                        <Link href="/profile" className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-500 hover:border-blue-400 transition-colors">
                            <Image
                                src="/app-icon.png"
                                alt="Avatar"
                                width={40}
                                height={40}
                                className="object-cover"
                            />
                        </Link>
                    </div>
                </header>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Meta do Dia Card */}
                    <div className="rounded-3xl p-6 relative overflow-hidden group border border-white/5"
                        style={{ background: 'linear-gradient(145deg, #1c2128 0%, #0d1117 100%)' }}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-opacity opacity-50 group-hover:opacity-100 duration-500" />

                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Target className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" size={20} />
                                    Meta Semanal
                                </h2>
                                <p className="text-xs text-gray-400 mt-1 font-medium">Sua consistência essa semana</p>
                            </div>
                            {weeklyProgress >= 100 ? (
                                <div className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold animate-pulse flex items-center gap-1.5 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                                    <Trophy size={12} />
                                    CONQUISTADA
                                </div>
                            ) : (
                                <div className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold flex items-center gap-1.5">
                                    <Activity size={12} />
                                    EM ANDAMENTO
                                </div>
                            )}
                        </div>

                        {/* Center Layout */}
                        <div className="flex flex-col items-center justify-center relative z-10">
                            {/* Progress Ring */}
                            <div className="relative w-48 h-48 group-hover:scale-105 transition-transform duration-500 ease-out">
                                <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl" viewBox="0 0 120 120">
                                    <defs>
                                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#3b82f6" />
                                            <stop offset="50%" stopColor="#8b5cf6" />
                                            <stop offset="100%" stopColor="#ec4899" />
                                        </linearGradient>
                                        <linearGradient id="ringTrack" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#2d333b" />
                                            <stop offset="100%" stopColor="#1c2128" />
                                        </linearGradient>
                                    </defs>
                                    <circle cx="60" cy="60" r="52" fill="none" stroke="url(#ringTrack)" strokeWidth="10" strokeLinecap="round" />
                                    <circle
                                        cx="60" cy="60" r="52"
                                        fill="none"
                                        stroke="url(#progressGradient)"
                                        strokeWidth="10"
                                        strokeLinecap="round"
                                        strokeDasharray={`${weeklyProgress * 3.27} 327`}
                                        className="transition-all duration-[1.5s] ease-out"
                                        style={{ filter: 'drop-shadow(0 0 6px rgba(139, 92, 246, 0.4))' }}
                                    />
                                </svg>

                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <div className="flex items-baseline">
                                        <span className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">
                                            {weeklyProgress}
                                        </span>
                                        <span className="text-lg text-gray-400 font-bold ml-1">%</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mt-1 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                        Concluído
                                    </span>
                                </div>
                            </div>

                            {/* Footer/Context */}
                            <div className="mt-8 grid grid-cols-2 gap-3 w-full opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="bg-[#13171e] rounded-xl p-3 text-center border border-white/5 hover:bg-white/5 transition-colors">
                                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Treinos</p>
                                    <div className="flex items-center justify-center gap-1">
                                        <p className="text-lg font-bold text-white">{weeklyWorkouts}</p>
                                        <span className="text-gray-600 text-xs font-medium">/ 5</span>
                                    </div>
                                </div>
                                <div className="bg-[#13171e] rounded-xl p-3 text-center border border-white/5 hover:bg-white/5 transition-colors">
                                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Calorias</p>
                                    <div className="flex items-center justify-center gap-1">
                                        <p className="text-lg font-bold text-white">{weeklyCalories > 0 ? Math.round(weeklyCalories) : '---'}</p>
                                        <span className="text-gray-600 text-xs font-medium">kcal</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Próximo Treino Card */}
                    <div className="rounded-2xl overflow-hidden flex flex-col relative" style={{ background: '#1c2128' }}>
                        <div className="h-40 relative overflow-hidden">
                            <div className="absolute inset-0 z-0">
                                <Image
                                    src="/workout-bg-active.png"
                                    alt="Workout Active Background"
                                    fill
                                    className="object-cover opacity-90"
                                    priority
                                />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-blue-900/50 to-transparent mix-blend-overlay z-0" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1c2128] via-[#1c2128]/80 to-transparent z-0" />
                            <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center z-10 shadow-lg">
                                <MuscleIcon size={20} className="text-white" strokeWidth={2} />
                            </div>
                        </div>

                        <div className="p-6 flex-1 flex flex-col">
                            <p className="text-gray-400 text-sm mb-1">Próximo Treino</p>
                            <h3 className="text-xl font-bold text-white mb-2">
                                {nextWorkout?.name || 'Treino Personalizado IA'}
                            </h3>

                            <p className="text-blue-400 text-sm font-medium mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                Foco: {getMuscleFocus()}
                            </p>

                            <Link
                                href={nextWorkout ? `/active-session/${nextWorkout.id}` : '/workout?mode=ai'}
                                className="mt-auto w-full py-4 rounded-xl font-bold text-white text-center flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
                                style={{
                                    background: '#3b82f6',
                                    boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
                                }}
                            >
                                <Play size={18} fill="white" />
                                INICIAR TREINO
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats Cards Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statsCards.map((stat, index) => (
                        <Link
                            key={index}
                            href={stat.href}
                            className="rounded-2xl p-5 flex flex-col items-center text-center transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer active:scale-95 group"
                            style={{ background: '#1c2128' }}
                        >
                            <stat.icon size={24} className="text-gray-400 mb-3 group-hover:text-blue-400 transition-colors" strokeWidth={1.5} />
                            <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
                            <p className="text-lg font-bold group-hover:scale-105 transition-transform" style={{ color: stat.color }}>{stat.value}</p>
                        </Link>
                    ))}
                </div>

                {/* New Widgets Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Quick Actions */}
                    <QuickActionsWidget />

                    {/* Nutrition Summary */}
                    {user?.id && <NutritionSummaryWidget userId={user.id} />}
                </div>

                {/* Activity Timeline - Full Width */}
                <div className="mt-6">
                    {user?.id && <ActivityTimelineWidget userId={user.id} />}
                </div>
            </main>

            {/* Decorative Element */}
            <div className="fixed bottom-8 right-8 hidden lg:block opacity-30 pointer-events-none">
                <Sparkles size={32} className="text-blue-500" />
            </div>
        </div>
    );
}
