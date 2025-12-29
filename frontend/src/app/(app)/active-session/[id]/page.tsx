'use client';

/**
 * YOUMOVE - Workout Session Page (Immersive Mode)
 * Design System: Deep Blue HUD
 * Architecture: Zustand Store + Offline First
 * 
 * Tela de execução focada com:
 * - Modo HUD (Heads-up Display) imersivo
 * - Integração total com useWorkoutSessionStore para persistência
 * - Recuperação automática de estado (refresh-proof)
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AICoachTip } from '@/components/workout/AICoachTip';
import { ExerciseGif } from '@/components/workout/ExerciseGif';
import { ExerciseImage } from '@/components/ExerciseImage';
import { useAICoach } from '@/hooks/useAICoach';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkoutSessionStore, useWorkoutTimer } from '@/store/workout-session-store';
import { SessionExercise, SetType } from '@/lib/workout-session';

export const dynamic = 'force-dynamic';
import {
    Play,
    Pause,
    Check,
    Minus,
    Plus,
    Timer,
    X,
    Trophy,
    Dumbbell,
    Flame,
    Zap,
    SkipForward,
    Sparkles,
    ChevronRight,
    Save
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Rest Timer Circle Component (Mantido da versão anterior)
function RestTimerCircle({
    timeRemaining,
    totalTime,
    onSkip,
    onAddTime,
    onSubtractTime,
    nextExerciseName,
    aiTip
}: {
    timeRemaining: number;
    totalTime: number;
    onSkip: () => void;
    onAddTime: () => void;
    onSubtractTime: () => void;
    nextExerciseName?: string;
    aiTip?: string | null;
}) {
    const progress = totalTime > 0 ? (timeRemaining / totalTime) : 1;
    const radius = 100;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);
    const isUrgent = timeRemaining <= 10;
    const strokeColor = isUrgent ? '#EF4444' : '#3B82F6';

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 animate-fade-in">
            {/* Rest Mode Header */}
            <div className="flex items-center gap-2 mb-6">
                <div
                    className="w-3 h-3 rounded-full animate-pulse"
                    style={{ background: '#22D3EE' }}
                />
                <span className="text-cyan-400 font-semibold uppercase tracking-wider text-sm">
                    Modo Descanso
                </span>
            </div>

            {/* Timer Circle */}
            <div className="relative mb-8">
                {/* Glow Effect */}
                <div
                    className={`absolute inset-0 rounded-full blur-2xl transition-all duration-500 ${isUrgent ? 'animate-pulse' : 'opacity-30'}`}
                    style={{ background: strokeColor }}
                />

                <svg width="240" height="240" className="relative z-10 -rotate-90">
                    <circle cx="120" cy="120" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="transparent" />
                    <circle
                        cx="120"
                        cy="120"
                        r={radius}
                        stroke={strokeColor}
                        strokeWidth="12"
                        fill="transparent"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-1000 ease-linear"
                        style={{ filter: `drop-shadow(0 0 10px ${strokeColor})` }}
                    />
                </svg>

                {/* Center Time Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                        className={`text-6xl font-black font-mono tracking-tight transition-all ${isUrgent ? 'animate-pulse scale-110' : ''}`}
                        style={{ color: isUrgent ? '#EF4444' : 'white' }}
                    >
                        {formatTime(timeRemaining)}
                    </span>
                    <span className={`text-sm mt-2 ${isUrgent ? 'text-red-400 font-bold' : 'text-gray-400'}`}>
                        {isUrgent ? '🔥 Prepare-se!' : 'Recuperando...'}
                    </span>
                </div>
            </div>

            {/* Time Adjustment Buttons */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onSubtractTime} className="w-14 h-14 rounded-full border-2 border-white/10 flex items-center justify-center text-gray-400 hover:bg-white/5 transition-all active:scale-95">
                    <span className="font-bold text-sm">-15s</span>
                </button>
                <button
                    onClick={onSkip}
                    className="px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-2 transition-all active:scale-95 text-[#0B0E14]"
                    style={{
                        background: 'linear-gradient(135deg, #22D3EE 0%, #06B6D4 100%)',
                        boxShadow: '0 0 30px rgba(34, 211, 238, 0.3)'
                    }}
                >
                    <SkipForward size={20} />
                    Pular Descanso
                </button>
                <button onClick={onAddTime} className="w-14 h-14 rounded-full border-2 border-white/10 flex items-center justify-center text-gray-400 hover:bg-white/5 transition-all active:scale-95">
                    <span className="font-bold text-sm">+15s</span>
                </button>
            </div>

            {/* AI Tip Toast */}
            {aiTip && (
                <div className="w-full max-w-md p-4 rounded-2xl flex items-start gap-3 mb-4 animate-slide-up bg-purple-500/10 border border-purple-500/20">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br from-purple-500 to-indigo-500">
                        <Sparkles size={14} className="text-white" />
                    </div>
                    <div>
                        <span className="text-[10px] text-purple-400 uppercase tracking-wider font-bold">Dica do Coach</span>
                        <p className="text-sm text-gray-300 mt-0.5 italic">"{aiTip}"</p>
                    </div>
                </div>
            )}

            {/* Next Exercise Preview */}
            {nextExerciseName && (
                <div className="w-full max-w-md p-4 rounded-2xl flex items-center justify-between bg-[#1F2937] border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/10">
                            <Zap size={20} className="text-blue-400" />
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">A Seguir</span>
                            <p className="font-bold text-white">{nextExerciseName}</p>
                        </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-500" />
                </div>
            )}
        </div>
    );
}

