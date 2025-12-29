'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
    Play,
    Pause,
    SkipForward,
    Check,
    Minus,
    Plus,
    Timer,
    Dumbbell,
    X,
    Trophy,
    Flame,
    MoreHorizontal
} from 'lucide-react';

interface Exercise {
    exercise_name: string;
    sets: number;
    target_reps: number;
    rest_seconds: number;
    notes?: string;
}

interface SetLog {
    setNumber: number;
    reps: number;
    weight: number;
    completed: boolean;
}

export default function ActiveWorkoutPage() {
    const params = useParams();
    const rawId = params?.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const router = useRouter();
    const { user } = useAuth();

    const [workout, setWorkout] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [currentSetIndex, setCurrentSetIndex] = useState(0);
    const [isResting, setIsResting] = useState(false);
    const [restTimeRemaining, setRestTimeRemaining] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [reps, setReps] = useState(0);
    const [weight, setWeight] = useState(0);
    const [showExitModal, setShowExitModal] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [setLogs, setSetLogs] = useState<SetLog[][]>([]);

    // Total progress calculation
    const currentCompletedSets = setLogs.flat().filter(s => s.completed).length;
    const totalWorkoutSets = workout?.exercises?.reduce((sum: number, ex: Exercise) => sum + ex.sets, 0) || 1;
    const workoutProgress = Math.min(100, (currentCompletedSets / totalWorkoutSets) * 100);

    // Fetch workout
    useEffect(() => {
        const fetchWorkout = async () => {
            if (!id) return;

            const { data, error } = await supabase
                .from('workouts')
                .select('*')
                .eq('id', id)
                .single();

            if (error) console.error(error);
            if (data) {
                setWorkout(data);
                // Initialize set logs
                const logs = data.exercises.map((ex: Exercise) =>
                    Array.from({ length: ex.sets }, (_, i) => ({
                        setNumber: i + 1,
                        reps: ex.target_reps,
                        weight: 0,
                        completed: false
                    }))
                );
                setSetLogs(logs);
                // Set initial reps
                if (data.exercises[0]) {
                    setReps(data.exercises[0].target_reps);
                }
            }
            setLoading(false);
        };
        fetchWorkout();
    }, [id]);

    // Rest timer
    useEffect(() => {
        if (!isResting || isPaused) return;

        const interval = setInterval(() => {
            setRestTimeRemaining(prev => {
                if (prev <= 1) {
                    setIsResting(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isResting, isPaused]);

    // Elapsed time
    useEffect(() => {
        if (!workout || isPaused) return;
        const interval = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
        return () => clearInterval(interval);
    }, [workout, isPaused]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleCompleteSet = useCallback(() => {
        if (!workout) return;

        const exercises = workout.exercises as Exercise[];
        const currentExercise = exercises[currentExerciseIndex];

        // Update set log
        const newLogs = [...setLogs];
        newLogs[currentExerciseIndex][currentSetIndex] = {
            setNumber: currentSetIndex + 1,
            reps,
            weight,
            completed: true
        };
        setSetLogs(newLogs);

        const isLastSet = currentSetIndex >= currentExercise.sets - 1;
        const isLastExercise = currentExerciseIndex >= exercises.length - 1;

        if (isLastSet && isLastExercise) {
            setShowCompleteModal(true);
            return;
        }

        if (isLastSet) {
            setCurrentExerciseIndex(prev => prev + 1);
            setCurrentSetIndex(0);
            const nextExercise = exercises[currentExerciseIndex + 1];
            setReps(nextExercise.target_reps);
            setWeight(0);
        } else {
            setCurrentSetIndex(prev => prev + 1);
            setIsResting(true);
            setRestTimeRemaining(currentExercise.rest_seconds);
        }
    }, [workout, currentExerciseIndex, currentSetIndex, reps, weight, setLogs]);

    const handleSkipRest = () => {
        setIsResting(false);
        setRestTimeRemaining(0);
    };

    const handleFinishWorkout = async () => {
        if (!user || !workout) {
            router.push('/dashboard');
            return;
        }

        try {
            const allSets = setLogs.flat().filter(s => s.completed);
            const totalSets = allSets.length;
            const totalReps = allSets.reduce((sum, s) => sum + s.reps, 0);
            const totalVolume = allSets.reduce((sum, s) => sum + (s.reps * s.weight), 0);
            const exercises = workout.exercises as Exercise[];
            const exercisesLog = exercises.map((ex, i) => ({
                exercise_name: ex.exercise_name,
                sets: setLogs[i]?.filter(s => s.completed) || []
            }));

            const { error } = await supabase.from('workout_sessions').insert({
                user_id: user.id,
                workout_id: id,
                workout_name: workout.name,
                started_at: new Date().toISOString(), // Simplified for now
                completed_at: new Date().toISOString(),
                duration_seconds: elapsedTime,
                total_sets: totalSets,
                total_reps: totalReps,
                total_volume: totalVolume,
                exercises_log: exercisesLog,
            });

            if (error) alert('Erro ao salvar sessão: ' + error.message);
            router.push('/dashboard');
        } catch (err) {
            console.error(err);
            router.push('/dashboard');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0A0F14]">
                <div className="animate-spin text-primary"><Timer size={32} /></div>
            </div>
        );
    }

    if (!workout) return null;

    const exercises = workout.exercises as Exercise[];
    const currentExercise = exercises[currentExerciseIndex];

    return (
        <div className="min-h-screen flex flex-col bg-[#0A0F14] text-white overflow-hidden relative">
            {/* Background Ambience */}
            <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/10 to-purple-900/10 pointer-events-none" />
            <div className="fixed -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar */}
            <div className="safe-top flex items-center justify-between px-6 py-4 z-10 backdrop-blur-sm bg-[#0A0F14]/80 text-white sticky top-0">
                <button onClick={() => setShowExitModal(true)} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors">
                    <X size={20} className="text-gray-400" />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-xs font-medium text-primary tracking-wider uppercase">
                        {workout.name}
                    </span>
                    <span className="font-mono text-xl font-bold tracking-tight">
                        {formatTime(elapsedTime)}
                    </span>
                </div>
                <button
                    onClick={() => setIsPaused(!isPaused)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isPaused ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-white/5 text-gray-400'
                        }`}
                >
                    {isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
                </button>
            </div>

            {/* Global Progress Bar */}
            <div className="h-1 bg-white/5 w-full z-10">
                <div
                    className="h-full bg-gradient-to-r from-primary via-blue-400 to-accent transition-all duration-700 ease-out"
                    style={{ width: `${workoutProgress}%` }}
                />
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex flex-col z-10 relative">
                {isResting ? (
                    /* REST SCREEN */
                    <div className="flex-1 flex flex-col items-center justify-center p-8 animate-fade-in text-center">
                        <div className="relative mb-10">
                            {/* Animated SVG Ring */}
                            <svg className="w-64 h-64 rotate-[-90deg]">
                                <circle
                                    cx="128" cy="128" r="120"
                                    stroke="currentColor" strokeWidth="8"
                                    fill="transparent" className="text-white/5"
                                />
                                <circle
                                    cx="128" cy="128" r="120"
                                    stroke="currentColor" strokeWidth="8"
                                    fill="transparent"
                                    strokeLinecap="round"
                                    className="text-primary transition-all duration-1000 ease-linear"
                                    strokeDasharray={2 * Math.PI * 120}
                                    strokeDashoffset={2 * Math.PI * 120 * (1 - restTimeRemaining / currentExercise.rest_seconds)}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-2">Descanso</span>
                                <span className="text-6xl font-black font-mono tracking-tighter tabular-nums">
                                    {formatTime(restTimeRemaining)}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4 w-full max-w-xs">
                            <Button
                                onClick={handleSkipRest}
                                className="w-full bg-white/10 hover:bg-white/20 text-white border-0 py-6 text-lg rounded-2xl backdrop-blur-md"
                            >
                                <SkipForward size={24} className="mr-2" />
                                Pular Descanso
                            </Button>

                            <div className="bg-[#1A202C]/50 rounded-2xl p-4 backdrop-blur-sm border border-white/5 text-center">
                                <p className="text-xs text-gray-400 uppercase mb-1">Próximo</p>
                                <p className="font-bold text-white line-clamp-1">
                                    {currentExercise.exercise_name}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* EXERCISE SCREEN */
                    <div className="flex-1 flex flex-col animate-slide-up">

                        {/* Exercise Header */}
                        <div className="px-6 py-6 text-center">
                            <h1 className="text-2xl font-bold mb-2 leading-tight text-white flex items-center justify-center gap-2">
                                {currentExercise.exercise_name}
                            </h1>
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-400 bg-white/5 w-fit mx-auto px-4 py-1 rounded-full backdrop-blur-sm border border-white/5">
                                <span>Exercício {currentExerciseIndex + 1}/{exercises.length}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-600" />
                                <span>Série {currentSetIndex + 1}/{currentExercise.sets}</span>
                            </div>
                        </div>

                        {/* Sets Indicator */}
                        <div className="px-6 mb-8">
                            <div className="flex justify-center gap-2 flex-wrap">
                                {Array.from({ length: currentExercise.sets }).map((_, i) => {
                                    const isDone = setLogs[currentExerciseIndex]?.[i]?.completed;
                                    const isCurrent = i === currentSetIndex;
                                    return (
                                        <div
                                            key={i}
                                            className={`
                                                h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg transition-all duration-300
                                                ${isDone
                                                    ? 'bg-green-500 text-black shadow-green-500/20'
                                                    : isCurrent
                                                        ? 'bg-primary text-white ring-2 ring-primary ring-offset-4 ring-offset-[#0A0F14] scale-110 z-10'
                                                        : 'bg-white/5 text-gray-500 border border-white/5'
                                                }
                                            `}
                                        >
                                            {isDone ? <Check size={18} strokeWidth={3} /> : i + 1}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Controls Container */}
                        <div className="flex-1 px-6 pb-6 flex flex-col justify-end gap-6">

                            {/* Inputs Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Reps Card */}
                                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex flex-col">
                                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <MoreHorizontal size={14} className="text-primary" />
                                        Repetições
                                    </span>
                                    <div className="flex items-center justify-between mt-auto">
                                        <button
                                            onClick={() => setReps(Math.max(0, reps - 1))}
                                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all text-white"
                                        >
                                            <Minus size={20} />
                                        </button>
                                        <span className="text-4xl font-bold font-mono tracking-tight">{reps}</span>
                                        <button
                                            onClick={() => setReps(reps + 1)}
                                            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 active:scale-90 transition-all text-white shadow-lg shadow-primary/30"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </div>

                                {/* Weight Card */}
                                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex flex-col">
                                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Dumbbell size={14} className="text-accent" />
                                        Carga (kg)
                                    </span>
                                    <div className="flex items-center justify-between mt-auto">
                                        <button
                                            onClick={() => setWeight(Math.max(0, weight - 2.5))}
                                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all text-white"
                                        >
                                            <Minus size={20} />
                                        </button>
                                        <span className="text-4xl font-bold font-mono tracking-tight">{weight}</span>
                                        <button
                                            onClick={() => setWeight(weight + 2.5)}
                                            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 active:scale-90 transition-all text-white shadow-lg shadow-primary/30"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Main Action Button */}
                            <Button
                                onClick={handleCompleteSet}
                                className="w-full py-6 text-lg rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98]"
                            >
                                <Check size={24} strokeWidth={3} className="mr-2" />
                                Concluir Série
                            </Button>

                        </div>
                    </div>
                )}
            </div>

            {/* Complete Modal */}
            {showCompleteModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
                    <div className="w-full max-w-md bg-[#1a1f2e] border border-white/10 rounded-[2rem] p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />

                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-orange-500/30 animate-bounce-slow">
                            <Trophy size={48} className="text-white filter drop-shadow-md" />
                        </div>

                        <h2 className="text-3xl font-black mb-2 text-white">Treino Completo!</h2>
                        <p className="text-gray-400 mb-8 font-medium">Você é incrível! 🔥</p>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                <p className="text-2xl font-black text-white">{currentCompletedSets}</p>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Séries</p>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                <p className="text-2xl font-black text-white">{formatTime(elapsedTime)}</p>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Tempo</p>
                            </div>
                        </div>

                        <Button onClick={handleFinishWorkout} fullWidth className="py-4 text-lg rounded-xl">
                            Finalizar e Salvar
                        </Button>
                    </div>
                </div>
            )}

            {/* Exit Modal */}
            {showExitModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowExitModal(false)}>
                    <div
                        className="w-full max-w-sm bg-[#1a1f2e] border border-white/10 rounded-3xl p-6 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-bold mb-2 text-center text-white">Já vai sair? 🥺</h2>
                        <p className="text-gray-400 text-center mb-6 text-sm">
                            Seu progresso neste treino será perdido se você sair agora.
                        </p>
                        <div className="flex flex-col gap-3">
                            <Button onClick={() => setShowExitModal(false)} fullWidth>
                                Continuar Treinando
                            </Button>
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="w-full py-3 text-red-400 font-medium text-sm hover:bg-white/5 rounded-xl transition-colors"
                            >
                                Sair mesmo assim
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
