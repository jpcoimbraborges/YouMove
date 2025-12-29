'use client';

import Image from 'next/image';
import { X, Clock, Flame, Beef, Droplets, Wheat, Share2, Heart, Plus, ChevronRight, ChefHat } from 'lucide-react';
import type { Recipe } from '@/types/recipe.types';
import { getRecipeImage } from '@/lib/recipes/image-mapping';

interface RecipeDetailModalProps {
    recipe: Recipe;
    onClose: () => void;
    onAddToDiary: (recipe: Recipe) => void;
}

export function RecipeDetailModal({ recipe, onClose, onAddToDiary }: RecipeDetailModalProps) {
    const imageUrl = getRecipeImage(recipe.name, recipe.image_url);

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-[#0e0f11] rounded-t-[2rem] sm:rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">

                {/* Header Image */}
                <div className="relative h-64 sm:h-72 shrink-0">
                    <Image
                        src={imageUrl}
                        alt={recipe.name}
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0e0f11] via-transparent to-black/60" />

                    {/* Floating Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-white/10 transition-colors z-20"
                    >
                        <X size={20} />
                    </button>

                    {/* Title Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                        <div className="flex flex-wrap gap-2 mb-3">
                            {recipe.tags.map(tag => (
                                <span key={tag} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 backdrop-blur-sm uppercase tracking-wider">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                            {recipe.name}
                        </h2>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-6 sm:p-8 space-y-8">

                        {/* Description & Times */}
                        <div className="flex flex-col sm:flex-row gap-6">
                            <div className="flex-1">
                                <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                                    {recipe.description}
                                </p>
                            </div>
                            <div className="flex gap-4 sm:flex-col sm:gap-2 min-w-[120px]">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Clock size={16} className="text-blue-500" />
                                    <span className="text-sm font-medium">{recipe.prep_time_minutes} min</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400">
                                    <ChefHat size={16} className="text-purple-500" />
                                    <span className="text-sm font-medium capitalize">{recipe.difficulty}</span>
                                </div>
                            </div>
                        </div>

                        {/* Macros Bar */}
                        <div className="p-4 rounded-2xl bg-[#18181b] border border-white/5 grid grid-cols-4 gap-2">
                            <div className="text-center border-r border-white/5 last:border-0">
                                <Flame size={18} className="text-orange-500 mx-auto mb-1" />
                                <span className="block text-lg font-bold text-white">{recipe.calories_per_serving}</span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase">Kcal</span>
                            </div>
                            <div className="text-center border-r border-white/5 last:border-0">
                                <Beef size={18} className="text-red-500 mx-auto mb-1" />
                                <span className="block text-lg font-bold text-white">{Math.round(recipe.protein_g_per_serving)}g</span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase">Prot</span>
                            </div>
                            <div className="text-center border-r border-white/5 last:border-0">
                                <Wheat size={18} className="text-yellow-500 mx-auto mb-1" />
                                <span className="block text-lg font-bold text-white">{Math.round(recipe.carbs_g_per_serving)}g</span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase">Carb</span>
                            </div>
                            <div className="text-center">
                                <Droplets size={18} className="text-blue-500 mx-auto mb-1" />
                                <span className="block text-lg font-bold text-white">{Math.round(recipe.fats_g_per_serving)}g</span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase">Gord</span>
                            </div>
                        </div>

                        {/* Ingredients */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Ingredientes
                            </h3>
                            <ul className="space-y-3">
                                {recipe.ingredients.map((ing, i) => (
                                    <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40 mt-2 shrink-0" />
                                        <span className="text-gray-300 text-sm">
                                            <strong className="text-white font-semibold">
                                                {ing.quantity} {ing.unit !== 'unidade' && ing.unit}
                                            </strong> {ing.name}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Instructions */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Preparo
                            </h3>
                            <div className="space-y-6 relative border-l border-white/10 ml-3 pl-8 pb-2">
                                {recipe.instructions.map((step, i) => (
                                    <div key={i} className="relative group">
                                        <div className="absolute -left-[39px] w-6 h-6 rounded-full bg-[#18181b] border-2 border-purple-500/50 text-xs font-bold flex items-center justify-center text-purple-400 group-hover:border-purple-400 group-hover:scale-110 transition-all">
                                            {i + 1}
                                        </div>
                                        <p className="text-gray-300 text-sm leading-relaxed group-hover:text-white transition-colors">
                                            {step}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 sm:p-6 pb-28 sm:pb-6 bg-[#0e0f11] border-t border-white/10 shrink-0">
                    <button
                        onClick={() => onAddToDiary(recipe)}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                    >
                        <Plus size={20} className="stroke-[3]" />
                        Adicionar ao Diário
                    </button>
                    {/* Secondary Actions (Future) */}
                    {/* <div className="flex justify-center gap-6 mt-4 opacity-60">
                         <button className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
                             <Heart size={14} /> Favoritar
                         </button>
                    </div> */}
                </div>

            </div>
        </div>
    );
}
