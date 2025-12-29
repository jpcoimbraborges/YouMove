'use client';

/**
 * YOUMOVE - Workout Detail Page (Pre-Workout)
 * Design System: Deep Blue HUD
 * Concept: Heads-up Display - Clean, focused, immersive
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ExerciseImage } from '@/components/ExerciseImage';
import { ProgressionSuggestionCard } from '@/components/workout/ProgressionSuggestionCard';
import { analyzeWorkoutProgression } from '@/lib/progression/analyzer';
import { fetchWorkoutHistory, getUserFitnessLevel } from '@/lib/progression/data-fetcher';
import { useAuth } from '@/contexts/AuthContext';
import type { ProgressionSuggestion } from '@/lib/progression/analyzer';
import {
    Clock,
    Target,
    Play,
    Calendar,
    Dumbbell,
    Heart,
    Footprints,
    Zap,
    Bike,
    Waves,
    Flame,
    Activity,
    ArrowLeft,
    LayoutGrid,
    BarChart3,
    User,
    ChevronRight,
    TrendingUp
} from 'lucide-react';

//Navigation items for sidebar
const navItems = [
    { icon: LayoutGrid, label: 'Dashboard', href: '/dashboard', active: false },
    { icon: Calendar, label: 'Histórico', href: '/history', active: false },
    { icon: Dumbbell, label: 'Treinos', href: '/workout', active: true },
    { icon: BarChart3, label: 'Progresso', href: '/progress', active: false },
    { icon: User, label: 'Perfil', href: '/profile', active: false },
];

const cardioIcons: Record<string, React.ReactNode> = {
    walking: <Footprints size={20} />,
    running: <Zap size={20} />,
    cycling: <Bike size={20} />,
    swimming: <Waves size={20} />,
    hiit: <Flame size={20} />,
    jump_rope: <Activity size={20} />,
};

const cardioNames: Record<string, string> = {
    walking: 'Caminhada',
    running: 'Corrida',
    cycling: 'Ciclismo',
    swimming: 'Natação',
    hiit: 'HIIT',
    jump_rope: 'Pular Corda',
};

export default function WorkoutDetailPage() {
    const params = useParams();
    const rawId = params?.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const router = useRouter();
    const { user } = useAuth();
    const [workout, setWorkout] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [suggestions, setSuggestions] = useState<ProgressionSuggestion[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchWorkout = async () => {
            const { data, error } = await supabase
                .from('workouts')
                .select('*')
                .eq('id', id)
                .single();

            if (error) console.error(error);
            if (data) setWorkout(data);
            setLoading(false);
        };
        if (id) fetchWorkout();
    }, [id]);

    // Fetch progression suggestions
    useEffect(() => {
        const analyzeProgression = async () => {
            if (!workout || !user?.id || loadingSuggestions) return;

            setLoadingSuggestions(true);
            try {
                // Fetch workout history and analyze
                const histories = await fetchWorkoutHistory(user.id, workout.id);

                if (histories.length > 0) {
                    const userLevel = await getUserFitnessLevel(user.id);
                    const progressionSuggestions = analyzeWorkoutProgression(histories, userLevel);
                    setSuggestions(progressionSuggestions);
                }
            } catch (error) {
                console.error('Error analyzing progression:', error);
            } finally {
                setLoadingSuggestions(false);
            }
        };

        analyzeProgression();
    }, [workout, user]);

    // Handle applying a suggestion
    const handleApplySuggestion = async (suggestion: ProgressionSuggestion) => {
        if (!workout || !user?.id) return;

        try {
            // Update workout exercises with new suggestion
            const updatedExercises = (workout.exercises || []).map((ex: any) => {
                if (ex.id === suggestion.exercise_id || ex.exercise_id === suggestion.exercise_id ||
                    ex.name === suggestion.exercise_name || ex.exercise_name === suggestion.exercise_name) {
                    return {
                        ...ex,
                        sets: suggestion.suggested.sets,
                        reps: suggestion.suggested.reps,
                        target_reps: suggestion.suggested.reps,
                        weight_kg: suggestion.suggested.weight_kg,
                        target_weight_kg: suggestion.suggested.weight_kg
                    };
                }
                return ex;
            });

            // Update in database
            const { error } = await supabase
                .from('workouts')
                .update({ exercises: updatedExercises })
                .eq('id', workout.id)
                .eq('user_id', user.id);

            if (error) {
                console.error('Error applying suggestion:', error);
                alert('Erro ao aplicar sugestão');
                return;
            }

            // Update local state
            setWorkout({ ...workout, exercises: updatedExercises });

            // Remove suggestion from list
            setSuggestions(prev => prev.filter(s => s.exercise_id !== suggestion.exercise_id));

            // Success feedback
            alert('✅ Sugestão aplicada com sucesso!');
        } catch (error) {
            console.error('Error in handleApplySuggestion:', error);
            alert('Erro ao aplicar sugestão');
        }
    };

    // Handle dismissing a suggestion
    const handleDismissSuggestion = (exerciseId: string) => {
        setDismissedSuggestions(prev => new Set(prev).add(exerciseId));
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center" style={{ background: '#0B0E14' }}>
            <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                <p className="text-gray-400 text-sm">Carregando treino...</p>
            </div>
        </div>
    );

    if (!workout) return (
        <div className="h-screen flex items-center justify-center" style={{ background: '#0B0E14' }}>
            <div className="text-center">
                <Target size={48} className="mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 mb-4">Treino não encontrado.</p>
                <button
                    onClick={() => router.push('/workout')}
                    className="px-6 py-3 rounded-xl bg-blue-500 text-white font-medium"
                >
                    Voltar aos Treinos
                </button>
            </div>
        </div>
    );

    const allExercises = Array.isArray(workout.exercises) ? workout.exercises : [];
    const exercises = allExercises.filter((ex: any) => !ex.is_cardio);
    const cardioActivities = allExercises.filter((ex: any) => ex.is_cardio);
    const totalActivities = exercises.length + cardioActivities.length;

    return (
        <div className="h-screen flex overflow-hidden" style={{ background: '#0B0E14' }}>
            {/* Sidebar - Desktop Only */}
            <aside className="hidden lg:flex flex-col w-56 p-5 border-r border-white/5 flex-shrink-0" style={{ background: '#111318' }}>
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
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex-shrink-0 p-4 lg:p-6 border-b border-white/5" style={{ background: 'rgba(11, 14, 20, 0.95)' }}>
                    <div className="flex items-center gap-4 max-w-4xl mx-auto">
                        <button
                            onClick={() => router.back()}
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex-1">
                            <h1 className="text-xl lg:text-2xl font-bold text-white">{workout.name}</h1>
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                                <Calendar size={14} />
                                <span>Criado em {new Date(workout.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto pb-44 lg:pb-8">
                    <div className="p-4 lg:p-8 max-w-4xl mx-auto">

                        {/* Muscle Tags */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            {workout.target_muscles?.map((m: string) => (
                                <span
                                    key={m}
                                    className="px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                >
                                    {m}
                                </span>
                            ))}
                            {workout.type && (
                                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide ${workout.type === 'cardio'
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    : workout.type === 'mixed'
                                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                        : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                    }`}>
                                    {workout.type === 'cardio' ? 'Cardio' :
                                        workout.type === 'mixed' ? 'Misto' :
                                            workout.type === 'flexibility' ? 'Flex' : 'Força'}
                                </span>
                            )}
                        </div>

                        {/* Stats Bar - Floating Icons */}
                        <div className="flex items-center justify-around py-4 px-6 rounded-2xl border border-white/5 mb-6" style={{ background: '#1F2937' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10">
                                    <Clock size={20} className="text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-white">{workout.avg_duration_minutes || 45}</p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Minutos</p>
                                </div>
                            </div>
                            <div className="w-px h-10 bg-white/10" />
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-500/10">
                                    <Dumbbell size={20} className="text-cyan-400" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-white">{exercises.length}</p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Exercícios</p>
                                </div>
                            </div>
                            <div className="w-px h-10 bg-white/10" />
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10">
                                    <Heart size={20} className="text-red-400" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-white">{cardioActivities.length}</p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Cardio</p>
                                </div>
                            </div>
                        </div>

                        {/* Progression Suggestions */}
                        {suggestions.length > 0 && (
                            <div className="mb-6">
                                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <TrendingUp size={16} className="text-green-400" />
                                    Sugestões de Progressão
                                </h2>
                                <div className="space-y-4">
                                    {suggestions
                                        .filter(s => !dismissedSuggestions.has(s.exercise_id))
                                        .map((suggestion) => (
                                            <ProgressionSuggestionCard
                                                key={suggestion.exercise_id}
                                                suggestion={suggestion}
                                                onApply={handleApplySuggestion}
                                                onDismiss={() => handleDismissSuggestion(suggestion.exercise_id)}
                                            />
                                        ))
                                    }
                                </div>
                            </div>
                        )}

                        {/* Cardio Activities */}
                        {cardioActivities.length > 0 && (
                            <div className="mb-6">
                                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Heart size={16} className="text-red-400" />
                                    Atividades Cardio
                                </h2>
                                <div className="space-y-3">
                                    {cardioActivities.map((activity: any, i: number) => {
                                        const activityType = activity.cardio_type || activity.type || 'walking';
                                        return (
                                            <div
                                                key={i}
                                                className="p-4 rounded-2xl border border-red-500/20 flex items-center gap-4"
                                                style={{ background: '#1F2937' }}
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                                                    {cardioIcons[activityType] || <Activity size={20} />}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-white">{activity.exercise_name || cardioNames[activityType]}</h3>
                                                    <div className="flex gap-4 text-sm text-gray-400 mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={12} />
                                                            {activity.duration_minutes} min
                                                        </span>
                                                        {activity.distance_km && (
                                                            <span className="flex items-center gap-1">
                                                                <Target size={12} />
                                                                {activity.distance_km} km
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {activity.intensity && (
                                                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${activity.intensity === 'low' ? 'bg-green-500/10 text-green-400' :
                                                        activity.intensity === 'moderate' ? 'bg-yellow-500/10 text-yellow-400' :
                                                            'bg-red-500/10 text-red-400'
                                                        }`}>
                                                        {activity.intensity === 'low' ? 'Leve' :
                                                            activity.intensity === 'moderate' ? 'Moderado' : 'Intenso'}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Strength Exercises */}
                        {exercises.length > 0 && (
                            <div>
                                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Dumbbell size={16} className="text-blue-400" />
                                    Exercícios de Força
                                </h2>
                                <div className="space-y-3">
                                    {exercises.map((ex: any, i: number) => (
                                        <div
                                            key={i}
                                            className="p-4 rounded-2xl border border-white/5 flex items-start gap-4 hover:border-blue-500/30 transition-all"
                                            style={{ background: '#1F2937' }}
                                        >
                                            {/* Exercise Image with Number Overlay */}
                                            <div className="relative shrink-0">
                                                <ExerciseImage
                                                    exerciseName={ex.name || ex.exercise_name}
                                                    size="lg"
                                                    className="border border-white/5"
                                                />
                                                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
                                                    <span className="text-xs font-bold text-white">{i + 1}</span>
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-white text-lg">{ex.name || ex.exercise_name}</h3>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mt-1">
                                                    <span><strong className="text-white">{ex.sets}</strong> séries</span>
                                                    <span><strong className="text-white">{ex.reps || ex.target_reps}</strong> reps</span>
                                                    {(ex.weight_kg > 0 || ex.target_weight_kg > 0) && (
                                                        <span className="text-blue-400 font-medium">{ex.weight_kg || ex.target_weight_kg}kg</span>
                                                    )}
                                                    <span><strong className="text-white">{ex.rest_seconds}s</strong> descanso</span>
                                                </div>
                                                {ex.notes && (
                                                    <p className="text-xs text-gray-500 mt-2 italic">{ex.notes}</p>
                                                )}
                                            </div>

                                            <ChevronRight size={18} className="text-gray-600 shrink-0 mt-2" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {totalActivities === 0 && (
                            <div className="text-center py-16">
                                <Target size={48} className="mx-auto mb-4 text-gray-600" />
                                <p className="text-gray-500">Nenhuma atividade neste treino.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Start Button - Fixed at bottom, above mobile nav */}
                <div
                    className="fixed bottom-20 lg:relative left-0 right-0 p-4 lg:p-6 border-t border-white/5 z-[100] flex-shrink-0"
                    style={{
                        background: 'rgba(11, 14, 20, 0.98)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)'
                    }}
                >
                    <div className="max-w-4xl mx-auto">
                        <button
                            onClick={() => router.push(`/active-session/${id}`)}
                            className="w-full py-4 lg:py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] text-white"
                            style={{
                                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                                boxShadow: '0 0 40px rgba(59, 130, 246, 0.4)'
                            }}
                        >
                            <Play size={24} fill="currentColor" />
                            INICIAR SESSÃO
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
