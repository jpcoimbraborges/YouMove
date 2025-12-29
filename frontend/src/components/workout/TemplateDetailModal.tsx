'use client';

import { useState } from 'react';
import {
    X, Clock, Dumbbell, Users, Play, Star, CheckCircle2, ChevronRight,
    TrendingUp, Activity, Flame, Zap, Move
} from 'lucide-react';
import type { WorkoutTemplate, TemplateExercise } from '@/types/template.types';
import { TEMPLATE_CATEGORIES, DIFFICULTY_LEVELS } from '@/types/template.types';

const CATEGORY_ICONS: Record<string, any> = {
    strength: Dumbbell,
    hypertrophy: TrendingUp,
    endurance: Activity,
    weight_loss: Flame,
    functional: Zap,
    flexibility: Move
};

interface TemplateDetailModalProps {
    template: WorkoutTemplate;
    onClose: () => void;
    onUseTemplate: (template: WorkoutTemplate) => Promise<void>;
}

export function TemplateDetailModal({ template, onClose, onUseTemplate }: TemplateDetailModalProps) {
    const [isUsing, setIsUsing] = useState(false);
    const [used, setUsed] = useState(false);

    const categoryInfo = TEMPLATE_CATEGORIES[template.category];
    const difficultyInfo = DIFFICULTY_LEVELS[template.difficulty];

    const handleUseTemplate = async () => {
        setIsUsing(true);
        try {
            await onUseTemplate(template);
            setUsed(true);
        } catch (error) {
            console.error('Error using template:', error);
        } finally {
            setIsUsing(false);
        }
    };

    const getDifficultyColorClass = (color: string) => {
        const colors: Record<string, string> = {
            green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            yellow: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            red: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
        };
        return colors[color] || colors.green;
    };

    const getCategoryStyles = (color: string) => {
        const styles: Record<string, { bg: string, icon: string, border: string }> = {
            red: { bg: 'bg-rose-500/10', icon: 'text-rose-400', border: 'border-rose-500/20' },
            purple: { bg: 'bg-violet-500/10', icon: 'text-violet-400', border: 'border-violet-500/20' },
            blue: { bg: 'bg-blue-500/10', icon: 'text-blue-400', border: 'border-blue-500/20' },
            orange: { bg: 'bg-orange-500/10', icon: 'text-orange-400', border: 'border-orange-500/20' },
            yellow: { bg: 'bg-amber-500/10', icon: 'text-amber-400', border: 'border-amber-500/20' },
            green: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400', border: 'border-emerald-500/20' }
        };
        return styles[color] || styles.blue;
    };

    const Icon = CATEGORY_ICONS[template.category] || Dumbbell;
    const styles = getCategoryStyles(categoryInfo.color);

    // Calculate total sets
    const totalSets = template.exercises.reduce((acc: number, ex: TemplateExercise) => acc + ex.sets, 0);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                className="relative w-full max-w-2xl max-h-[90vh] bg-[#111318] rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative p-6 border-b border-white/10">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-4 mb-4">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${styles.bg} ${styles.border}`}>
                            <Icon size={32} className={styles.icon} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDifficultyColorClass(difficultyInfo.color)}`}>
                                    {difficultyInfo.label}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-gray-300">
                                    {categoryInfo.label}
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold text-white">{template.name}</h2>
                        </div>
                    </div>

                    <p className="text-gray-400 mb-4">{template.description}</p>

                    {/* Quick Stats */}
                    <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 text-gray-300">
                            <Clock size={16} className="text-blue-400" />
                            <span>{template.duration_minutes} min</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                            <Dumbbell size={16} className="text-purple-400" />
                            <span>{template.exercises.length} exercícios</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                            <span className="text-orange-400 font-bold">{totalSets}</span>
                            <span>séries</span>
                        </div>
                        {template.uses_count > 0 && (
                            <div className="flex items-center gap-2 text-gray-500">
                                <Users size={16} />
                                <span>{template.uses_count} usos</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Exercises List */}
                <div className="flex-1 overflow-y-auto p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <div className="w-1 h-6 bg-blue-500 rounded-full" />
                        Exercícios
                    </h3>

                    <div className="space-y-3">
                        {template.exercises.map((exercise: TemplateExercise, index: number) => (
                            <div
                                key={index}
                                className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-400">
                                            {index + 1}
                                        </div>
                                        <span className="font-semibold text-white">{exercise.name}</span>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-600" />
                                </div>

                                <div className="flex items-center gap-4 ml-11 text-sm text-gray-400">
                                    <span className="text-blue-400 font-medium">{exercise.sets} séries</span>
                                    <span>×</span>
                                    <span className="text-purple-400 font-medium">{exercise.reps}</span>
                                    {exercise.rest_seconds > 0 && (
                                        <>
                                            <span className="text-gray-600">|</span>
                                            <span>{exercise.rest_seconds}s descanso</span>
                                        </>
                                    )}
                                </div>

                                {exercise.notes && (
                                    <p className="mt-2 ml-11 text-xs text-gray-500 italic">
                                        💡 {exercise.notes}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Equipment */}
                    {template.equipment_needed.length > 0 && (
                        <div className="mt-6">
                            <h4 className="text-sm font-medium text-gray-400 mb-2">Equipamentos necessários:</h4>
                            <div className="flex flex-wrap gap-2">
                                {template.equipment_needed.map((eq: string) => (
                                    <span key={eq} className="px-3 py-1 rounded-lg bg-white/5 text-sm text-gray-300 capitalize">
                                        {eq}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/10 flex gap-4">
                    <button
                        onClick={handleUseTemplate}
                        disabled={isUsing || used}
                        className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]
                            ${used
                                ? 'bg-green-500 text-white'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                            }`}
                    >
                        {used ? (
                            <>
                                <CheckCircle2 size={20} /> Adicionado aos Treinos!
                            </>
                        ) : isUsing ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Criando...
                            </>
                        ) : (
                            <>
                                <Play size={20} /> Usar Este Template
                            </>
                        )}
                    </button>
                    <button className="p-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-yellow-400 transition-colors border border-white/5">
                        <Star size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
