'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Dumbbell,
    Clock,
    Plus,
    Check,
    Play,
    Zap,
    Trophy
} from 'lucide-react';

interface ScheduledWorkout {
    id: string;
    workout_id: string;
    workout_name: string;
    scheduled_date: string;
    scheduled_time: string;
    completed: boolean;
}

interface WorkoutSession {
    id: string;
    completed_at: string;
    workout_name: string;
}

interface UserWorkout {
    id: string;
    name: string;
    target_muscles: string[];
    avg_duration_minutes?: number;
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAYS_FULL = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function SchedulePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [completedDates, setCompletedDates] = useState<Set<string>>(new Set());
    const [availableWorkouts, setAvailableWorkouts] = useState<UserWorkout[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user || !supabase) {
                setLoading(false);
                return;
            }

            try {
                // 1. Get completed workout sessions
                const { data: sessions } = await supabase
                    .from('workout_sessions')
                    .select('completed_at, workout_name')
                    .eq('user_id', user.id);

                if (sessions) {
                    const dates = new Set<string>(
                        sessions.map((s: WorkoutSession) =>
                            new Date(s.completed_at).toDateString()
                        )
                    );
                    setCompletedDates(dates);
                }

                // 2. Get available workouts to find matches
                const { data: workouts } = await supabase
                    .from('workouts')
                    .select('id, name, target_muscles, avg_duration_minutes')
                    .eq('user_id', user.id)
                    .eq('is_archived', false);

                if (workouts) {
                    setAvailableWorkouts(workouts);
                }

            } catch (err) {
                console.error('Error fetching schedule data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    // --- Helpers ---
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        return { firstDay, daysInMonth };
    };

    const { firstDay, daysInMonth } = getDaysInMonth(currentDate);

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const isToday = (day: number) => {
        const today = new Date();
        return (
            today.getDate() === day &&
            today.getMonth() === currentDate.getMonth() &&
            today.getFullYear() === currentDate.getFullYear()
        );
    };

    const isSelected = (day: number) => {
        return (
            selectedDate &&
            selectedDate.getDate() === day &&
            selectedDate.getMonth() === currentDate.getMonth() &&
            selectedDate.getFullYear() === currentDate.getFullYear()
        );
    };

    const hasWorkout = (day: number) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        return completedDates.has(date.toDateString());
    };

    const handleDayClick = (day: number) => {
        setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    };

    // --- Weekly Plan Logic ---
    const getSuggestedWorkoutForDate = (date: Date | null) => {
        if (!date || availableWorkouts.length === 0) return null;

        const dayName = DAYS_FULL[date.getDay()].toLowerCase(); // e.g. "segunda-feira"
        const shortDayName = DAYS[date.getDay()].toLowerCase(); // e.g. "seg"

        // Find a workout that contains the day name (case insensitive)
        // Prioritize exact matches like " - Segunda-feira" suffix from AI generator
        return availableWorkouts.find(w => {
            const name = w.name.toLowerCase();
            return name.includes(`- ${dayName}`) ||
                name.includes(`(${dayName})`) ||
                name.includes(` ${dayName} `) ||
                (name.includes(shortDayName) && !name.includes('segundo')); // avoid false positive 'segundo'
        });
    };

