'use client';

import { useState } from 'react';
import { TrendingUp, ChevronRight, Zap, Plus, Minus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { ProgressionSuggestion } from '@/lib/progression/analyzer';

interface ProgressionSuggestionCardProps {
    suggestion: ProgressionSuggestion;
    onApply: (suggestion: ProgressionSuggestion) => void;
    onDismiss: () => void;
}

export function ProgressionSuggestionCard({
    suggestion,
    onApply,
    onDismiss
}: ProgressionSuggestionCardProps) {
    const [isApplying, setIsApplying] = useState(false);

    const handleApply = async () => {
        setIsApplying(true);
        await onApply(suggestion);
        setIsApplying(false);
    };

    const getTypeIcon = () => {
        switch (suggestion.type) {
            case 'increase_weight':
                return <TrendingUp className="text-green-400" size={20} />;
            case 'increase_reps':
                return <Plus className="text-blue-400" size={20} />;
            case 'add_set':
                return <Plus className="text-purple-400" size={20} />;
            case 'deload':
                return <Minus className="text-yellow-400" size={20} />;
            case 'maintain':
                return <CheckCircle2 className="text-gray-400" size={20} />;
            default:
                return <Zap className="text-blue-400" size={20} />;
        }
    };

    const getTypeBadgeColor = () => {
        switch (suggestion.type) {
            case 'increase_weight':
                return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'increase_reps':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'add_set':
                return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'deload':
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'maintain':
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            default:
                return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        }
    };

    const getTypeLabel = () => {
        switch (suggestion.type) {
            case 'increase_weight':
                return 'Aumentar Carga';
            case 'increase_reps':
                return 'Mais Reps';
            case 'add_set':
                return 'Adicionar Série';
            case 'deload':
                return 'Deload';
            case 'maintain':
                return 'Manter';
            default:
                return 'Sugestão';
        }
    };

    const getConfidenceBadge = () => {
        const colors = {
            high: 'bg-green-500/10 text-green-400 border-green-500/20',
            medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
            low: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
        };

        const labels = {
            high: 'Alta Confiança',
            medium: 'Média Confiança',
            low: 'Baixa Confiança'
        };

        return (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors[suggestion.confidence]}`}>
                {labels[suggestion.confidence]}
            </span>
        );
    };

    const shouldShowApplyButton = suggestion.type !== 'maintain';

    return (
        <div className="rounded-2xl p-6 border border-white/10 shadow-lg relative overflow-hidden group"
            style={{ background: 'linear-gradient(145deg, #1c2128 0%, #0d1117 100%)' }}>

            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Header */}
            <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                        {getTypeIcon()}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            💡 Sugestão de Progressão
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">{suggestion.exercise_name}</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getTypeBadgeColor()}`}>
                        {getTypeLabel()}
                    </span>
                    {getConfidenceBadge()}
                </div>
            </div>

            {/* Current vs Suggested */}
            <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
                {/* Current */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Atual</p>
                    <div className="space-y-1">
                        <p className="text-sm text-white">
                            <span className="font-bold">{suggestion.current.sets}</span> séries
                        </p>
                        <p className="text-sm text-white">
                            <span className="font-bold">{suggestion.current.reps}</span> reps
                        </p>
                        <p className="text-sm text-white">
                            <span className="font-bold">{suggestion.current.weight_kg}</span> kg
                        </p>
                    </div>
                </div>

                {/* Suggested */}
                <div className="bg-gradient-to-br from-blue-500/10 to-green-500/10 rounded-xl p-4 border border-blue-500/20 relative">
                    {/* Arrow indicator */}
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/50">
                        <ChevronRight size={14} className="text-white" />
                    </div>

                    <p className="text-xs text-blue-400 uppercase tracking-wider mb-2 font-bold">Sugerido</p>
                    <div className="space-y-1">
                        <p className="text-sm text-white flex items-center gap-2">
                            <span className="font-bold">{suggestion.suggested.sets}</span> séries
                            {suggestion.change.sets_diff !== 0 && (
                                <span className="text-[10px] text-green-400">
                                    +{suggestion.change.sets_diff}
                                </span>
                            )}
                        </p>
                        <p className="text-sm text-white flex items-center gap-2">
                            <span className="font-bold">{suggestion.suggested.reps}</span> reps
                            {suggestion.change.reps_diff !== 0 && (
                                <span className="text-[10px] text-green-400">
                                    +{suggestion.change.reps_diff}
                                </span>
                            )}
                        </p>
                        <p className="text-sm text-white flex items-center gap-2">
                            <span className="font-bold">{suggestion.suggested.weight_kg}</span> kg
                            {suggestion.change.weight_diff_kg !== 0 && (
                                <span className={`text-[10px] ${suggestion.change.weight_diff_kg > 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                                    {suggestion.change.weight_diff_kg > 0 ? '+' : ''}{suggestion.change.weight_diff_kg}kg ({suggestion.change.weight_percent > 0 ? '+' : ''}{suggestion.change.weight_percent}%)
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* Reasoning */}
            <div className="bg-blue-500/5 rounded-xl p-4 mb-4 border border-blue-500/10 relative z-10">
                <div className="flex items-start gap-3">
                    {suggestion.type === 'deload' ? (
                        <AlertTriangle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                    ) : (
                        <Zap size={16} className="text-blue-400 shrink-0 mt-0.5" />
                    )}
                    <p className="text-sm text-gray-300 leading-relaxed">
                        {suggestion.reasoning}
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 relative z-10">
                {shouldShowApplyButton && (
                    <button
                        onClick={handleApply}
                        disabled={isApplying}
                        className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-500 hover:to-green-500 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isApplying ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Aplicando...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={18} />
                                Aplicar Sugestão
                            </>
                        )}
                    </button>
                )}
                <button
                    onClick={onDismiss}
                    className={`${shouldShowApplyButton ? '' : 'flex-1'} py-3 px-4 rounded-xl font-medium text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 active:scale-95`}
                >
                    {shouldShowApplyButton ? 'Ignorar' : 'Entendido'}
                </button>
            </div>
        </div>
    );
}
