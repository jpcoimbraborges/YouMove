'use client';

import { Search, SlidersHorizontal, ChevronDown, Check } from 'lucide-react';
import type { RecipeFilters } from '@/types/recipe.types';

interface FiltersProps {
    filters: RecipeFilters;
    onChange: (filters: RecipeFilters) => void;
}

export function RecipeFiltersComponent({ filters, onChange }: FiltersProps) {
    const handleTagToggle = (tag: string) => {
        const currentTags = filters.tags || [];
        const newTags = currentTags.includes(tag)
            ? currentTags.filter((t: string) => t !== tag)
            : [...currentTags, tag];
        onChange({ ...filters, tags: newTags });
    };

    const mealTypes = [
        { id: 'breakfast', label: 'Café da Manhã' },
        { id: 'lunch', label: 'Almoço' },
        { id: 'dinner', label: 'Jantar' },
        { id: 'snack', label: 'Lanche' },
        { id: 'pre-workout', label: 'Pré-Treino' },
        { id: 'post-workout', label: 'Pós-Treino' },
    ];

    const popularTags = [
        'high-protein', 'low-carb', 'quick', 'vegetarian', 'gluten-free'
    ];

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                    type="text"
                    placeholder="Buscar receitas, ingredientes..."
                    value={filters.searchQuery || ''}
                    onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
                    className="w-full bg-[#1c2128] border border-white/5 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
            </div>

            {/* Quick Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {mealTypes.map((type) => (
                    <button
                        key={type.id}
                        onClick={() => onChange({
                            ...filters,
                            mealType: filters.mealType === type.id ? undefined : type.id
                        })}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border
                            ${filters.mealType === type.id
                                ? 'bg-blue-600 border-blue-500 text-white'
                                : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        {type.label}
                    </button>
                ))}
            </div>

            {/* Advanced Filters Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Goal Selector */}
                <select
                    value={filters.goalType || ''}
                    onChange={(e) => onChange({ ...filters, goalType: e.target.value || undefined })}
                    className="bg-[#1c2128] border border-white/5 rounded-xl p-3 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50"
                >
                    <option value="">🎯 Qualquer Objetivo</option>
                    <option value="cutting">Queima de Gordura</option>
                    <option value="bulking">Ganho de Massa</option>
                    <option value="balanced">Manutenção</option>
                </select>

                {/* Difficulty */}
                <select
                    value={filters.difficulty || ''}
                    onChange={(e) => onChange({ ...filters, difficulty: e.target.value as any || undefined })}
                    className="bg-[#1c2128] border border-white/5 rounded-xl p-3 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50"
                >
                    <option value="">👨‍🍳 Nível de Dificuldade</option>
                    <option value="easy">Fácil</option>
                    <option value="medium">Médio</option>
                    <option value="hard">Difícil</option>
                </select>

                {/* Max Prep Time */}
                <select
                    value={filters.maxPrepTime || ''}
                    onChange={(e) => onChange({ ...filters, maxPrepTime: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="bg-[#1c2128] border border-white/5 rounded-xl p-3 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50"
                >
                    <option value="">⏱️ Tempo de Preparo</option>
                    <option value="15">Até 15 min</option>
                    <option value="30">Até 30 min</option>
                    <option value="60">Até 1 hora</option>
                </select>

                {/* Tags Dropdown (Simulated with button logic for now or simple select) */}
                <div className="flex flex-wrap gap-2 items-center">
                    {popularTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => handleTagToggle(tag)}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors border
                                ${(filters.tags || []).includes(tag)
                                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                    : 'bg-white/5 text-gray-500 border-transparent hover:bg-white/10'
                                }`}
                        >
                            #{tag}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
