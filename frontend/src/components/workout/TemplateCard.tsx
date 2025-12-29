'use client';

import { Clock, Users, Dumbbell, Star, Flame, Zap, Award } from 'lucide-react';
import type { WorkoutTemplate } from '@/types/template.types';
import { TEMPLATE_CATEGORIES, DIFFICULTY_LEVELS } from '@/types/template.types';

interface TemplateCardProps {
    template: WorkoutTemplate;
    onClick: () => void;
}

export function TemplateCard({ template, onClick }: TemplateCardProps) {
    const categoryInfo = TEMPLATE_CATEGORIES[template.category];
    const difficultyInfo = DIFFICULTY_LEVELS[template.difficulty];

    const getDifficultyColorClass = (color: string) => {
        const colors: Record<string, string> = {
            green: 'bg-green-500/20 text-green-400 border-green-500/30',
            yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            red: 'bg-red-500/20 text-red-400 border-red-500/30'
        };
        return colors[color] || colors.green;
    };

    const getCategoryColorClass = (color: string) => {
        const colors: Record<string, string> = {
            red: 'from-red-600/20 to-red-900/20',
            purple: 'from-purple-600/20 to-purple-900/20',
            blue: 'from-blue-600/20 to-blue-900/20',
            orange: 'from-orange-600/20 to-orange-900/20',
            yellow: 'from-yellow-600/20 to-yellow-900/20',
            green: 'from-green-600/20 to-green-900/20'
        };
        return colors[color] || colors.blue;
    };

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

            {/* Header with Gradient */}
            <div className={`h-24 bg-gradient-to-br ${getCategoryColorClass(categoryInfo.color)} flex items-center justify-center relative`}>
                <span className="text-4xl">{categoryInfo.icon}</span>

                {/* Category Tag */}
                <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-sm text-xs font-medium text-white">
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
