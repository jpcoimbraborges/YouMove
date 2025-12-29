/**
 * YOUMOVE - Recipe Types
 * TypeScript interfaces for healthy recipes
 */

export interface RecipeIngredient {
    name: string;
    quantity: number | null;
    unit: string;
}

export interface Recipe {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;

    // Macros (per serving)
    calories_per_serving: number;
    protein_g_per_serving: number;
    carbs_g_per_serving: number;
    fats_g_per_serving: number;
    fiber_g_per_serving: number;

    // Metadata
    servings: number;
    prep_time_minutes: number | null;
    difficulty: 'easy' | 'medium' | 'hard';
    meal_type: string[];
    goal_type: string[];
    tags: string[];

    // Content
    ingredients: RecipeIngredient[];
    instructions: string[];

    // Stats
    views: number;
    favorites: number;

    // System
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface RecipeFilters {
    searchQuery?: string;
    mealType?: string;
    goalType?: string;
    maxCalories?: number;
    minProtein?: number;
    maxPrepTime?: number;
    tags?: string[];
    difficulty?: 'easy' | 'medium' | 'hard';
}

export interface RecipeSortOption {
    field: 'calories_per_serving' | 'protein_g_per_serving' | 'prep_time_minutes' | 'views' | 'created_at';
    direction: 'asc' | 'desc';
}

// Helper type for creating new recipes
export type CreateRecipeInput = Omit<Recipe, 'id' | 'views' | 'favorites' | 'is_active' | 'created_at' | 'updated_at'>;

// Helper type for updating recipes
export type UpdateRecipeInput = Partial<CreateRecipeInput> & { id: string };
