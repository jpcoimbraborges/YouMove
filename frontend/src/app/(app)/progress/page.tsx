'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MuscleHeatmap } from '@/components/ui/MuscleHeatmap';
import { CalorieChart } from '@/components/ui/CalorieChart';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
    TrendingUp,
    Flame,
    Calendar,
    Dumbbell,
    Clock,
    Target,
    Zap,
    Activity,
    LayoutGrid,
    Sparkles,
    Users,
    Utensils,
    ChevronUp,
    Battery,
    BatteryLow,
    BatteryMedium,
    Medal,
    Trophy,
    Star,
    Info
} from 'lucide-react';

interface WeekData {
    day: string;
    volume: number;
    sessions: number;
    calories: number;
    date: string;
}

interface MuscleData {
    muscle: string;
    volume: number;
    sessions: number;
    sets: number;
    lastTrained?: Date;
}

const navItems = [
    { icon: LayoutGrid, label: 'Dashboard', href: '/dashboard', active: false },
    { icon: Calendar, label: 'Histórico', href: '/history', active: false },
    { icon: TrendingUp, label: 'Progresso', href: '/progress', active: true },
    { icon: Sparkles, label: 'Treinos IA', href: '/workout?mode=ai', active: false },
    { icon: Utensils, label: 'Nutrição', href: '/nutrition', active: false },
    { icon: Users, label: 'Comunidade', href: '/community', active: false },
];


// Moved badges logic inside component to use stats
const getBadges = (stats: any) => [
    {
        icon: Medal,
        label: 'Iniciante',
        description: 'Faça seu primeiro treino',
        unlocked: stats.totalWorkouts >= 1,
        progress: Math.min(100, (stats.totalWorkouts / 1) * 100),
        color: 'text-blue-400',
        bg: 'bg-blue-400/10 border-blue-400/20'
    },
    {
        icon: Trophy,
        label: 'Guerreiro da Semana',
        description: 'Treine 3x na semana',
        unlocked: stats.thisWeekWorkouts >= 3,
        progress: Math.min(100, (stats.thisWeekWorkouts / 3) * 100),
        color: 'text-yellow-400',
        bg: 'bg-yellow-400/10 border-yellow-400/20'
    },
    {
        icon: Flame,
        label: 'Em Chamas',
        description: 'Sequência de 7 dias',
        unlocked: stats.currentStreak >= 7,
        progress: Math.min(100, (stats.currentStreak / 7) * 100),
        color: 'text-orange-500',
        bg: 'bg-orange-500/10 border-orange-500/20'
    },
    {
        icon: Star,
        label: 'Mestre do Volume',
        description: 'Acumule 10 toneladas',
        unlocked: stats.totalVolume >= 10000,
        progress: Math.min(100, (stats.totalVolume / 10000) * 100),
        color: 'text-purple-400',
        bg: 'bg-purple-400/10 border-purple-400/20'
    },
    {
        icon: Target,
        label: 'Disciplinado',
        description: '20 treinos totais',
        unlocked: stats.totalWorkouts >= 20,
        progress: Math.min(100, (stats.totalWorkouts / 20) * 100),
        color: 'text-green-400',
        bg: 'bg-green-400/10 border-green-400/20'
    }
];


