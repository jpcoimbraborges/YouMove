'use client';

import Image from 'next/image';
import { Clock, Flame, Beef, ChefHat, Eye } from 'lucide-react';
import type { Recipe } from '@/types/recipe.types';
import { formatPrepTime, getDifficultyLabel, getDifficultyColor } from '@/lib/recipes/utils';

interface RecipeCardProps {
    recipe: Recipe;
    onClick: () => void;
}

export function RecipeCard({ recipe, onClick }: RecipeCardProps) {
    return (
        <div
            onClick={onClick}
            className="group rounded-2xl overflow-hidden border border-white/5 hover:border-blue-500/30 
                       transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-98"
            style={{ background: 'linear-gradient(145deg, #1c2128 0%, #111318 100%)' }}
        >
            {/* Image */}
            <div className="relative h-48 overflow-hidden bg-white/5">
                {recipe.image_url ? (
                    <Image
                        src={recipe.image_url}
                        alt={recipe.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                        <ChefHat size={48} className="text-gray-600" />
                    </div>
                )}

                {/* Difficulty badge */}
                <div className="absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-bold backdrop-blur-sm bg-black/40 border border-white/20"
                    style={{ color: getDifficultyColor(recipe.difficulty).replace('text-', '#') }}>
                    {getDifficultyLabel(recipe.difficulty)}
                </div>

                {/* Views */}
                {recipe.views > 0 && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg text-xs backdrop-blur-sm bg-black/40 border border-white/10">
                        <Eye size={12} className="text-gray-400" />
                        <span className="text-gray-300">{recipe.views}</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Title */}
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors">
                    {recipe.name}
                </h3>

                {/* Description */}
                {recipe.description && (
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                        {recipe.description}
                    </p>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {recipe.tags.slice(0, 3).map((tag) => (
                        <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        >
                            {tag}
                        </span>
                    ))}
                    {recipe.tags.length > 3 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-gray-500">
                            +{recipe.tags.length - 3}
                        </span>
                    )}
                </div>

                {/* Macros */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="flex flex-col items-center p-2 rounded-lg bg-white/5">
                        <Flame size={14} className="text-orange-400 mb-1" />
                        <span className="text-xs text-white font-bold">{recipe.calories_per_serving}</span>
                        <span className="text-[10px] text-gray-500">kcal</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-lg bg-white/5">
                        <Beef size={14} className="text-red-400 mb-1" />
                        <span className="text-xs text-white font-bold">{Math.round(recipe.protein_g_per_serving)}g</span>
                        <span className="text-[10px] text-gray-500">prot</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-lg bg-white/5">
                        <Clock size={14} className="text-blue-400 mb-1" />
                        <span className="text-xs text-white font-bold">
                            {recipe.prep_time_minutes ? `${recipe.prep_time_minutes}m` : 'N/A'}
                        </span>
                        <span className="text-[10px] text-gray-500">prep</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{recipe.servings} porç{recipe.servings > 1 ? 'ões' : 'ão'}</span>
                    <span className="text-blue-400 group-hover:text-blue-300 transition-colors font-medium">
                        Ver receita →
                    </span>
                </div>
            </div>
        </div>
    );
}
