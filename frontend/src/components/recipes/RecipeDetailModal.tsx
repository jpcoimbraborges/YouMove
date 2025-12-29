'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Clock, Flame, Beef, Wheat, Droplet, ChefHat, Plus, Star, CheckCircle2 } from 'lucide-react';
import type { Recipe, RecipeIngredient } from '@/types/recipe.types';
import { calculateMacroPercentages, formatPrepTime, getDifficultyLabel, getDifficultyColor } from '@/lib/recipes/utils';

interface RecipeDetailModalProps {
    recipe: Recipe;
    onClose: () => void;
    onAddToDiary?: (recipe: Recipe) => void;
}

export function RecipeDetailModal({ recipe, onClose, onAddToDiary }: RecipeDetailModalProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [added, setAdded] = useState(false);
    const macros = calculateMacroPercentages(recipe);

    const handleAddToDiary = async () => {
        if (!onAddToDiary) return;
        setIsAdding(true);
        try {
            await onAddToDiary(recipe);
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
        } catch (error) {
            console.error('Error adding to diary:', error);
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                className="relative w-full max-w-4xl max-h-[90vh] bg-[#111318] rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl border border-white/10"
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button Mobile */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-black/50 backdrop-blur-md rounded-full text-white md:hidden"
                >
                    <X size={20} />
                </button>

                {/* Left Side: Image & Quick Stats */}
                <div className="w-full md:w-2/5 h-64 md:h-auto relative bg-gray-900 shrink-0">
                    {recipe.image_url ? (
                        <Image
                            src={recipe.image_url}
                            alt={recipe.name}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900/40 to-purple-900/40">
                            <ChefHat size={64} className="text-white/20" />
                        </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-[#111318] to-transparent md:bg-gradient-to-r" />

                    <div className="absolute bottom-6 left-6 right-6">
                        <div className="flex flex-wrap gap-2 mb-3">
                            {recipe.meal_type.map((type: string) => (
                                <span key={type} className="px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-xs font-medium text-white capitalize">
                                    {type}
                                </span>
                            ))}
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2 leading-tight">{recipe.name}</h2>
                        <div className="flex items-center gap-4 text-sm text-gray-300">
                            <div className="flex items-center gap-1.5">
                                <Clock size={16} className="text-blue-400" />
                                <span>{formatPrepTime(recipe.prep_time_minutes)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <ChefHat size={16} className={getDifficultyColor(recipe.difficulty)} />
                                <span>{getDifficultyLabel(recipe.difficulty)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Details */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    {/* Header Desk */}
                    <div className="hidden md:flex justify-between items-start mb-6">
                        <div className="flex flex-wrap gap-2">
                            {recipe.tags.map((tag: string) => (
                                <span key={tag} className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-medium">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <p className="text-gray-400 mb-8 leading-relaxed">
                        {recipe.description}
                    </p>

                    {/* Macros Grid */}
                    <div className="grid grid-cols-4 gap-3 mb-8">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center">
                            <Flame size={20} className="text-orange-400 mb-2" />
                            <span className="text-xl font-bold text-white">{recipe.calories_per_serving}</span>
                            <span className="text-xs text-gray-500">kcal</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center">
                            <Beef size={20} className="text-red-400 mb-2" />
                            <span className="text-xl font-bold text-white">{recipe.protein_g_per_serving}g</span>
                            <span className="text-xs text-gray-500">Prot ({macros.protein_percent}%)</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center">
                            <Wheat size={20} className="text-yellow-400 mb-2" />
                            <span className="text-xl font-bold text-white">{recipe.carbs_g_per_serving}g</span>
                            <span className="text-xs text-gray-500">Carb ({macros.carbs_percent}%)</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center">
                            <Droplet size={20} className="text-purple-400 mb-2" />
                            <span className="text-xl font-bold text-white">{recipe.fats_g_per_serving}g</span>
                            <span className="text-xs text-gray-500">Gord ({macros.fats_percent}%)</span>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Ingredients */}
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <div className="w-1 h-6 bg-blue-500 rounded-full" />
                                Ingredientes
                            </h3>
                            <ul className="space-y-3">
                                {recipe.ingredients && recipe.ingredients.map((ing: RecipeIngredient, i: number) => (
                                    <li key={i} className="flex items-start justify-between py-2 border-b border-white/5 text-sm">
                                        <span className="text-gray-300">{ing.name}</span>
                                        <span className="text-gray-500 font-medium whitespace-nowrap ml-4">
                                            {ing.quantity && ing.quantity > 0 ? ing.quantity : ''} {ing.unit}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Instructions */}
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <div className="w-1 h-6 bg-green-500 rounded-full" />
                                Preparo
                            </h3>
                            <div className="space-y-4">
                                {recipe.instructions && recipe.instructions.map((step: string, i: number) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5">
                                            {i + 1}
                                        </div>
                                        <p className="text-sm text-gray-400 leading-relaxed">
                                            {step}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="mt-10 pt-6 border-t border-white/10 flex gap-4">
                        <button
                            onClick={handleAddToDiary}
                            disabled={isAdding || added || !onAddToDiary}
                            className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]
                                ${added
                                    ? 'bg-green-500 text-white'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                }`}
                        >
                            {added ? (
                                <>
                                    <CheckCircle2 size={20} /> Adicionado!
                                </>
                            ) : isAdding ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Adicionando...
                                </>
                            ) : (
                                <>
                                    <Plus size={20} /> Adicionar ao Diário
                                </>
                            )}
                        </button>
                        <button className="p-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-yellow-400 transition-colors border border-white/5">
                            <Star size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