export default function ProgressPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [weekData, setWeekData] = useState<WeekData[]>([]);
    const [muscleData, setMuscleData] = useState<MuscleData[]>([]);
    const [periodFilter, setPeriodFilter] = useState<'7d' | 'month' | 'year'>('7d');
    const [bodyView, setBodyView] = useState<'front' | 'back'>('front');
    const [stats, setStats] = useState({
        totalWorkouts: 0,
        totalVolume: 0,
        totalTime: 0,
        totalCalories: 0,
        avgSessionTime: 0,
        currentStreak: 0,
        bestStreak: 0,
        thisWeekWorkouts: 0,
        lastWeekWorkouts: 0
    });
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update current time every minute for real-time recovery status
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchProgress = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                // Fetch completed sessions
                const { data: sessions, error } = await supabase
                    .from('workout_sessions')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('completed_at', { ascending: false });

                if (error) throw error;

                if (!sessions || sessions.length === 0) {
                    setLoading(false);
                    return;
                }

                // Initialize tracking variables
                const totalWorkouts = sessions.length;
                let totalVolume = 0;
                let totalTime = 0;
                let totalCalories = 0;
                const muscleStats: Record<string, MuscleData> = {};
                const now = new Date();

                // Helper to initialize muscle stat
                const initMuscle = (m: string) => {
                    if (!muscleStats[m]) {
                        muscleStats[m] = { muscle: m, volume: 0, sessions: 0, sets: 0, lastTrained: undefined };
                    }
                };

                // Process Sessions
                for (const session of sessions) {
                    // Try to calculate volume manually if total_volume is 0 (common issue)
                    let sessionVolume = (session as any).total_volume || 0;
                    const sessionDuration = (session as any).total_duration_seconds || (session as any).duration_seconds || 0;
                    // Calculate calories from volume if not stored (5 kcal per kg of volume)
                    const sessionCalories = (session as any).calories_burned || Math.round(sessionVolume * 0.05);
                    const sessionDate = new Date(session.completed_at);

                    totalTime += sessionDuration;
                    totalCalories += sessionCalories;

                    // Parse exercises log
                    let exercisesLog = (session as any).exercises_log;
                    // Fallback for legacy structure
                    if (!Array.isArray(exercisesLog) || exercisesLog.length === 0) {
                        exercisesLog = (session as any).exercises;
                    }

                    if (Array.isArray(exercisesLog) && exercisesLog.length > 0) {
                        // Detailed log available
                        for (const exercise of exercisesLog) {
                            const exerciseName = (exercise.name || exercise.exercise_name || '').toLowerCase();
                            const targetMuscle = exercise.target_muscle || exercise.primary_muscle || '';
                            const musclesWorked = getMusclesFromExercise(exerciseName, targetMuscle);

                            let exerciseVol = 0;
                            let exerciseSets = 0;

                            const setsData = exercise.sets_completed || exercise.sets;
                            if (Array.isArray(setsData)) {
                                exerciseSets = setsData.length;
                                exerciseVol = setsData.reduce((acc: number, set: any) => {
                                    const r = Number(set.reps || set.actual_reps || 0);
                                    const w = Number(set.weight || set.weight_kg || set.actual_weight_kg || 0);
                                    return acc + (r * w);
                                }, 0);
                            } else {
                                exerciseSets = Number(setsData) || 0;
                            }

                            // If session volume was 0 from DB, accumulate calculated volume
                            if ((session as any).total_volume === 0) {
                                sessionVolume += exerciseVol;
                            }

                            for (const m of musclesWorked) {
                                initMuscle(m);
                                muscleStats[m].volume += exerciseVol;
                                muscleStats[m].sets += exerciseSets;
                                muscleStats[m].sessions += 1;

                                // Update last trained date (since sessions are ordered desc, first met is latest)
                                if (!muscleStats[m].lastTrained || sessionDate > muscleStats[m].lastTrained!) {
                                    muscleStats[m].lastTrained = sessionDate;
                                }
                            }
                        }
                    } else {
                        // Simple session fallback
                        const workoutName = ((session as any).workout_name || '').toLowerCase();
                        const musclesFromName = getMusclesFromWorkoutName(workoutName);
                        for (const m of musclesFromName) {
                            initMuscle(m);
                            muscleStats[m].volume += sessionVolume; // Might be 0
                            muscleStats[m].sessions += 1;
                            if (!muscleStats[m].lastTrained || sessionDate > muscleStats[m].lastTrained!) {
                                muscleStats[m].lastTrained = sessionDate;
                            }
                        }
                    }

                    totalVolume += sessionVolume;
                    // Inject calculated volume back into session object for weekly view
                    (session as any).calculated_volume = sessionVolume;
                    (session as any).calculated_calories = sessionCalories;
                }

                // Weekly Data Calculation
                const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                const weekDataCalc: WeekData[] = [];

                for (let i = 6; i >= 0; i--) {
                    const d = new Date(now);
                    d.setDate(d.getDate() - i);
                    const dateStr = d.toISOString().split('T')[0];
                    const dayName = days[d.getDay()];

                    const daySessions = sessions.filter((s: any) => s.completed_at?.startsWith(dateStr));
                    const dayVolume = daySessions.reduce((sum: number, s: any) => sum + ((s as any).calculated_volume || s.total_volume || 0), 0);
                    // Calculate calories from volume if not stored
                    const dayCalories = daySessions.reduce((sum: number, s: any) => {
                        const vol = (s as any).calculated_volume || s.total_volume || 0;
                        return sum + ((s as any).calculated_calories || s.calories_burned || Math.round(vol * 0.05));
                    }, 0);

                    weekDataCalc.push({
                        day: dayName,
                        volume: dayVolume,
                        sessions: daySessions.length,
                        calories: dayCalories,
                        date: dateStr
                    });
                }

                // Comparison Logic
                const oneWeekAgo = new Date(now);
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                const twoWeeksAgo = new Date(now);
                twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

                const thisWeekWorkouts = sessions.filter((s: any) => new Date(s.completed_at) > oneWeekAgo).length;
                const lastWeekWorkouts = sessions.filter((s: any) => {
                    const d = new Date(s.completed_at);
                    return d > twoWeeksAgo && d <= oneWeekAgo;
                }).length;

                // Streak Logic
                let currentStreak = 0;
                let checkDate = new Date(now);
                // Check if trained today
                const trainedToday = sessions.some((s: any) => s.completed_at?.startsWith(now.toISOString().split('T')[0]));
                if (!trainedToday) {
                    // Check yesterday if not today
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

                // Final Format
                const muscleDataArray = Object.values(muscleStats)
                    .filter(m => m.sessions > 0)
                    .sort((a, b) => b.sessions - a.sessions); // Sort by frequency, or volume

                setMuscleData(muscleDataArray);
                setWeekData(weekDataCalc);
                setStats({
                    totalWorkouts,
                    totalVolume,
                    totalTime,
                    totalCalories,
                    avgSessionTime: totalWorkouts ? Math.round(totalTime / totalWorkouts) : 0,
                    currentStreak,
                    bestStreak: currentStreak, // Placeholder
                    thisWeekWorkouts,
                    lastWeekWorkouts
                });

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchProgress();
    }, [user]);

    // --- Helpers ---
    const getMusclesFromExercise = (exerciseName: string, targetMuscle: string): string[] => {
        const muscles: string[] = [];
        const name = exerciseName.toLowerCase();
        const target = targetMuscle.toLowerCase();

        const exerciseMuscleMap: Record<string, string[]> = {
            // Peito
            'supino': ['Peito'], 'crucifixo': ['Peito'], 'chest': ['Peito'],
            'flexão': ['Peito'], 'push up': ['Peito'], 'press': ['Peito'],
            'peck': ['Peito'], 'fly': ['Peito'],

            // Costas
            'remada': ['Costas'], 'puxada': ['Costas'], 'pulldown': ['Costas'],
            'barra fixa': ['Costas'], 'pull': ['Costas'], 'row': ['Costas'],
            'lat': ['Costas'], 'dorsal': ['Costas'], 'back': ['Costas'],

            // Ombros
            'desenvolvimento': ['Ombros'], 'elevação': ['Ombros'], 'shoulder': ['Ombros'],
            'lateral': ['Ombros'], 'frontal': ['Ombros'], 'militar': ['Ombros'],

            // Bíceps
            'rosca': ['Bíceps'], 'biceps': ['Bíceps'], 'curl': ['Bíceps'],

            // Tríceps
            'tríceps': ['Tríceps'], 'triceps': ['Tríceps'], 'testa': ['Tríceps'],
            'francês': ['Tríceps'], 'mergulho': ['Tríceps'], 'dip': ['Tríceps'],

            // Pernas - Quadríceps
            'agachamento': ['Quadríceps', 'Glúteos'], 'squat': ['Quadríceps'],
            'leg press': ['Quadríceps'], 'extensora': ['Quadríceps'], 'cadeira': ['Quadríceps'],

            // Pernas - Posteriores
            'flexora': ['Posteriores'], 'stiff': ['Posteriores', 'Glúteos'],
            'mesa': ['Posteriores'], 'leg curl': ['Posteriores'],

            // Panturrilha
            'panturrilha': ['Panturrilhas'], 'calf': ['Panturrilhas'],

            // Glúteos
            'glúteo': ['Glúteos'], 'hip': ['Glúteos'], 'elevação pélvica': ['Glúteos'],
            'coice': ['Glúteos'], 'ponte': ['Glúteos'],

            // Core
            'abdominal': ['Core'], 'prancha': ['Core'], 'crunch': ['Core'],
            'abs': ['Core'], 'plank': ['Core'], 'sit': ['Core'],
        };

        // Check exercise name
        for (const [key, val] of Object.entries(exerciseMuscleMap)) {
            if (name.includes(key)) muscles.push(...val);
        }

        // Check target muscle
        if (target) {
            if (target.includes('chest') || target.includes('peito') || target.includes('peitoral'))
                muscles.push('Peito');
            else if (target.includes('back') || target.includes('costas') || target.includes('dorsal'))
                muscles.push('Costas');
            else if (target.includes('shoulder') || target.includes('ombro') || target.includes('deltoide'))
                muscles.push('Ombros');
            else if (target.includes('bicep') || target.includes('bícep'))
                muscles.push('Bíceps');
            else if (target.includes('tricep') || target.includes('trícep'))
                muscles.push('Tríceps');
            else if (target.includes('quad') || target.includes('coxa'))
                muscles.push('Quadríceps');
            else if (target.includes('hamstring') || target.includes('posterior'))
                muscles.push('Posteriores');
            else if (target.includes('glute') || target.includes('glúteo'))
                muscles.push('Glúteos');
            else if (target.includes('calf') || target.includes('panturrilha'))
                muscles.push('Panturrilhas');
            else if (target.includes('abs') || target.includes('core') || target.includes('abdom'))
                muscles.push('Core');
            else if (target.includes('leg') || target.includes('perna'))
                muscles.push('Quadríceps'); // Generic leg -> Quadríceps
        }

        // Remove duplicates and return, fallback to 'Geral' instead of 'Outros'
        const uniqueMuscles = [...new Set(muscles)];
        return uniqueMuscles.length > 0 ? uniqueMuscles : ['Geral'];
    };

    const getMusclesFromWorkoutName = (name: string): string[] => {
        const n = name.toLowerCase();
        if (n.includes('full') || n.includes('todo')) return ['Peito', 'Costas', 'Pernas'];
        if (n.includes('upper') || n.includes('superior')) return ['Peito', 'Costas', 'Ombros'];
        if (n.includes('lower') || n.includes('inferior') || n.includes('perna')) return ['Quadríceps', 'Glúteos'];
        if (n.includes('peito')) return ['Peito'];
        if (n.includes('costas')) return ['Costas'];
        return ['Geral'];
    };

    const formatMetrics = (num: number) => {
        if (num >= 1000) return `${(num / 1000).toFixed(1)}t`;
        return `${num}kg`;
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const getRecoveryStatus = (lastTrained?: Date) => {
        if (!lastTrained) return {
            label: 'Disponível',
            color: '#10B981',
            bgColor: 'bg-green-500',
            icon: Battery,
            value: 100,
            gradient: 'from-green-500 to-emerald-600'
        };

        const now = new Date();
        const diffHours = (now.getTime() - lastTrained.getTime()) / (1000 * 60 * 60);

        // More granular recovery calculation
        if (diffHours < 12) return {
            label: 'Fadiga Extrema',
            color: '#DC2626',
            bgColor: 'bg-red-600',
            icon: BatteryLow,
            value: Math.max(5, Math.round((diffHours / 12) * 10)),
            gradient: 'from-red-600 to-red-700'
        };
        if (diffHours < 24) return {
            label: 'Fadiga Alta',
            color: '#EF4444',
            bgColor: 'bg-red-500',
            icon: BatteryLow,
            value: Math.round(10 + (diffHours - 12) / 12 * 20),
            gradient: 'from-red-500 to-orange-600'
        };
        if (diffHours < 48) return {
            label: 'Recuperando',
            color: '#F59E0B',
            bgColor: 'bg-orange-500',
            icon: BatteryMedium,
            value: Math.round(30 + (diffHours - 24) / 24 * 30),
            gradient: 'from-orange-500 to-yellow-500'
        };
        if (diffHours < 72) return {
            label: 'Quase Pronto',
            color: '#3B82F6',
            bgColor: 'bg-blue-500',
            icon: Battery,
            value: Math.round(60 + (diffHours - 48) / 24 * 30),
            gradient: 'from-blue-500 to-cyan-500'
        };
        return {
            label: 'Recuperado',
            color: '#10B981',
            bgColor: 'bg-green-500',
            icon: Zap,
            value: 100,
            gradient: 'from-green-500 to-emerald-600'
        };
    };

    const getRelativeTime = (date?: Date) => {
        if (!date) return 'Nunca';

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffHours < 1) return 'Agora mesmo';
        if (diffHours < 24) return `há ${diffHours}h`;
        if (diffDays === 1) return 'Ontem';
        if (diffDays < 7) return `há ${diffDays} dias`;
        if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} semanas`;
        return `há ${Math.floor(diffDays / 30)} meses`;
    };

    // Calculate chart scaling
    const maxVolume = Math.max(...weekData.map(d => d.volume), 100); // Minimum scale to avoid flatline at 0

    return (
        <div className="min-h-screen flex" style={{ background: '#0B0E14' }}>
            {/* Sidebar */}
            <aside className="hidden lg:flex flex-col w-56 p-5 border-r border-white/5" style={{ background: '#111318' }}>
                <div className="flex items-center gap-2 mb-10">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#3b82f6' }}>
                        <span className="text-white font-bold text-lg">Y</span>
                    </div>
                    <span className="text-white font-semibold text-lg">YouMove</span>
                </div>
                <nav className="flex flex-col gap-2">
                    {navItems.map((item) => (
                        <Link key={item.label} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.active ? 'text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`} style={item.active ? { background: '#3b82f6' } : {}}>
                            <item.icon size={20} strokeWidth={1.5} />
                            <span className="font-medium text-sm">{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 lg:p-8 pb-28 lg:pb-8 overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-white">Seu Progresso</h1>
                    <div className="bg-[#1F2937] p-1 rounded-xl flex">
                        <button className="px-4 py-2 rounded-lg text-sm bg-blue-500 text-white font-medium">7 Dias</button>
                        <button className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white">Mensal</button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-gray-400">Carregando dados...</p>
                    </div>
                ) : stats.totalWorkouts === 0 ? (
                    <div className="text-center py-20 bg-[#1F2937] rounded-3xl border border-white/5">
                        <TrendingUp size={48} className="text-gray-600 mx-auto mb-4" />
                        <h3 className="text-white font-bold text-lg mb-2">Sem dados ainda</h3>
                        <p className="text-gray-400 mb-6">Complete seu primeiro treino para desbloquear as métricas.</p>
                        <Link href="/workout" className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold transition-all">
                            <Dumbbell size={20} /> Começar Treino
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                            <div className="bg-[#1F2937] p-4 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-2 mb-2 text-blue-400">
                                    <Clock size={18} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Tempo Total</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{formatTime(stats.totalTime)}</p>
                            </div>
                            <div className="bg-[#1F2937] p-4 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-2 mb-2 text-purple-400">
                                    <Dumbbell size={18} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Volume Total</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{formatMetrics(stats.totalVolume)}</p>
                            </div>
                            <div className="bg-[#1F2937] p-4 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-2 mb-2 text-orange-400">
                                    <Flame size={18} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Sequência</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{stats.currentStreak} dias</p>
                            </div>
                            <div className="bg-[#1F2937] p-4 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-2 mb-2 text-green-400">
                                    <Activity size={18} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Treinos</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{stats.totalWorkouts}</p>
                            </div>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Volume Chart */}
                            <div className="bg-[#1F2937] p-6 rounded-3xl border border-white/5">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                        <Activity className="text-blue-500" size={20} />
                                        Volume Semanal
                                    </h3>
                                    <div className="text-xs text-gray-500 font-mono">
                                        KG x REPS x SETS
                                    </div>
                                </div>

                                <div className="relative h-48 w-full">
                                    {stats.totalVolume > 0 ? (
                                        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                            <defs>
                                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
                                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>

                                            {/* Grid Lines */}
                                            <line x1="0" y1="25" x2="100" y2="25" stroke="#ffffff10" strokeWidth="0.5" />
                                            <line x1="0" y1="50" x2="100" y2="50" stroke="#ffffff10" strokeWidth="0.5" />
                                            <line x1="0" y1="75" x2="100" y2="75" stroke="#ffffff10" strokeWidth="0.5" />

                                            {/* Area Path */}
                                            <path
                                                d={`M 0,100 ${weekData.map((d, i) =>
                                                    `L ${(i / 6) * 100},${100 - (d.volume / maxVolume) * 90}`
                                                ).join(' ')} L 100,100 Z`}
                                                fill="url(#chartGradient)"
                                            />

                                            {/* Line Path */}
                                            <path
                                                d={`M 0,${100 - (weekData[0].volume / maxVolume) * 90} ${weekData.map((d, i) =>
                                                    `L ${(i / 6) * 100},${100 - (d.volume / maxVolume) * 90}`
                                                ).join(' ')}`}
                                                fill="none"
                                                stroke="#3b82f6"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />

                                            {/* Points */}
                                            {weekData.map((d, i) => (
                                                <circle
                                                    key={i}
                                                    cx={(i / 6) * 100}
                                                    cy={100 - (d.volume / maxVolume) * 90}
                                                    r="1.5"
                                                    className="fill-[#1F2937] stroke-blue-500"
                                                    strokeWidth="1"
                                                />
                                            ))}
                                        </svg>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-600 text-sm">
                                            Sem dados de volume esta semana
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between mt-4">
                                    {weekData.map((d, i) => (
                                        <span key={i} className="text-[10px] uppercase text-gray-500 font-medium text-center w-8">
                                            {d.day}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Calorie Chart */}
                            <CalorieChart
                                data={weekData.map(d => ({
                                    day: d.day,
                                    calories: d.calories,
                                    date: d.date
                                }))}
                                totalCalories={stats.totalCalories}
                            />

                        </div>

                        {/* Muscle Status & Recovery */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-[#1F2937] p-6 rounded-3xl border border-white/5">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                        <Zap className="text-yellow-500" size={20} />
                                        Status de Recuperação
                                    </h3>
                                    <div className="group relative">
                                        <Info size={16} className="text-gray-500 hover:text-blue-400 cursor-help transition-colors" />
                                        <div className="absolute right-0 top-6 w-64 bg-[#111318] border border-white/10 rounded-xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 shadow-xl">
                                            <p className="text-xs text-gray-300 leading-relaxed">
                                                <span className="font-bold text-white">Como funciona:</span><br />
                                                • &lt;12h: Fadiga Extrema<br />
                                                • 12-24h: Fadiga Alta<br />
                                                • 24-48h: Recuperando<br />
                                                • 48-72h: Quase Pronto<br />
                                                • &gt;72h: Recuperado
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {muscleData.length > 0 ? muscleData.slice(0, 6).map((m, i) => {
                                        const status = getRecoveryStatus(m.lastTrained);
                                        const relativeTime = getRelativeTime(m.lastTrained);
                                        return (
                                            <div
                                                key={i}
                                                className="group relative bg-[#111318] hover:bg-[#1a1d24] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all duration-300"
                                            >
                                                <div className="flex items-center gap-4">
                                                    {/* Muscle Name & Date */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="text-white font-semibold text-sm">{m.muscle}</p>
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium">
                                                                {m.sessions}x
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 font-medium">
                                                            {relativeTime}
                                                            {m.lastTrained && (
                                                                <span className="ml-2 text-gray-600">
                                                                    • {new Date(m.lastTrained).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>

                                                    {/* Progress Bar */}
                                                    <div className="flex-1">
                                                        <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden relative">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${status.gradient}`}
                                                                style={{
                                                                    width: `${status.value}%`,
                                                                }}
                                                            >
                                                                <div className="h-full w-full bg-gradient-to-r from-white/20 to-transparent animate-pulse" />
                                                            </div>
                                                        </div>
                                                        <p className="text-[10px] text-gray-600 mt-1 text-right font-medium">
                                                            {status.value}% recuperado
                                                        </p>
                                                    </div>

                                                    {/* Status Badge */}
                                                    <div className="flex items-center gap-2 w-36 justify-end">
                                                        <status.icon size={18} style={{ color: status.color }} className="flex-shrink-0" />
                                                        <span className="text-xs font-bold whitespace-nowrap" style={{ color: status.color }}>
                                                            {status.label}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Tooltip on hover */}
                                                <div className="absolute left-0 top-full mt-2 w-full bg-[#0B0E14] border border-white/10 rounded-xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 shadow-xl">
                                                    <div className="grid grid-cols-3 gap-3 text-xs">
                                                        <div>
                                                            <p className="text-gray-500 mb-1">Volume</p>
                                                            <p className="text-white font-bold">{formatMetrics(m.volume)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500 mb-1">Séries</p>
                                                            <p className="text-white font-bold">{m.sets}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500 mb-1">Treinos</p>
                                                            <p className="text-white font-bold">{m.sessions}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <div className="text-center py-12 text-gray-500 text-sm bg-[#111318] rounded-xl border border-white/5">
                                            <Battery size={32} className="mx-auto mb-3 text-gray-600" />
                                            <p className="font-medium">Treine para ver o status dos músculos</p>
                                            <p className="text-xs text-gray-600 mt-1">Complete um treino para começar a monitorar sua recuperação</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-[#1F2937] p-6 rounded-3xl border border-white/5">
                                <h3 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
                                    <Activity className="text-purple-500" size={20} />
                                    Frequência por Músculo
                                </h3>

                                <MuscleHeatmap data={muscleData.map(m => ({ muscle: m.muscle, volume: m.volume, sessions: m.sessions }))} />
                            </div>
                        </div>

                        {/* Achievements Section */}
                        <div className="bg-[#1F2937] p-6 rounded-3xl border border-white/5">
                            <h3 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
                                <Trophy className="text-yellow-500" size={20} />
                                Conquistas
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {getBadges(stats).map((badge, idx) => (
                                    <div
                                        key={idx}
                                        className={`relative p-4 rounded-2xl border transition-all duration-300 ${badge.unlocked
                                            ? `${badge.bg} border-opacity-50`
                                            : 'bg-[#111318] border-white/5 grayscale opacity-60'
                                            }`}
                                    >
                                        <div className="flex flex-col items-center text-center gap-3">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${badge.unlocked ? 'bg-black/20' : 'bg-white/5'}`}>
                                                <badge.icon size={24} className={badge.unlocked ? badge.color : 'text-gray-500'} />
                                            </div>
                                            <div>
                                                <h4 className={`font-bold text-sm ${badge.unlocked ? 'text-white' : 'text-gray-400'}`}>
                                                    {badge.label}
                                                </h4>
                                                <p className="text-[10px] text-gray-500 mt-1">{badge.description}</p>
                                            </div>

                                            {/* Progress Bar for Locked Badges */}
                                            {!badge.unlocked && (
                                                <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500/50 rounded-full"
                                                        style={{ width: `${badge.progress}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                )}
            </main>

            {/* Mobile Nav */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 flex justify-around items-center py-4 border-t border-white/5 backdrop-blur-xl z-50" style={{ background: 'rgba(17, 19, 24, 0.95)' }}>
                {navItems.slice(0, 5).map((item) => (
                    <Link key={item.label} href={item.href} className={`flex flex-col items-center gap-1 px-3 py-1 min-w-[44px] justify-center ${item.active ? 'text-blue-500' : 'text-gray-500'}`}>
                        <item.icon size={22} strokeWidth={item.active ? 2 : 1.5} />
                        <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
                    </Link>
                ))}
            </nav>
        </div>
    );
}
