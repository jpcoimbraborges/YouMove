'use client';

/**
 * YOUMOVE - Rest Timer Component (Premium v2)
 * 
 * Timer circular animado para período de descanso entre séries
 * Com visual premium, preview do próximo exercício e resumo do progresso
 */

import React, { useEffect } from 'react';
import { SkipForward, Timer, Flame, Dumbbell, TrendingUp, ChevronRight, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SetProgress {
    exerciseName: string;
    completedSets: number;
    totalSets: number;
}

interface RestTimerProps {
    timeRemaining: number;
    totalTime: number;
    onSkip: () => void;
    nextExerciseName?: string;
    aiTip?: string | null;
    currentSet?: number;
    totalSets?: number;
    currentExercise?: number;
    totalExercises?: number;
    exercisesProgress?: SetProgress[];
}

export function RestTimer({
    timeRemaining,
    totalTime,
    onSkip,
    nextExerciseName,
    aiTip,
    currentSet = 1,
    totalSets = 3,
    currentExercise = 1,
    totalExercises = 6,
    exercisesProgress = []
}: RestTimerProps) {
    const progress = totalTime > 0 ? (timeRemaining / totalTime) : 1;
    const circumference = 2 * Math.PI * 90;
    const strokeDashoffset = circumference * (1 - progress);
    const overallProgress = totalExercises > 0 ? (currentExercise / totalExercises) * 100 : 0;

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (timeRemaining === 0 && 'vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
        }
    }, [timeRemaining]);

    const isUrgent = timeRemaining <= 5;
    const isAlmostDone = timeRemaining <= 15;

    return (
        <div className="flex-1 flex flex-col animate-fade-in min-h-screen">
            {/* Header Progress */}
            <div className="px-5 pt-4 pb-2">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <Dumbbell size={16} />
                        </div>
                        <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wider">Exercício</span>
                            <div className="font-bold text-white">{currentExercise} de {totalExercises}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <TrendingUp size={16} />
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-gray-500 uppercase tracking-wider">Série</span>
                            <div className="font-bold text-white">{currentSet} de {totalSets}</div>
                        </div>
                    </div>
                </div>

                {/* Overall Progress Bar */}
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full transition-all duration-500"
                        style={{ width: `${overallProgress}%`, backgroundColor: 'var(--color-accent)' }}
                    />
                </div>
            </div>

            {/* Main Timer Area */}
            <div className="flex-1 flex flex-col items-center justify-center px-5">
                {/* Timer Circle */}
                <div className="relative mb-6">
                    {/* Glow Effect */}
                    <div className={`absolute inset-0 rounded-full blur-3xl transition-all duration-500 ${isUrgent ? 'animate-pulse' : 'opacity-20'
                        }`}
                        style={{ backgroundColor: isUrgent ? 'var(--color-accent)' : 'var(--color-accent-light)' }}
                    />

                    <svg className="w-56 h-56 rotate-[-90deg] relative z-10">
                        {/* Background Circle */}
                        <circle
                            cx="112"
                            cy="112"
                            r="90"
                            stroke="currentColor"
                            strokeWidth="10"
                            fill="transparent"
                            className="text-white/5"
                        />
                        {/* Progress Circle */}
                        <circle
                            cx="112"
                            cy="112"
                            r="90"
                            stroke="url(#timerGradient)"
                            strokeWidth="10"
                            fill="transparent"
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-linear"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                        />
                        <defs>
                            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{ stopColor: 'var(--color-accent)' }} />
                                <stop offset="100%" style={{ stopColor: 'var(--color-accent-light)' }} />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Center Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                        <div className="flex items-center gap-2 mb-1">
                            <Timer size={14} className={isUrgent ? 'animate-pulse' : 'text-gray-400'} style={isUrgent ? { color: 'var(--color-accent)' } : {}} />
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                Descanso
                            </span>
                        </div>
                        <span className={`text-5xl font-black font-mono tracking-tighter tabular-nums transition-all ${isUrgent ? 'scale-110 animate-pulse' : 'text-white'
                            }`}
                            style={isUrgent ? { color: 'var(--color-accent)' } : {}}
                        >
                            {formatTime(timeRemaining)}
                        </span>
                        <span className={`text-sm mt-1 transition-colors ${isUrgent ? 'font-bold' : isAlmostDone ? 'text-yellow-400' : 'text-gray-500'
                            }`}
                            style={isUrgent ? { color: 'var(--color-accent)' } : {}}
                        >
                            {isUrgent ? '🔥 Prepare-se!' : isAlmostDone ? 'Quase lá...' : 'Recupere o fôlego'}
                        </span>
                    </div>
                </div>

                {/* Skip Button */}
                <Button
                    onClick={onSkip}
                    className="w-full max-w-sm bg-accent text-black hover:brightness-110 py-4 text-lg rounded-2xl shadow-xl shadow-accent/20 font-bold border-0"
                    style={{ backgroundColor: 'var(--color-accent)', color: '#000000' }}
                >
                    <SkipForward size={22} className="mr-2" />
                    Pular Descanso
                </Button>
            </div>

            {/* Bottom Section - Next Exercise & AI Tip */}
            <div className="px-5 pb-8 space-y-3">
                {/* Next Exercise Preview */}
                {nextExerciseName && (
                    <div className="bg-gradient-to-r from-white/[0.03] to-white/[0.05] rounded-2xl p-4 border border-white/5 backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center border border-orange-500/20">
                                    <Zap size={20} className="text-orange-400" />
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                        <Flame size={10} className="text-orange-400" />
                                        Próximo Exercício
                                    </span>
                                    <p className="font-bold text-white text-lg">{nextExerciseName}</p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-gray-500" />
                        </div>
                    </div>
                )}

                {/* AI Tip */}
                {aiTip && (
                    <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl p-4 border border-purple-500/20 backdrop-blur-sm">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
                                <Sparkles size={14} />
                            </div>
                            <div>
                                <span className="text-[10px] text-purple-400 uppercase tracking-wider font-bold">Dica do Coach IA</span>
                                <p className="text-sm text-gray-300 mt-1 leading-relaxed italic">
                                    "{aiTip}"
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Exercise Progress Pills */}
                {exercisesProgress.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center pt-2">
                        {exercisesProgress.slice(0, 6).map((ex, i) => (
                            <div
                                key={i}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${ex.completedSets === ex.totalSets
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                                    : ex.completedSets > 0
                                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20'
                                        : 'bg-white/5 text-gray-500 border border-white/5'
                                    }`}
                            >
                                <span className="max-w-20 truncate">{ex.exerciseName}</span>
                                <span className="font-bold">{ex.completedSets}/{ex.totalSets}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
