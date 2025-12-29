'use client';

import {
    Clock,
    Users,
    Dumbbell,
    Star,
    Flame,
    Zap,
    Award,
    TrendingUp,
    Activity,
    Move
} from 'lucide-react';
import type { WorkoutTemplate } from '@/types/template.types';
import { TEMPLATE_CATEGORIES, DIFFICULTY_LEVELS } from '@/types/template.types';

const CATEGORY_ICONS: Record<string, any> = {
    strength: Dumbbell,
    hypertrophy: TrendingUp,
    endurance: Activity,
    weight_loss: Flame,
    functional: Zap,
    flexibility: Move
};

interface TemplateCardProps {
    template: WorkoutTemplate;
    onClick: () => void;
}

export function TemplateCard({ template, onClick }: TemplateCardProps) {
    const categoryInfo = TEMPLATE_CATEGORIES[template.category];
    const difficultyInfo = DIFFICULTY_LEVELS[template.difficulty];

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

    return (
        <div
            onClick={onClick}
            className="group rounded-2xl overflow-hidden border border-white/5 hover:border-blue-500/30 
                       transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-98 relative"
            style={{ background: 'linear-gradient(145deg, #1c2128 0%, #111318 100%)' }}
        >
            {/* Featured Badge */}
            {template.is_featured && (
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-bold text-yellow-400">Popular</span>
                </div>
            )}

            {/* Header - Now default background with colored icon */}
            <div className="h-32 bg-[#111318]/50 flex items-center justify-center relative p-6 group-hover:bg-[#111318] transition-colors duration-300">
                <div className={`p-4 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110 ${styles.bg} ${styles.border} ${styles.icon}`}>
                    <Icon size={32} strokeWidth={1.5} />
                </div>

                {/* Category Tag */}
                <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-[#1c2128] border border-white/5 text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                    {categoryInfo.label}
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Title + Difficulty */}
                <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-blue-300 transition-colors flex-1 pr-2">
                        {template.name}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border shrink-0 ${getDifficultyColorClass(difficultyInfo.color)}`}>
                        {difficultyInfo.label}
                    </span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                    {template.description}
                </p>

                {/* Muscles Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {template.target_muscles.slice(0, 3).map((muscle: string) => (
                        <span
                            key={muscle}
                            className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize"
                        >
                            {muscle}
                        </span>
                    ))}
                    {template.target_muscles.length > 3 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-gray-500">
                            +{template.target_muscles.length - 3}
                        </span>
                    )}
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-blue-400" />
                            <span>{template.duration_minutes}min</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Dumbbell size={14} className="text-purple-400" />
                            <span>{template.exercises.length} ex</span>
                        </div>
                    </div>

                    {template.uses_count > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Users size={12} />
                            <span>{template.uses_count}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