    const suggestedWorkout = getSuggestedWorkoutForDate(selectedDate);
    const selectedDateString = selectedDate?.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });
    const selectedHasWorkout = selectedDate && completedDates.has(selectedDate.toDateString());
    const isFutureDate = selectedDate && selectedDate > new Date();

    return (
        <div className="pb-24 min-h-screen" style={{ background: '#0B0E14' }}>
            <div className="lg:hidden">
                <PageHeader title="Agenda" showBack />
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:flex items-center justify-between px-8 py-6 border-b border-white/5 bg-[#111318]">
                <div>
                    <h1 className="text-2xl font-bold text-white">Sua Agenda</h1>
                    <p className="text-gray-400 text-sm">Organize seus treinos e mantenha a consistência</p>
                </div>
                <div className="flex items-center gap-4">

                    <Button onClick={() => router.push('/workout')} variant="secondary" className="bg-transparent border border-white/10 text-gray-300 hover:text-white hover:bg-white/5">
                        <Plus size={18} className="mr-2" /> Novo Treino
                    </Button>
                </div>
            </div>

            <main className="px-5 py-6 max-w-5xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Calendar */}
                    <div className="lg:col-span-7">
                        {/* Calendar Controls */}
                        <div className="flex items-center justify-between mb-6">
                            <button
                                onClick={goToPreviousMonth}
                                className="w-10 h-10 rounded-xl bg-[#1F2937] hover:bg-[#374151] flex items-center justify-center border border-white/5 transition-colors text-white"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <CalendarIcon size={20} className="text-blue-500" />
                                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </h2>
                            <button
                                onClick={goToNextMonth}
                                className="w-10 h-10 rounded-xl bg-[#1F2937] hover:bg-[#374151] flex items-center justify-center border border-white/5 transition-colors text-white"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        {/* Calendar Grid */}
                        <div className="bg-[#1F2937] rounded-3xl p-6 border border-white/5 shadow-xl">
                            {/* Day Headers */}
                            <div className="grid grid-cols-7 gap-2 mb-4">
                                {DAYS.map((day) => (
                                    <div key={day} className="text-center text-xs font-bold text-gray-500 uppercase tracking-wider py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Days */}
                            <div className="grid grid-cols-7 gap-2">
                                {/* Empty cells */}
                                {Array.from({ length: firstDay }).map((_, i) => (
                                    <div key={`empty-${i}`} className="aspect-square" />
                                ))}

                                {/* Days of month */}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1;
                                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                                    const today = isToday(day);
                                    const selected = isSelected(day);
                                    const completed = hasWorkout(day);
                                    const hasSuggestion = getSuggestedWorkoutForDate(date);

                                    return (
                                        <button
                                            key={day}
                                            onClick={() => handleDayClick(day)}
                                            className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all relative border ${selected
                                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20 scale-105 z-10'
                                                : today
                                                    ? 'bg-[#374151] border-blue-500/50 text-white'
                                                    : 'bg-[#111318] border-white/5 text-gray-400 hover:bg-[#374151] hover:text-white'
                                                }`}
                                        >
                                            <span className={`font-bold ${today && !selected ? 'text-blue-400' : ''}`}>
                                                {day}
                                            </span>

                                            <div className="flex gap-1 mt-1">
                                                {completed && (
                                                    <div className={`w-1.5 h-1.5 rounded-full ${selected ? 'bg-white' : 'bg-green-500'}`} />
                                                )}
                                                {!completed && hasSuggestion && (
                                                    <div className={`w-1.5 h-1.5 rounded-full ${selected ? 'bg-blue-200' : 'bg-blue-500'}`} />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-4 mt-6">
                            <div className="bg-[#1F2937] p-4 rounded-2xl border border-white/5 text-center">
                                <Trophy className="text-yellow-500 mx-auto mb-2" size={20} />
                                <p className="text-2xl font-bold text-white">{completedDates.size}</p>
                                <p className="text-xs text-gray-500 uppercase font-bold">Total</p>
                            </div>
                            <div className="bg-[#1F2937] p-4 rounded-2xl border border-white/5 text-center">
                                <Check className="text-green-500 mx-auto mb-2" size={20} />
                                <p className="text-2xl font-bold text-white">
                                    {Array.from(completedDates).filter(d => {
                                        const date = new Date(d);
                                        return date.getMonth() === currentDate.getMonth() &&
                                            date.getFullYear() === currentDate.getFullYear();
                                    }).length}
                                </p>
                                <p className="text-xs text-gray-500 uppercase font-bold">Este Mês</p>
                            </div>
                            <div className="bg-[#1F2937] p-4 rounded-2xl border border-white/5 text-center">
                                <Zap className="text-blue-500 mx-auto mb-2" size={20} />
                                <p className="text-2xl font-bold text-white">{availableWorkouts.length}</p>
                                <p className="text-xs text-gray-500 uppercase font-bold">Disponíveis</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Selected Details */}
                    <div className="lg:col-span-5">
                        <div className="bg-[#1F2937] rounded-3xl p-6 border border-white/5 h-full relative overflow-hidden">
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                            <h3 className="font-bold text-xl text-white mb-1 capitalize border-b border-white/5 pb-4">
                                {selectedDateString || 'Selecione um dia'}
                            </h3>
                            <p className="text-sm text-gray-400 mb-6 mt-2 flex items-center gap-2">
                                <Clock size={14} />
                                {selectedDate?.toDateString() === new Date().toDateString() ? 'Hoje' : 'Selecionado'}
                            </p>

                            <div className="space-y-4 relative z-10">
                                {selectedHasWorkout ? (
                                    <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 flex gap-4 items-start">
                                        <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                                            <Check size={24} className="text-green-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-lg">Treino Concluído!</h4>
                                            <p className="text-green-200/80 text-sm">Ótimo trabalho mantendo a consistência.</p>
                                        </div>
                                    </div>
                                ) : suggestedWorkout ? (

                                    <div className="animate-in slide-in-from-right-4 fade-in duration-500">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider border border-blue-500/20">
                                                Sugerido
                                            </span>
                                            {isFutureDate && (
                                                <span className="text-gray-500 text-xs italic">Planejado para o futuro</span>
                                            )}
                                        </div>

                                        <div className="bg-[#111318] rounded-2xl p-5 border border-blue-500/30 hover:border-blue-500/50 transition-all group">
                                            <div className="flex justify-between items-start mb-4 cursor-pointer" onClick={() => {
                                                console.log('Navigating to session:', suggestedWorkout.id);
                                                if (suggestedWorkout.id) router.push(`/active-session/${suggestedWorkout.id}`);
                                            }}>
                                                <div>
                                                    <h3 className="text-white font-bold text-lg group-hover:text-blue-400 transition-colors">
                                                        {suggestedWorkout.name}
                                                    </h3>
                                                    <p className="text-gray-400 text-sm flex gap-2 mt-1">
                                                        <Clock size={16} /> {suggestedWorkout.avg_duration_minutes || 60} min
                                                    </p>
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                                                    <Play size={20} fill="currentColor" />
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {suggestedWorkout.target_muscles?.slice(0, 3).map((m: string) => (
                                                    <span key={m} className="text-xs bg-white/5 text-gray-300 px-2 py-1 rounded-md border border-white/5">
                                                        {m}
                                                    </span>
                                                ))}
                                                {(suggestedWorkout.target_muscles?.length || 0) > 3 && (
                                                    <span className="text-xs bg-white/5 text-gray-300 px-2 py-1 rounded-md border border-white/5">
                                                        +{(suggestedWorkout.target_muscles?.length || 0) - 3}
                                                    </span>
                                                )}
                                            </div>

                                            <Button
                                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/20"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    console.log('Starting workout:', suggestedWorkout.id);
                                                    if (suggestedWorkout.id) {
                                                        router.push(`/active-session/${suggestedWorkout.id}`);
                                                    } else {
                                                        alert('Erro: ID do treino não encontrado.');
                                                    }
                                                }}
                                            >
                                                Iniciar Treino
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-10 px-4 bg-[#111318] rounded-2xl border border-white/5 border-dashed">
                                        <div className="w-16 h-16 rounded-full bg-[#1F2937] flex items-center justify-center mx-auto mb-4">
                                            <CalendarIcon size={32} className="text-gray-600" />
                                        </div>
                                        <h4 className="text-white font-bold mb-2">Dia Livre</h4>
                                        <p className="text-gray-500 text-sm mb-6">Nenhum treino específico agendado para este dia.</p>


                                        <Button
                                            onClick={() => router.push('/workout')}
                                            variant="secondary"
                                            className="bg-transparent border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 w-full"
                                        >
                                            <Plus size={18} className="mr-2" /> Escolher Treino Manual
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
