'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import {
    Clock,
    Zap,
    Dumbbell,
    RotateCcw,
    Play,
    Save,
    Calendar,
    Target,
    Coffee,
    Flame,
    LayoutGrid,
    Utensils,
    User,
    ChevronLeft
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface AIExercise {
    exercise_id: string;
    exercise_name: string;
    sets: number;
    target_reps: number;
    rest_seconds: number;
    notes?: string;
}

interface AIWorkout {
    name: string;
    difficulty: string;
    estimated_duration_minutes: number;
    estimated_calories_burn?: number;
    focus_muscles: string[];
    exercises: AIExercise[];
    coach_tip: string;
}

interface AIWeeklyDay {
    day: string;
    is_rest: boolean;
    focus: string;
    workout?: AIWorkout;
}

interface AIWeeklyPlan {
    name: string;
    description: string;
    goal_focus: string;
    days: AIWeeklyDay[];
    estimated_weekly_calories?: number;
}

type WorkoutData = AIWorkout | AIWeeklyPlan;

export default function AIGeneratedWorkoutPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [data, setData] = useState<WorkoutData | null>(null);
    const [saving, setSaving] = useState(false);
    const [activeDayIndex, setActiveDayIndex] = useState(0);

    // Sidebar Items
    const navItems = [
        { icon: LayoutGrid, label: 'Dashboard', href: '/dashboard', active: false },
        { icon: Calendar, label: 'Histórico', href: '/history', active: false },
        { icon: Dumbbell, label: 'Treinos', href: '/workout', active: true },
        { icon: Utensils, label: 'Nutrição', href: '/nutrition', active: false },
        { icon: User, label: 'Perfil', href: '/profile', active: false },
    ];

    const isWeekly = (d: any): d is AIWeeklyPlan => 'days' in d;

    useEffect(() => {
        const stored = localStorage.getItem('generated_workout');
        if (stored) {
            try {
                setData(JSON.parse(stored));
            } catch (e) {
                console.error(e);
            }
        } else {
            router.push('/workout');
        }
    }, [router]);

    // Helpers - Use valid Supabase enum values:
    // chest, back, shoulders, biceps, triceps, forearms, core, quadriceps, hamstrings, glutes, calves, hip_flexors, full_body
    const translateMuscles = (muscles: string[]): string[] => {
        const validMuscles = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'core', 'full_body'];
        const mapping: Record<string, string | string[]> = {
            'peito': 'chest',
            'torax': 'chest',
            'tórax': 'chest',
            'costas': 'back',
            'dorsal': 'back',
            'dorsais': 'back',
            'ombros': 'shoulders',
            'ombro': 'shoulders',
            'deltoides': 'shoulders',
            'deltóides': 'shoulders',
            'biceps': 'biceps',
            'bíceps': 'biceps',
            'triceps': 'triceps',
            'tríceps': 'triceps',
            'pernas': 'quadriceps',      // Changed from 'legs'
            'perna': 'quadriceps',       // Changed from 'legs'
            'coxas': 'quadriceps',       // Changed from 'legs'
            'quadriceps': 'quadriceps',
            'quadríceps': 'quadriceps',
            'posteriores': 'hamstrings', // Changed from 'legs'
            'gluteos': 'glutes',
            'glúteos': 'glutes',
            'bumbum': 'glutes',
            'panturrilhas': 'calves',
            'panturrilha': 'calves',
            'abdomen': 'core',
            'abdômen': 'core',
            'abdominais': 'core',
            'abs': 'core',
            'core': 'core',
            'corpo todo': 'full_body',
            'full body': 'full_body',
            'braços': ['biceps', 'triceps'],
            'bracos': ['biceps', 'triceps'],
            'membros superiores': ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
            'membros inferiores': ['quadriceps', 'hamstrings', 'glutes', 'calves']  // Changed from ['legs', 'glutes']
        };

        const converted = muscles.flatMap(m => {
            const lower = m.toLowerCase().trim();
            // Check if valid english already
            if (validMuscles.includes(lower)) return [lower];

            // Check exact map
            const mapped = mapping[lower];
            if (Array.isArray(mapped)) return mapped;
            if (mapped) return [mapped];

            // Fallback: try partial match
            if (lower.includes('peito')) return ['chest'];
            if (lower.includes('costas')) return ['back'];
            if (lower.includes('perna')) return ['quadriceps']; // DB enum uses 'quadriceps', not 'legs'
            if (lower.includes('braço')) return ['biceps', 'triceps'];

            return []; // Remove unknown to avoid db error
        });

        // Ensure unique values and fallback if empty
        const unique = [...new Set(converted)];
        return unique.length > 0 ? unique : ['full_body'];
    };

    const saveWorkoutToDb = async (workoutData: AIWorkout, nameSuffix = '') => {
        if (!user) throw new Error('Usuário não autenticado');

        // Map exercises to match the structure expected by DB JSON or application logic
        const mappedExercises = workoutData.exercises.map(ex => ({
            id: Math.random().toString(36).substring(2, 9), // Generate a temp ID like 'new' page does
            name: ex.exercise_name,
            exercise_name: ex.exercise_name, // Redundancy for safety
            sets: ex.sets,
            reps: ex.target_reps,
            target_reps: ex.target_reps, // Redundancy
            weight_kg: 0,
            rest_seconds: ex.rest_seconds,
            is_cardio: false, // Explicitly false for weight training
            notes: ex.notes
        }));

        const payload = {
            user_id: user.id,
            name: nameSuffix ? `${data?.name} - ${nameSuffix}` : workoutData.name,
            difficulty: ['beginner', 'intermediate', 'advanced', 'elite'].includes(workoutData.difficulty.toLowerCase()) ? workoutData.difficulty.toLowerCase() : 'intermediate',
            workout_type: 'custom',
            target_muscles: translateMuscles(workoutData.focus_muscles || []),
            exercises: mappedExercises,
            is_ai_generated: true,
            avg_duration_minutes: workoutData.estimated_duration_minutes,
        };

        const { data: inserted, error } = await supabase.from('workouts').insert(payload).select().single();

        if (error) {
            console.error('Supabase Error Details:', error);
            throw error;
        }
        return inserted.id;
    };

    const handleSave = async () => {
        if (!data || !user) return;
        setSaving(true);
        console.log('Iniciando salvamento...', data);

        try {
            if (isWeekly(data)) {
                // Save Weekly Plan (Insert multiple workouts)
                console.log('Salvando plano semanal...');
                for (const day of data.days) {
                    if (!day.is_rest && day.workout) {
                        console.log('Inserindo dia:', day.day);
                        await saveWorkoutToDb(day.workout, day.day);
                    }
                }
                alert('Plano semanal salvo na biblioteca com sucesso!');
            } else {
                // Save Single Workout
                console.log('Salvando treino único...');
                await saveWorkoutToDb(data);
                alert('Treino salvo na biblioteca com sucesso!');
            }

            localStorage.removeItem('generated_workout');
            router.replace('/workout');
        } catch (err: any) {
            console.error('Erro ao salvar:', err);
            alert(`Erro ao salvar: ${err.message || 'Verifique o console para detalhes'}`);
        } finally {
            setSaving(false);
        }
    };

    const handleStartNow = async () => {
        if (!data || !user || isWeekly(data)) return;
        setSaving(true);
        try {
            console.log('💾 Salvando treino antes de iniciar...', data);
            const id = await saveWorkoutToDb(data);

            if (!id) throw new Error('Falha ao obter ID do treino salvo');

            console.log('✅ Treino salvo com ID:', id);
            console.log('🚀 Navegando para (hard):', `/active-session/${id}`);

            localStorage.removeItem('generated_workout');
            // Force hard navigation to ensure routing table is fresh
            window.location.href = `/active-session/${id}`;
        } catch (err: any) {
            console.error('❌ Erro ao iniciar:', err);
            alert(`Erro ao iniciar: ${err.message || 'Verifique o console'}`);
            setSaving(false);
        }
    };

    if (!data) return <div className="p-8 text-center text-gray-400">Carregando treino...</div>;

    const currentWorkout = isWeekly(data)
        ? data.days[activeDayIndex].workout
        : data;

    const isRestDay = isWeekly(data) && data.days[activeDayIndex].is_rest;

    // Force Blue Style Override (Exact match from valid page)
    const blueButtonStyle = {
        background: '#3b82f6',
        boxShadow: '0 0 30px rgba(59, 130, 246, 0.4)',
        border: 'none',
        color: 'white'
    };

    return (
        <div className="min-h-screen flex" style={{ background: '#0B0E14' }}>
            {/* Sidebar - Desktop Only */}
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
            <main className="flex-1 overflow-y-auto pb-40 lg:pb-32">
                <div className="p-4 lg:p-8">
                    <div className="mb-6 flex items-center gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            className="w-10 h-10 p-0 rounded-xl hover:bg-white/10"
                        >
                            <ChevronLeft size={24} />
                        </Button>
                        <h1 className="text-xl lg:text-2xl font-bold text-white">
                            {isWeekly(data) ? "Planejamento Semanal" : "Treino IA Gerado"}
                        </h1>
                    </div>

                    <div className="max-w-3xl mx-auto">
                        {/* Weekly Helper: Days Tabs */}
                        {isWeekly(data) && (
                            <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
                                {data.days.map((day, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveDayIndex(idx)}
                                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${activeDayIndex === idx
                                            ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20'
                                            : 'bg-[#1F2937] text-gray-400 border-transparent hover:bg-white/5'
                                            }`}
                                    >
                                        {day.day}
                                        {day.is_rest && <span className="ml-1 opacity-50">💤</span>}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Main Card */}
                        {isRestDay ? (
                            <div className="card mb-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 py-12 flex flex-col items-center text-center rounded-2xl border">
                                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4 animate-pulse">
                                    <Coffee size={40} className="text-green-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Dia de Descanso</h2>
                                <p className="text-gray-400 max-w-xs">
                                    A recuperação é onde o crescimento acontece. Aproveite para alongar, hidratar e dormir bem.
                                </p>
                                <div className="mt-6 px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-xs text-gray-300">
                                    Foco: {isWeekly(data) ? data.days[activeDayIndex].focus : 'Recuperação'}
                                </div>
                            </div>
                        ) : currentWorkout ? (
                            <>
                                <div className="card mb-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 rounded-2xl border p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                                                {isWeekly(data) ? `${data.name} - ${data.days[activeDayIndex].focus}` : 'Sugestão de Hoje'}
                                            </span>
                                            <h1 className="text-2xl font-bold mt-1 text-white">{currentWorkout.name}</h1>
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30 capitalize">
                                            {currentWorkout.difficulty}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-gray-300 mb-4">
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={16} className="text-blue-400" />
                                            {currentWorkout.estimated_duration_minutes} min
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Flame size={16} className="text-orange-400" />
                                            {currentWorkout.estimated_calories_burn || 300} kcal
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Dumbbell size={16} className="text-cyan-400" />
                                            {currentWorkout.exercises.length} ex
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {(currentWorkout.focus_muscles || []).map(m => (
                                            <span key={m} className="px-2 py-1 rounded-md bg-white/5 text-xs text-gray-300 border border-white/10">
                                                {m}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Coach Tip */}
                                {currentWorkout.coach_tip && (
                                    <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3">
                                        <Zap className="text-yellow-500 shrink-0" size={20} />
                                        <p className="text-sm text-yellow-100/80 italic">"{currentWorkout.coach_tip}"</p>
                                    </div>
                                )}

                                {/* Exercises List */}
                                <div className="space-y-4 mb-20 animate-in slide-in-from-bottom-4">
                                    <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                                        <Target size={20} className="text-blue-500" />
                                        Sequência
                                    </h2>

                                    {currentWorkout.exercises.map((ex, i) => (
                                        <div key={i} className="card flex items-start gap-4 hover:border-blue-500/30 transition-colors p-4 rounded-xl bg-[#1F2937] border border-white/5">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-black/30 border border-white/10 font-bold text-gray-400 shrink-0">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg mb-1 text-white">{ex.exercise_name}</h3>
                                                <div className="grid grid-cols-3 gap-2 mt-2">
                                                    <div className="bg-white/5 rounded-lg p-2 text-center">
                                                        <p className="text-[10px] text-gray-400 uppercase">Séries</p>
                                                        <p className="font-mono font-bold text-white">{ex.sets}</p>
                                                    </div>
                                                    <div className="bg-white/5 rounded-lg p-2 text-center">
                                                        <p className="text-[10px] text-gray-400 uppercase">Reps</p>
                                                        <p className="font-mono font-bold text-white">{ex.target_reps}</p>
                                                    </div>
                                                    <div className="bg-white/5 rounded-lg p-2 text-center">
                                                        <p className="text-[10px] text-gray-400 uppercase">Descanso</p>
                                                        <p className="font-mono font-bold text-white">{ex.rest_seconds}s</p>
                                                    </div>
                                                </div>
                                                {ex.notes && (
                                                    <p className="text-xs text-gray-400 mt-2 bg-black/20 p-2 rounded-lg border border-white/5 italic">
                                                        💡 {ex.notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-10 text-gray-500">Selecione um dia</div>
                        )}
                    </div>
                </div>
            </main>

            {/* Fixed Bottom Action - Adjusted for PWA Bottom Nav */}
            <div className={`fixed bottom-[80px] lg:bottom-0 right-0 p-5 bg-[#0B0E14]/95 border-t border-white/10 backdrop-blur-xl z-50 transition-all ${
                // If sidebar is visible (lg), adjust left position
                'lg:left-56 left-0'
                }`}>
                <div className="max-w-3xl mx-auto">
                    {!isWeekly(data) && !isRestDay && (
                        <Button
                            fullWidth
                            onClick={handleStartNow}
                            style={blueButtonStyle}
                            className="mb-3 font-bold text-lg h-14"
                        >
                            <Play size={20} /> Iniciar Agora
                        </Button>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            className="border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 h-12"
                        >
                            <RotateCcw size={18} /> Gerar Outro
                        </Button>
                        <Button
                            onClick={handleSave}
                            loading={saving}
                            className="text-white border border-white/10 h-12"
                            style={blueButtonStyle}
                        // Applied same blue style to Save button as requested by User (both blue)
                        >
                            <Save size={18} /> {isWeekly(data) ? 'Salvar Semana' : 'Salvar Treino'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
