/**
 * YOUMOVE - Recipe Utilities
 * Helper functions for recipe operations
 */

import type { Recipe, RecipeFilters, RecipeSortOption } from '@/types/recipe.types';

// ============================================
// FILTERING
// ============================================

export function filterRecipes(recipes: Recipe[], filters: RecipeFilters): Recipe[] {
    let filtered = [...recipes];

    // Search query
    if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filtered = filtered.filter(recipe =>
            recipe.name.toLowerCase().includes(query) ||
            recipe.description?.toLowerCase().includes(query) ||
            recipe.tags.some(tag => tag.toLowerCase().includes(query))
        );
    }

    // Meal type
    if (filters.mealType) {
        filtered = filtered.filter(recipe =>
            recipe.meal_type.includes(filters.mealType!)
        );
    }

    // Goal type
    if (filters.goalType) {
        filtered = filtered.filter(recipe =>
            recipe.goal_type.includes(filters.goalType!)
        );
    }

    // Max calories
    if (filters.maxCalories) {
        filtered = filtered.filter(recipe =>
            recipe.calories_per_serving <= filters.maxCalories!
        );
    }

    // Min protein
    if (filters.minProtein) {
        filtered = filtered.filter(recipe =>
            recipe.protein_g_per_serving >= filters.minProtein!
        );
    }

    // Max prep time
    if (filters.maxPrepTime) {
        filtered = filtered.filter(recipe =>
            !recipe.prep_time_minutes || recipe.prep_time_minutes <= filters.maxPrepTime!
        );
    }

    // Tags
    if (filters.tags && filters.tags.length > 0) {
        filtered = filtered.filter(recipe =>
            filters.tags!.every(tag => recipe.tags.includes(tag))
        );
    }

    // Difficulty
    if (filters.difficulty) {
        filtered = filtered.filter(recipe =>
            recipe.difficulty === filters.difficulty
        );
    }

    return filtered;
}

// ============================================
// SORTING
// ============================================

export function sortRecipes(recipes: Recipe[], sortOption: RecipeSortOption): Recipe[] {
    const sorted = [...recipes];

    sorted.sort((a, b) => {
        let aValue = a[sortOption.field];
        let bValue = b[sortOption.field];

        // Handle null values
        if (aValue === null) aValue = sortOption.direction === 'asc' ? Infinity : -Infinity;
        if (bValue === null) bValue = sortOption.direction === 'asc' ? Infinity : -Infinity;

        if (sortOption.direction === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    return sorted;
}

// ============================================
// CALCULATIONS
// ============================================

export function calculateMacrosForServings(
    recipe: Recipe,
    customServings: number
): {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
} {
    const multiplier = customServings / recipe.servings;

    return {
        calories: Math.round(recipe.calories_per_serving * customServings),
        protein: Math.round(recipe.protein_g_per_serving * customServings * 10) / 10,
        carbs: Math.round(recipe.carbs_g_per_serving * customServings * 10) / 10,
        fats: Math.round(recipe.fats_g_per_serving * customServings * 10) / 10,
        fiber: Math.round(recipe.fiber_g_per_serving * customServings * 10) / 10
    };
}

export function calculateMacroPercentages(recipe: Recipe): {
    protein_percent: number;
    carbs_percent: number;
    fats_percent: number;
} {
    const totalCalories = recipe.calories_per_serving;

    // 1g protein = 4 kcal, 1g carb = 4 kcal, 1g fat = 9 kcal
    const proteinCals = recipe.protein_g_per_serving * 4;
    const carbsCals = recipe.carbs_g_per_serving * 4;
    const fatsCals = recipe.fats_g_per_serving * 9;

    return {
        protein_percent: Math.round((proteinCals / totalCalories) * 100),
        carbs_percent: Math.round((carbsCals / totalCalories) * 100),
        fats_percent: Math.round((fatsCals / totalCalories) * 100)
    };
}

// ============================================
// FORMATTING
// ============================================

export function formatPrepTime(minutes: number | null): string {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
}

export function getDifficultyLabel(difficulty: 'easy' | 'medium' | 'hard'): string {
    const labels = {
        easy: 'Fácil',
        medium: 'Médio',
        hard: 'Difícil'
    };
    return labels[difficulty];
}

export function getDifficultyColor(difficulty: 'easy' | 'medium' | 'hard'): string {
    const colors = {
        easy: 'text-green-400',
        medium: 'text-yellow-400',
        hard: 'text-red-400'
    };
    return colors[difficulty];
}

export function getMealTypeLabel(mealType: string): string {
    const labels: Record<string, string> = {
        breakfast: 'Café da Manhã',
        lunch: 'Almoço',
        dinner: 'Jantar',
        snack: 'Lanche',
        'pre-workout': 'Pré-Treino',
        'post-workout': 'Pós-Treino'
    };
    return labels[mealType] || mealType;
}

export function getGoalTypeLabel(goalType: string): string {
    const labels: Record<string, string> = {
        cutting: 'Definição',
        bulking: 'Ganho de Massa',
        balanced: 'Balanceado'
    };
    return labels[goalType] || goalType;
}

export function getGoalTypeColor(goalType: string): string {
    const colors: Record<string, string> = {
        cutting: 'text-green-400',
        bulking: 'text-orange-400',
        balanced: 'text-blue-400'
    };
    return colors[goalType] || 'text-gray-400';
}

// ============================================
// RECOMMENDATIONS
// ============================================

export function getRecommendedRecipes(
    recipes: Recipe[],
    userGoal: 'cutting' | 'bulking' | 'balanced',
    limit: number = 5
): Recipe[] {
    // Filter by goal
    const filtered = recipes.filter(recipe =>
        recipe.goal_type.includes(userGoal)
    );

    // Sort by relevance (views + protein for cutting, views + calories for bulking)
    const sorted = filtered.sort((a, b) => {
        if (userGoal === 'cutting') {
            return (b.protein_g_per_serving + b.views / 100) - (a.protein_g_per_serving + a.views / 100);
        } else if (userGoal === 'bulking') {
            return (b.calories_per_serving + b.views / 10) - (a.calories_per_serving + a.views / 10);
        } else {
            return b.views - a.views;
        }
    });

    return sorted.slice(0, limit);
}

export function getQuickRecipes(recipes: Recipe[], maxPrepTime: number = 15): Recipe[] {
    return recipes.filter(recipe =>
        recipe.prep_time_minutes && recipe.prep_time_minutes <= maxPrepTime
    );
}

export function getHighProteinRecipes(recipes: Recipe[], minProtein: number = 30): Recipe[] {
    return recipes.filter(recipe =>
        recipe.protein_g_per_serving >= minProtein
    );
}
