'use client';

/**
 * YOUMOVE - AI Coach Tip Component
 * 
 * Componente para exibir micro-dicas da IA durante a execução do treino
 * Design discreto e não-intrusivo
 */

import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface AICoachTipProps {
    tip: string;
    context?: string;
    onDismiss?: () => void;
    isLoading?: boolean;
}

export function AICoachTip({ tip, context, onDismiss, isLoading }: AICoachTipProps) {
    const { aiTipsEnabled } = useTheme();

    if (!aiTipsEnabled) return null;

    if (isLoading) {
        return (
            <div className="ai-coach-tip ai-coach-tip-loading">
                <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-purple-400 animate-pulse" />
                    <span className="text-xs text-gray-400">Coach pensando...</span>
                </div>
            </div>
        );
    }

    if (!tip) return null;

    return (
        <div className="ai-coach-tip animate-slide-up">
            <div className="flex items-start gap-3">
                <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Sparkles size={14} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium leading-relaxed">
                        {tip}
                    </p>
                    {context && context !== 'fallback' && (
                        <span className="text-[10px] text-purple-400 uppercase tracking-wider mt-1 block">
                            {context === 'rest' ? 'Descanso' :
                                context === 'start' ? 'Início' :
                                    context === 'finish' ? 'Última série' : 'Coach IA'}
                        </span>
                    )}
                </div>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                        <X size={12} className="text-gray-400" />
                    </button>
                )}
            </div>
        </div>
    );
}
