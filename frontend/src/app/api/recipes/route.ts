/**
 * YOUMOVE - Recipes API
 * GET /api/recipes
 * Fetch recipes with filters and sorting
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        // Extract query params
        const searchQuery = searchParams.get('search');
        const mealType = searchParams.get('mealType');
        const goalType = searchParams.get('goalType');
        const maxCalories = searchParams.get('maxCalories');
        const minProtein = searchParams.get('minProtein');
        const maxPrepTime = searchParams.get('maxPrepTime');
        const difficulty = searchParams.get('difficulty');
        const sortBy = searchParams.get('sortBy') || 'created_at';
        const sortDirection = searchParams.get('sortDirection') || 'desc';
        const limit = parseInt(searchParams.get('limit') || '50');

        // Build query
        let query = supabase
            .from('recipes')
            .select('*')
            .eq('is_active', true);

        // Apply filters
        if (mealType) {
            query = query.contains('meal_type', [mealType]);
        }

        if (goalType) {
            query = query.contains('goal_type', [goalType]);
        }

        if (maxCalories) {
            query = query.lte('calories_per_serving', parseInt(maxCalories));
        }

        if (minProtein) {
            query = query.gte('protein_g_per_serving', parseInt(minProtein));
        }

        if (maxPrepTime) {
            query = query.lte('prep_time_minutes', parseInt(maxPrepTime));
        }

        if (difficulty) {
            query = query.eq('difficulty', difficulty);
        }

        // Apply sorting
        const ascending = sortDirection === 'asc';
        query = query.order(sortBy, { ascending });

        // Apply limit
        query = query.limit(limit);

        // Execute query
        const { data: recipes, error } = await query;

        if (error) {
            console.error('Error fetching recipes:', error);
            return NextResponse.json(
                { error: 'Failed to fetch recipes', details: error.message },
                { status: 500 }
            );
        }

        // Client-side text search (Supabase free tier limitation)
        let filteredRecipes = recipes || [];
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredRecipes = filteredRecipes.filter(recipe =>
                recipe.name.toLowerCase().includes(query) ||
                recipe.description?.toLowerCase().includes(query) ||
                recipe.tags.some((tag: string) => tag.toLowerCase().includes(query))
            );
        }

        return NextResponse.json({
            success: true,
            recipes: filteredRecipes,
            count: filteredRecipes.length
        });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
