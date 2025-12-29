'use client';

/**
 * YOUMOVE - AI Coach Hook
 * 
 * Hook para gerenciar dicas de IA durante a execução do treino
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface AITip {
    text: string;
    context: string;
    timestamp: number;
}

interface UseAICoachOptions {
    enabled?: boolean;
    tipDuration?: number; // milliseconds
    userLevel?: 'beginner' | 'intermediate' | 'advanced';
    userGoal?: string;
}

export function useAICoach(options: UseAICoachOptions = {}) {
    const {
        enabled = true,
        tipDuration = 8000,
        userLevel = 'intermediate',
        userGoal,
    } = options;

    const [tip, setTip] = useState<AITip | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const previousTipRef = useRef<string>('');
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Limpar timeout ao desmontar
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const fetchTip = useCallback(async (params: {
        exerciseName: string;
        exerciseNamePt?: string;
        targetMuscle?: string;
        equipment?: string;
        currentSet: number;
        totalSets: number;
        targetReps: number;
        weight?: number;
        context?: 'execution' | 'rest' | 'start' | 'finish';
    }) => {
        if (!enabled || isLoading) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/workout/coach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...params,
                    userLevel,
                    userGoal,
                    previousTip: previousTipRef.current,
                }),
            });

            if (!response.ok) {
                throw new Error('Erro ao buscar dica');
            }

            const data = await response.json();

            if (data.tip) {
                previousTipRef.current = data.tip;

                const newTip: AITip = {
                    text: data.tip,
                    context: data.context || params.context || 'execution',
                    timestamp: Date.now(),
                };

                setTip(newTip);

                // Auto-limpar após duração
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
                timeoutRef.current = setTimeout(() => {
                    setTip(null);
                }, tipDuration);
            }
        } catch (err) {
            console.error('AI Coach error:', err);
            setError(err instanceof Error ? err.message : 'Erro desconhecido');

            // Usar dica fallback
            const fallbackTips = [
                'Mantenha a postura correta. 🎯',
                'Respire de forma controlada. 💨',
                'Foco na contração muscular. 💪',
                'Controle o movimento. ⚡',
                'Você está indo muito bem! 🔥',
            ];

            setTip({
                text: fallbackTips[Math.floor(Math.random() * fallbackTips.length)],
                context: 'fallback',
                timestamp: Date.now(),
            });

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                setTip(null);
            }, tipDuration);
        } finally {
            setIsLoading(false);
        }
    }, [enabled, isLoading, userLevel, userGoal, tipDuration]);

    const dismissTip = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setTip(null);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        tip,
        isLoading,
        error,
        fetchTip,
        dismissTip,
        clearError,
    };
}