export default function WorkoutSessionPage() {
    const params = useParams();
    const rawId = params?.id;
    const workoutId = Array.isArray(rawId) ? rawId[0] : rawId;
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    // ============================================
    // STORE INTEGRATION
    // ============================================
    const {
        session,
        isActive,
        isPaused,
        currentExerciseIndex,
        currentSetIndex,
        elapsedSeconds,
        restTimeRemaining,
        isResting,
        showRPEModal,
        // Actions
        initSession,
        startNewSession,
        pause,
        resume,
        logSet,
        cancel,
        complete,
        tickTimer,
        startRestTimer,
        skipRestTimer,
        setRPE,
        setSessionRPE,
        setShowRPEModal,
        syncNow
    } = useWorkoutSessionStore();

    // Local input state (for the current set being edited)
    const [reps, setReps] = useState(12);
    const [weight, setWeight] = useState(0);
    const [initializing, setInitializing] = useState(true);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Timer Loop
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && !isPaused) {
            interval = setInterval(() => {
                tickTimer();
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, isPaused, tickTimer]);

    // ============================================
    // INITIALIZATION LOGIC
    // ============================================
    useEffect(() => {
        const initialize = async () => {
            // Wait for auth to complete loading
            if (authLoading) {
                console.log('⏳ Waiting for auth to complete...');
                return;
            }

            if (!user) {
                console.log('❌ No user found after auth loaded');
                setError('Você precisa estar logado para acessar esta página.');
                setInitializing(false);
                return;
            }

            if (!workoutId) {
                console.log('❌ No workout ID in URL');
                setError('ID do treino não fornecido na URL.');
                setInitializing(false);
                return;
            }

            console.log('🔍 Initializing session for workout ID:', workoutId);

            // 1. Try to recover existing session
            initSession();

            // Check if recovered session matches current URL
            const currentSession = useWorkoutSessionStore.getState().session; // Access fresh state

            if (currentSession && currentSession.workout_id === workoutId && currentSession.status !== 'completed' && currentSession.status !== 'cancelled') {
                console.log('🔄 Session recovered from storage');
                setInitializing(false);
                // Sync local inputs with current set target
                const currentEx = currentSession.exercises[currentSession.exercises.findIndex(e => !e.completed) || 0];
                const currentSet = currentEx?.sets.find(s => !s.completed);
                if (currentSet) {
                    setReps(currentSet.target_reps || 12);
                    setWeight(currentSet.actual_weight_kg || currentSet.target_weight_kg || 0);
                }
                return;
            }

            // 2. Determine if we generated a workout via AI (localStorage) or standard DB fetch
            // Check localStorage for generated workout first (priority for AI flow)
            const generatedWorkoutStr = localStorage.getItem('generated_workout');
            if (generatedWorkoutStr) {
                try {
                    const generatedWorkout = JSON.parse(generatedWorkoutStr);
                    // Verify if this generated workout matches the ID we are looking for (or is a temp ID)
                    // For AI flow, the ID in URL might be 'ai-generated' or a temp ID.
                    // If workoutId is a UUID, we should probably fetch from DB unless it matches

                    if (generatedWorkout.id === workoutId || workoutId === 'ai-generated' || workoutId === 'new') {
                        console.log('✨ Starting session from AI Generated Workout');

                        startNewSession({
                            user_id: user.id,
                            workout_name: generatedWorkout.name,
                            workout_id: generatedWorkout.id || 'ai-session',
                            exercises: generatedWorkout.exercises.map((ex: any) => ({
                                exercise_id: ex.exercise_id || ex.id, // Fallback
                                exercise_name: ex.exercise_name || ex.name,
                                muscle_group: ex.muscle_group || ex.target_muscle || 'general',
                                sets: Array.from({ length: ex.sets }).map(() => ({
                                    set_type: 'working',
                                    target_reps: ex.target_reps || ex.reps || 12,
                                    target_weight_kg: null,
                                    target_rest_seconds: ex.rest_seconds || 60
                                }))
                            }))
                        });
                        localStorage.removeItem('generated_workout'); // Clean up
                        setInitializing(false);
                        return;
                    }
                } catch (e) {
                    console.error('Error parsing generated workout', e);
                }
            }

            // 3. Fetch from Supabase (Standard Flow)
            console.log('📥 Fetching workout from Supabase...', workoutId);
            const { data: dbWorkout, error: dbError } = await supabase
                .from('workouts')
                .select('*')
                .eq('id', workoutId)
                .single();

            if (dbError) {
                console.error('❌ Database error:', dbError);
                setError(`Treino não encontrado no banco de dados. Erro: ${dbError.message}`);
                setInitializing(false);
                return;
            }

            if (!dbWorkout) {
                console.error('❌ Workout not found with ID:', workoutId);
                setError('Treino não encontrado. Verifique se o ID está correto.');
                setInitializing(false);
                return;
            }

            console.log('✅ Workout loaded:', dbWorkout.name);

            // Validate exercises structure
            if (!dbWorkout.exercises || !Array.isArray(dbWorkout.exercises)) {
                console.error('❌ Invalid exercises structure:', dbWorkout);
                setError('Estrutura de treino inválida. Os exercícios estão faltando ou corrompidos.');
                setInitializing(false);
                return;
            }

            if (dbWorkout.exercises.length === 0) {
                console.error('❌ No exercises in workout');
                setError('Este treino não contém exercícios.');
                setInitializing(false);
                return;
            }

            console.log('📋 Exercises found:', dbWorkout.exercises.length);

            // Map DB structure to Session Params
            try {
                startNewSession({
                    user_id: user.id,
                    workout_id: dbWorkout.id,
                    workout_name: dbWorkout.name,
                    exercises: dbWorkout.exercises.map((ex: any, idx: number) => {
                        console.log(`Mapping exercise ${idx + 1}:`, ex);

                        // Determine exercise name (multiple fallbacks)
                        const exerciseName = ex.exercise_name || ex.name;
                        if (!exerciseName) {
                            console.warn(`Exercise ${idx + 1} missing name, using fallback`);
                        }

                        // Determine number of sets
                        const numSets = ex.sets || 3;

                        return {
                            exercise_id: ex.exercise_id || ex.id || `exercise-${idx}`,
                            exercise_name: exerciseName || `Exercício ${idx + 1}`,
                            muscle_group: ex.muscle_group || ex.target_muscle || 'general',
                            sets: Array.from({ length: numSets }).map((_, setIdx) => ({
                                set_type: 'working' as const,
                                target_reps: ex.target_reps || ex.reps || 12,
                                target_weight_kg: null,
                                target_rest_seconds: ex.rest_seconds || 60
                            }))
                        };
                    })
                });

                // Set initial inputs
                if (dbWorkout.exercises?.[0]) {
                    setReps(dbWorkout.exercises[0].target_reps || dbWorkout.exercises[0].reps || 12);
                }

                setInitializing(false);
            } catch (mappingError) {
                console.error('❌ Error mapping exercises:', mappingError);
                setError('Erro ao processar estrutura do treino. Por favor, tente novamente.');
                setInitializing(false);
            }
        };

        if (initializing && !authLoading) {
            initialize();
        }
    }, [user, workoutId, initializing, authLoading, initSession, startNewSession, router]);


    // ============================================
    // AI COACH & UTILS
    // ============================================
    const { tip: aiTip, fetchTip, dismissTip } = useAICoach({
        enabled: true,
        tipDuration: 10000,
        userLevel: 'intermediate',
    });

    // Helper to format time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Helper to get GIF
    const getExerciseGifUrl = (name: string): string | undefined => {
        // Here we would use the GIF mapping logic, simplified for now
        // We can re-add the fetch logic if needed, but for now let's rely on standard mapping or null
        return undefined;
    };

    // ============================================
    // EVENT HANDLERS
    // ============================================

    const handleCompleteSet = () => {
        if (!session) return;

        // Log the set to store
        logSet({
            actual_reps: reps,
            actual_weight_kg: weight,
            difficulty: 'moderate' // Could be an input
        });

        // Haptics
        if ('vibrate' in navigator) navigator.vibrate(50);

        // Fetch AI tip for next context
        // Logic updates indices automatically in store, so we peek at the NEXT state
        // or just fetch generic tip. Since state update is async/batched, we wait or use current
        // For simplicity:
        dismissTip();

        // Update input defaults for next set (if any)
        // Note: Logic inside logSet handles transition to rest or next exercise
        // We rely on the Store's state update to re-render the UI with correct currentExercise/Set
    };

    // Update local inputs when session state changes (e.g. next exercise)
    useEffect(() => {
        if (session && isActive) {
            const ex = session.exercises[currentExerciseIndex];
            const set = ex?.sets[currentSetIndex];

            if (set) {
                // If it's a new set, reset inputs to target or previous values
                // Only if we haven't started typing (simplified here)
                setReps(set.target_reps || 12);
                setWeight(set.actual_weight_kg || set.target_weight_kg || weight); // Keep weight from prev set if null

                // Fetch AI tip
                if (!isResting) {
                    fetchTip({
                        exerciseName: ex.exercise_name,
                        targetMuscle: ex.muscle_group,
                        currentSet: currentSetIndex + 1,
                        totalSets: ex.sets.length,
                        targetReps: set.target_reps || 12,
                        context: 'start'
                    });
                }
            }
        }
    }, [currentExerciseIndex, currentSetIndex, session, isActive, isResting]);

    // Confetti effect when RPE modal opens (workout done)
    useEffect(() => {
        if (showRPEModal) {
            const duration = 2000;
            const end = Date.now() + duration;

            (function frame() {
                confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#3B82F6', '#22D3EE'] });
                confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#3B82F6', '#22D3EE'] });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            }());
        }
    }, [showRPEModal]);


    // ============================================
    // RENDER
    // ============================================

    // Error State
    if (error) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#0B0E14] p-6">
                <div className="max-w-md w-full bg-[#1F2937] rounded-3xl p-8 border border-red-500/20 text-center">
                    <X size={64} className="text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Erro ao Carregar Treino</h2>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.back()}
                            className="flex-1 px-6 py-3 bg-white/5 rounded-xl text-gray-300 hover:bg-white/10 transition-colors border border-white/10"
                        >
                            Voltar
                        </button>
                        <button
                            onClick={() => router.push('/workout')}
                            className="flex-1 px-6 py-3 bg-blue-600 rounded-xl text-white hover:bg-blue-500 transition-colors font-bold"
                        >
                            Ver Treinos
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (initializing || !session) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#0B0E14]">
                <div className="flex flex-col items-center gap-4">
                    <Timer size={48} className="text-blue-400 animate-pulse" />
                    <p className="text-gray-400">Sincronizando sessão...</p>
                </div>
            </div>
        );
    }

    const currentExercise = session.exercises[currentExerciseIndex];
    const nextExercise = session.exercises[currentExerciseIndex + 1];

    // Safety check
    if (!currentExercise) {
        // Should normally be handled by complete() or isResting check
        return null;
    }

    // Workout Complete / RPE Modal
    if (showRPEModal) {
        const handleRPEClick = async (val: number) => {
            try {
                setSessionRPE(val);
                // Give sync a moment, then redirect regardless
                await new Promise(resolve => setTimeout(resolve, 500));
                // Force navigation to dashboard
                window.location.href = '/dashboard';
            } catch (err) {
                console.error('Error completing session:', err);
                // Still redirect even on error
                window.location.href = '/dashboard';
            }
        };

        return (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6 text-center">
                <div className="w-full max-w-md bg-[#1F2937] rounded-3xl p-8 border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-cyan-500" />

                    <Trophy size={64} className="text-yellow-400 mx-auto mb-6 animate-bounce" />
                    <h2 className="text-3xl font-bold text-white mb-2">Treino Concluído!</h2>
                    <p className="text-gray-400 mb-8">Como foi a intensidade geral?</p>

                    <div className="grid grid-cols-5 gap-2 mb-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                            <button
                                key={val}
                                onClick={() => handleRPEClick(val)}
                                className="aspect-square rounded-xl bg-white/5 hover:bg-blue-500 hover:text-white text-gray-400 font-bold transition-all border border-white/10 focus:ring-2 ring-blue-500"
                            >
                                {val}
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-between text-xs text-gray-500 uppercase font-bold tracking-wider">
                        <span>Muito Leve</span>
                        <span>Extremo</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-[#0B0E14]">
            {/* Background Ambience */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl opacity-50" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl opacity-50" />
            </div>

            {/* Top Bar - HUD */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/5 z-10 bg-[#0B0E14]/90 backdrop-blur-sm">
                <button
                    onClick={() => cancel('Usuário saiu')} // Or open modal first
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
                >
                    <X size={20} className="text-gray-400" />
                </button>

                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest max-w-[150px] truncate">
                        {session.workout_name}
                    </span>
                    <div className="flex items-center gap-2">
                        <Timer size={14} className="text-gray-500" />
                        <span className="font-mono text-xl font-bold text-white tracking-tight">
                            {formatTime(elapsedSeconds)}
                        </span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => syncNow()} // Manual sync trigger
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-gray-400 hover:text-white"
                    >
                        <Save size={18} />
                    </button>
                    <button
                        onClick={() => isPaused ? resume() : pause()}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isPaused ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-white/5 text-gray-400'}`}
                    >
                        {isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} />}
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-white/5 flex-shrink-0 z-10">
                <div
                    className="h-full transition-all duration-700 ease-out bg-gradient-to-r from-blue-500 to-cyan-500"
                    style={{
                        width: `${Math.round(((currentExerciseIndex + (currentSetIndex / currentExercise.sets.length)) / session.exercises.length) * 100)}%`,
                    }}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden z-10 relative">
                {/* Pause Overlay */}
                {isPaused && (
                    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-white mb-2">Treino Pausado</h3>
                            <button onClick={resume} className="px-8 py-3 bg-blue-500 rounded-xl text-white font-bold hover:bg-blue-600 transition-all">
                                Retomar
                            </button>
                        </div>
                    </div>
                )}

                {isResting ? (
                    <RestTimerCircle
                        timeRemaining={restTimeRemaining}
                        totalTime={currentExercise.sets[currentSetIndex]?.target_rest_seconds || 60}
                        onSkip={skipRestTimer}
                        onAddTime={() => startRestTimer(restTimeRemaining + 15)}
                        onSubtractTime={() => startRestTimer(Math.max(0, restTimeRemaining - 15))}
                        nextExerciseName={currentSetIndex + 1 < currentExercise.sets.length ? currentExercise.exercise_name : nextExercise?.exercise_name}
                        aiTip={aiTip?.text}
                    />
                ) : (
                    <div className="flex-1 flex flex-col overflow-y-auto">
                        {/* Exercise Header */}
                        <div className="px-4 py-4 text-center flex-shrink-0 animate-fade-in-down">
                            <h1 className="text-2xl lg:text-3xl font-black text-white mb-2 leading-tight">
                                {currentExercise.exercise_name}
                            </h1>
                            <div className="flex items-center justify-center gap-3">
                                <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    Exercício {currentExerciseIndex + 1}/{session.exercises.length}
                                </span>
                                <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                    {currentExercise.sets[currentSetIndex]?.set_type === 'warmup' ? 'Aquecimento' : 'Série'} {currentSetIndex + 1}/{currentExercise.sets.length}
                                </span>
                            </div>
                        </div>

                        {/* Visual Area */}
                        <div className="px-4 mb-4 flex-shrink-0">
                            <div className="mx-auto rounded-3xl overflow-hidden border border-white/10 bg-[#1F2937] shadow-2xl shadow-blue-900/20 max-w-[280px] aspect-square flex items-center justify-center relative">
                                <ExerciseImage
                                    exerciseName={currentExercise.exercise_name}
                                    size="xl"
                                    className="w-full h-full object-cover"
                                />
                                {/* Optional: Show muscle group overlay */}
                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                    <p className="text-center text-xs text-gray-300 font-medium capitalize">{currentExercise.muscle_group}</p>
                                </div>
                            </div>
                        </div>

                        {/* AI Tip (if active during set) */}
                        {aiTip && (
                            <div className="px-4 mb-4 flex-shrink-0 animate-slide-up">
                                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-3">
                                    <Sparkles size={16} className="text-purple-400 shrink-0 mt-0.5" />
                                    <p className="text-sm text-gray-300 italic">"{aiTip.text}"</p>
                                    <button onClick={dismissTip} className="ml-auto text-gray-500"><X size={14} /></button>
                                </div>
                            </div>
                        )}

                        <div className="flex-1" />

                        {/* Controls */}
                        <div className="px-4 pb-8 space-y-4 flex-shrink-0">
                            {/* Inputs Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* REPS */}
                                <div className="rounded-2xl p-4 bg-[#1F2937] border border-white/5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Flame size={40} />
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2">Repetições</span>
                                    <div className="flex items-center justify-between">
                                        <button onClick={() => setReps(Math.max(0, reps - 1))} className="w-10 h-10 rounded-xl bg-black/20 text-white flex items-center justify-center hover:bg-white/10 transition-colors"><Minus size={18} /></button>
                                        <span className="text-3xl font-black text-white font-mono">{reps}</span>
                                        <button onClick={() => setReps(reps + 1)} className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"><Plus size={18} /></button>
                                    </div>
                                </div>

                                {/* WEIGHT */}
                                <div className="rounded-2xl p-4 bg-[#1F2937] border border-white/5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Dumbbell size={40} />
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2">Carga (kg)</span>
                                    <div className="flex items-center justify-between">
                                        <button onClick={() => setWeight(Math.max(0, weight - 1))} className="w-10 h-10 rounded-xl bg-black/20 text-white flex items-center justify-center hover:bg-white/10 transition-colors"><Minus size={18} /></button>
                                        <span className="text-3xl font-black text-white font-mono">{weight}</span>
                                        <button onClick={() => setWeight(weight + 1)} className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"><Plus size={18} /></button>
                                    </div>
                                </div>
                            </div>

                            {/* Main Action Button */}
                            <button
                                onClick={handleCompleteSet}
                                className="w-full py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-xl shadow-blue-600/30 ring-1 ring-white/10"
                            >
                                <Check size={28} strokeWidth={3} />
                                Concluir Série
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper: Pulse animation styles (already in global css usually but ensures functionality)
const styles = `
    @keyframes slide-up {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .animate-slide-up {
        animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }
`;
