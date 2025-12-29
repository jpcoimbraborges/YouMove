'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { syncWorkoutSessions } from '@/lib/workout-sync';
import {
    Calendar,
    Clock,
    Dumbbell,
    TrendingUp,
    ChevronRight,
    ChevronLeft,
    Flame,
    Timer,
    Zap,
    X,
    Activity,
    LayoutGrid,
    Sparkles,
    Users,
    Utensils,
    RefreshCw,
} from 'lucide-react';

interface WorkoutSession {
    id: string;
    workout_name: string;
    completed_at: string;
    duration_seconds: number;
    total_sets: number;
    total_reps: number;
    total_volume: number;
    calories_burned?: number;
    exercises_log?: any[];
    exercises?: any[];
}

const navItems = [
    { icon: LayoutGrid, label: 'Dashboard', href: '/dashboard', active: false },
    { icon: Calendar, label: 'Histórico', href: '/history', active: true },
    { icon: TrendingUp, label: 'Progresso', href: '/progress', active: false },
    { icon: Sparkles, label: 'Treinos IA', href: '/workout?mode=ai', active: false },
    { icon: Utensils, label: 'Nutrição', href: '/nutrition', active: false },
    { icon: Users, label: 'Comunidade', href: '/community', active: false },
];

export default function HistoryPage() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [selectedDayWorkouts, setSelectedDayWorkouts] = useState<WorkoutSession[]>([]);
    const [stats, setStats] = useState({
        totalWorkouts: 0,
        weekWorkouts: 0,
        totalVolume: 0,
        totalTime: 0,
    });

    const fetchSessions = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            // Attempt to sync local pending sessions before fetching
            await syncWorkoutSessions();

            const { data, error } = await supabase
                .from('workout_sessions')
                .select('*')
                .eq('user_id', user.id)
                .order('completed_at', { ascending: false });

            if (error) throw error;

            const processed = (data || []).map((session: any) => ({
                ...session,
                // Map ACTUAL production DB columns to component expected fields
                // DB has: duration_seconds, total_sets, total_reps, total_volume
                workout_name: session.workout_name || 'Treino',
                duration_seconds: session.duration_seconds || 0, // Already in seconds
                total_volume: session.total_volume || 0,
                total_sets: session.total_sets || 0,
                total_reps: session.total_reps || 0,
                calories_burned: session.calories_burned || Math.round((session.total_volume || 0) * 0.05),
            }));

            setSessions(processed);

            // Stats
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const thisWeek = processed.filter((s: any) => s.completed_at && new Date(s.completed_at) > weekAgo).length;
            const volume = processed.reduce((sum: number, s: any) => sum + (s.total_volume || 0), 0);
            const time = processed.reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0);

            setStats({
                totalWorkouts: processed.filter((s: any) => s.completed_at).length, // Only count completed
                weekWorkouts: thisWeek,
                totalVolume: volume,
                totalTime: time,
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    // Calendar helpers
    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getCalendarDays = () => {
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = new Date(year, month, 1).getDay();

        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);

        return days;
    };

    const hasWorkoutOnDay = (day: number) => {
        if (!day) return false;
        return sessions.some(s => {
            const d = new Date(s.completed_at);
            return d.getDate() === day && d.getMonth() === calendarDate.getMonth() && d.getFullYear() === calendarDate.getFullYear();
        });
    };

    const handleDayClick = (day: number | null) => {
        if (!day) return;

        const workouts = sessions.filter(s => {
            const d = new Date(s.completed_at);
            return d.getDate() === day && d.getMonth() === calendarDate.getMonth() && d.getFullYear() === calendarDate.getFullYear();
        });

        setSelectedDay(day);
        setSelectedDayWorkouts(workouts);
    };

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

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
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.active
                                ? 'text-white shadow-lg shadow-blue-500/20'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                            style={item.active ? { background: '#3b82f6' } : {}}
                        >
                            <item.icon size={20} strokeWidth={1.5} />
                            <span className="font-medium text-sm">{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 lg:p-8 pb-28 lg:pb-8 overflow-y-auto">
                {/* Header with Refresh */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-white">Histórico</h1>
                    <button
                        onClick={() => { setLoading(true); fetchSessions(); }}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/5"
                        disabled={loading}
                        title="Sincronizar e Atualizar"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin text-blue-500" : ""} />
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
                    <div className="bg-[#1F2937] p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2 mb-2 text-blue-400">
                            <Dumbbell size={18} />
                            <span className="text-xs font-bold uppercase tracking-wider">Treinos</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{stats.totalWorkouts}</p>
                    </div>
                    <div className="bg-[#1F2937] p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2 mb-2 text-blue-400">
                            <Zap size={18} />
                            <span className="text-xs font-bold uppercase tracking-wider">Semana</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{stats.weekWorkouts}</p>
                    </div>
                    <div className="bg-[#1F2937] p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2 mb-2 text-purple-400">
                            <TrendingUp size={18} />
                            <span className="text-xs font-bold uppercase tracking-wider">Volume</span>
                        </div>
                        <p className="text-2xl font-bold text-white">
                            {stats.totalVolume > 0 ? (stats.totalVolume / 1000).toFixed(1) : '0'}{' '}
                            <span className="text-sm font-normal text-gray-400">t</span>
                        </p>
                    </div>
                    <div className="bg-[#1F2937] p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2 mb-2 text-cyan-400">
                            <Timer size={18} />
                            <span className="text-xs font-bold uppercase tracking-wider">Tempo</span>
                        </div>
                        <p className="text-2xl font-bold text-white">
                            {Math.floor(stats.totalTime / 3600)} <span className="text-sm font-normal text-gray-400">h</span>
                        </p>
                    </div>
                </div>

                {/* Calendar */}
                <div className="bg-[#1F2937] rounded-3xl p-6 border border-white/5">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-white capitalize">
                            {calendarDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    const newDate = new Date(calendarDate);
                                    newDate.setMonth(newDate.getMonth() - 1);
                                    setCalendarDate(newDate);
                                    setSelectedDay(null);
                                }}
                                className="p-2 rounded-lg bg-black/20 text-white hover:bg-black/40 transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={() => {
                                    const newDate = new Date(calendarDate);
                                    newDate.setMonth(newDate.getMonth() + 1);
                                    setCalendarDate(newDate);
                                    setSelectedDay(null);
                                }}
                                className="p-2 rounded-lg bg-black/20 text-white hover:bg-black/40 transition-colors"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Week Days Header */}
                    <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                        {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(day => (
                            <div key={day} className="text-xs text-gray-500 uppercase font-bold py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2">
                        {getCalendarDays().map((day, i) => {
                            const hasWorkout = day ? hasWorkoutOnDay(day) : false;
                            const isToday = day === new Date().getDate() &&
                                calendarDate.getMonth() === new Date().getMonth() &&
                                calendarDate.getFullYear() === new Date().getFullYear();

                            return (
                                <button
                                    key={i}
                                    onClick={() => handleDayClick(day)}
                                    disabled={!day}
                                    className={`
                                        aspect-square rounded-xl flex items-center justify-center text-sm font-medium relative
                                        transition-all duration-300
                                        ${!day ? 'invisible' : 'bg-black/20 hover:bg-black/40'}
                                        ${hasWorkout ? 'ring-2 ring-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]' : 'text-gray-400'}
                                        ${isToday && !hasWorkout ? 'ring-1 ring-gray-600' : ''}
                                        ${selectedDay === day ? 'scale-95 bg-blue-500/20' : ''}
                                    `}
                                >
                                    {day}
                                    {hasWorkout && (
                                        <div className="absolute inset-0 rounded-xl border-2 border-blue-500 animate-pulse" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Selected Day Modal/Panel */}
                {selectedDay && selectedDayWorkouts.length > 0 && (
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end lg:items-center justify-center p-4 pb-24 lg:pb-4 animate-in fade-in duration-200"
                        onClick={() => setSelectedDay(null)}
                    >
                        <div
                            className="bg-[#1F2937] rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-white/10 animate-in slide-in-from-bottom duration-300 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="sticky top-0 bg-[#1F2937] border-b border-white/5 p-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-white">
                                        {selectedDay} de {calendarDate.toLocaleDateString('pt-BR', { month: 'long' })}
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        {selectedDayWorkouts.length} treino(s) realizado(s)
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedDay(null)}
                                    className="w-10 h-10 rounded-xl bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Workouts List */}
                            <div className="p-6 space-y-4">
                                {selectedDayWorkouts.map((workout) => (
                                    <div key={workout.id} className="bg-black/20 rounded-2xl p-5 border border-white/5 hover:border-blue-500/30 transition-all">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h4 className="text-lg font-bold text-white mb-1">{workout.workout_name}</h4>
                                                <p className="text-xs text-gray-500">{formatTime(workout.completed_at)}</p>
                                            </div>
                                            <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/30">
                                                Completo
                                            </span>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                                    <Clock size={16} className="text-blue-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Tempo</p>
                                                    <p className="text-sm font-bold text-white">{formatDuration(workout.duration_seconds)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                                    <Dumbbell size={16} className="text-purple-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Séries</p>
                                                    <p className="text-sm font-bold text-white">{workout.total_sets}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                                                    <TrendingUp size={16} className="text-cyan-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Volume</p>
                                                    <p className="text-sm font-bold text-white">{workout.total_volume}kg</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                                    <Flame size={16} className="text-orange-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Calorias</p>
                                                    <p className="text-sm font-bold text-white">{workout.calories_burned || 0}</p>
                                                </div>
                                            </div>
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
                    <Link
                        key={item.label}
                        href={item.href}
                        className={`flex flex-col items-center gap-1 px-3 py-1 min-w-[44px] justify-center ${item.active ? 'text-blue-500' : 'text-gray-500'
                            }`}
                    >
                        <item.icon size={22} strokeWidth={item.active ? 2 : 1.5} />
                        <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
                    </Link>
                ))}
            </nav>
        </div>
    );
}
