'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Clock, Flame, Beef, Zap, Utensils } from 'lucide-react';
import type { Recipe } from '@/types/recipe.types';
import { getDifficultyLabel } from '@/lib/recipes/utils';
import { getRecipeImage } from '@/lib/recipes/image-mapping';
import { getRecipeCategoryStyle } from '@/lib/recipes/category-mapping';

interface RecipeCardProps {
    recipe: Recipe;
    onClick: () => void;
}

export function RecipeCard({ recipe, onClick }: RecipeCardProps) {
    const imageUrl = getRecipeImage(recipe.name, recipe.image_url);
    const categoryStyle = getRecipeCategoryStyle(recipe.name);
    const [hasError, setHasError] = useState(false);

    // Reset error state when recipe/image changes
    useEffect(() => {
        setHasError(false);
    }, [imageUrl]);

    return (
        <div
            onClick={onClick}
            className="group relative rounded-3xl overflow-hidden bg-[#0e0f11] border border-white/5 
                       hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]
                       transition-all duration-500 cursor-pointer hover:-translate-y-1 active:scale-[0.98]"
        >
            {/* Image Section or Icon Fallback */}
            <div className="relative h-56 overflow-hidden bg-[#18181b]">
                {imageUrl && !hasError ? (
                    <Image
                        src={imageUrl}
                        alt={recipe.name}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        onError={() => setHasError(true)}
                    />
                ) : (
                    // Modern Gradient Icon Fallback
                    <div className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br ${categoryStyle.gradient}`}>
                        <div className={`
                            w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md 
                            flex items-center justify-center mb-3 
                            group-hover:scale-110 transition-transform duration-500 border border-white/10
                        `}>
                            <categoryStyle.icon size={40} className={`text-white drop-shadow-lg`} strokeWidth={1.5} />
                        </div>
                        <span className="text-white/60 text-xs font-medium tracking-wider uppercase">{categoryStyle.label}</span>
                    </div>
                )}

                {/* Overlay Gradient (ensure it's on top of image or fallback) */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0f11] via-[#0e0f11]/20 to-transparent pointer-events-none" />

                {/* Difficulty Badge */}
                <div className="absolute top-4 right-4">
                    <div className="px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md bg-black/60 border border-white/10 flex items-center gap-1.5 shadow-lg">
                        <div className={`w-1.5 h-1.5 rounded-full ${recipe.difficulty === 'easy' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' :
                            recipe.difficulty === 'medium' ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]' :
                                'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                            }`} />
                        <span className="text-white tracking-wide uppercase text-[10px]">
                            {getDifficultyLabel(recipe.difficulty)}
                        </span>
                    </div>
                </div>

                {/* Preparation Time Badge */}
                <div className="absolute top-4 left-4">
                    <div className="px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md bg-black/60 border border-white/10 flex items-center gap-1.5 text-gray-200 shadow-lg">
                        <Clock size={12} className="text-blue-400" />
                        <span>{recipe.prep_time_minutes} min</span>
                    </div>
                </div>
            </div>

            {/* Content Section (Overlapping the image slightly via negative margin or padding) */}
            <div className="relative p-5 -mt-12 z-10">
                {/* Title */}
                <h3 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-blue-400 transition-colors line-clamp-2">
                    {recipe.name}
                </h3>

                {/* Tags Scroller */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {recipe.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Macros Grid */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/5 group-hover:bg-white/[0.05] transition-colors">
                    {/* Calories */}
                    <div className="flex flex-col items-center justify-center border-r border-white/5">
                        <div className="flex items-center gap-1 mb-1">
                            <Flame size={12} className="text-orange-500" fill="currentColor" fillOpacity={0.2} />
                            <span className="text-[10px] text-gray-400 font-medium uppercase">Kcal</span>
                        </div>
                        <span className="text-white font-bold text-sm tracking-tight">{recipe.calories_per_serving}</span>
                    </div>

                    {/* Protein */}
                    <div className="flex flex-col items-center justify-center border-r border-white/5">
                        <div className="flex items-center gap-1 mb-1">
                            <Beef size={12} className="text-red-500" />
                            <span className="text-[10px] text-gray-400 font-medium uppercase">Prot</span>
                        </div>
                        <span className="text-white font-bold text-sm tracking-tight">{Math.round(recipe.protein_g_per_serving)}g</span>
                    </div>

                    {/* Carbs (or Score) */}
                    <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center gap-1 mb-1">
                            <Zap size={12} className="text-yellow-500" fill="currentColor" fillOpacity={0.2} />
                            <span className="text-[10px] text-gray-400 font-medium uppercase">Carb</span>
                        </div>
                        <span className="text-white font-bold text-sm tracking-tight">{Math.round(recipe.carbs_g_per_serving)}g</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
