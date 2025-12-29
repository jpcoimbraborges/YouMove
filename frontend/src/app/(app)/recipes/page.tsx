'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutGrid,
    Calendar,
    Dumbbell,
    BarChart3,
    User,
    UtensilsCrossed,
    ChefHat,
    Loader2
} from 'lucide-react';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { RecipeFiltersComponent } from '@/components/recipes/RecipeFilters';
import { RecipeDetailModal } from '@/components/recipes/RecipeDetailModal';
import type { Recipe, RecipeFilters } from '@/types/recipe.types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Navigation items
const navItems = [
    { icon: LayoutGrid, label: 'Dashboard', href: '/dashboard', active: false },
    { icon: UtensilsCrossed, label: 'Receitas', href: '/recipes', active: true },
    { icon: Dumbbell, label: 'Treinos', href: '/workout', active: false },
    { icon: Calendar, label: 'Histórico', href: '/history', active: false },
    { icon: BarChart3, label: 'Progresso', href: '/progress', active: false },
    { icon: User, label: 'Perfil', href: '/profile', active: false },
];

export default function RecipesPage() {
    const router = useRouter();
    const { user } = useAuth();

    // State
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [filters, setFilters] = useState<RecipeFilters>({});

    // Fetch recipes
    useEffect(() => {
        const fetchRecipes = async () => {
            setLoading(true);
            try {
                // Construct query params
                const params = new URLSearchParams();
                if (filters.searchQuery) params.append('search', filters.searchQuery);
                if (filters.mealType) params.append('mealType', filters.mealType);
                if (filters.goalType) params.append('goalType', filters.goalType);
                if (filters.difficulty) params.append('difficulty', filters.difficulty);
                if (filters.maxPrepTime) params.append('maxPrepTime', filters.maxPrepTime.toString());

                const res = await fetch(`/api/recipes?${params.toString()}`);
                const data = await res.json();

                if (data.success) {
                    setRecipes(data.recipes);
                }
            } catch (error) {
                console.error('Error fetching recipes:', error);
            } finally {
                setLoading(false);
            }
        };

        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchRecipes();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [filters]);

    // Add to diary handler
    const handleAddToDiary = async (recipe: Recipe) => {
        if (!user) return;

        try {
            // Insert into nutrition_logs
            const { error } = await supabase
                .from('nutrition_logs')
                .insert({
                    user_id: user.id,
                    name: recipe.name,
                    calories: recipe.calories_per_serving,
                    protein: recipe.protein_g_per_serving,
                    carbs: recipe.carbs_g_per_serving,
                    fats: recipe.fats_g_per_serving,
                    logged_at: new Date().toISOString(),
                    meal_type: filters.mealType || 'snack' // Default or current filter
                });

            if (error) throw error;

            // Optional: Show success toast (handled by modal state currently)
        } catch (error) {
            console.error('Error in handleAddToDiary:', error);
            throw error;
        }
    };

    return (
        <div className="h-screen flex overflow-hidden bg-[#0B0E14]">
            {/* Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 p-5 border-r border-white/5 bg-[#111318]">
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">Y</span>
                    </div>
                    <span className="text-white font-bold text-xl">YouMove</span>
                </div>

                <nav className="flex flex-col gap-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${item.active
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <item.icon size={20} strokeWidth={1.5} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header */}
                <div className="p-4 lg:p-8 border-b border-white/5 bg-[#0B0E14]/80 backdrop-blur-xl z-10 sticky top-0">
                    <div className="max-w-7xl mx-auto w-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400">
                                <ChefHat size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Receitas Saudáveis</h1>
                                <p className="text-sm text-gray-400">Explore refeições deliciosas focadas no seu objetivo</p>
                            </div>
                        </div>

                        <RecipeFiltersComponent
                            filters={filters}
                            onChange={setFilters}
                        />
                    </div>
                </div>

                {/* Content Grid */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <div className="max-w-7xl mx-auto w-full">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                                <p className="text-gray-400">Buscando receitas...</p>
                            </div>
                        ) : recipes.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {recipes.map(recipe => (
                                    <RecipeCard
                                        key={recipe.id}
                                        recipe={recipe}
                                        onClick={() => setSelectedRecipe(recipe)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <UtensilsCrossed size={48} className="text-gray-600 mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">Nenhuma receita encontrada</h3>
                                <p className="text-gray-400 max-w-md">
                                    Tente ajustar seus filtros de busca para encontrar o que procura.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Modal */}
            {selectedRecipe && (
                <RecipeDetailModal
                    recipe={selectedRecipe}
                    onClose={() => setSelectedRecipe(null)}
                    onAddToDiary={handleAddToDiary}
                />
            )}
        </div>
    );
}
