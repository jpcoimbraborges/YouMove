'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, ArrowLeft, RefreshCw, ChefHat, FilterX } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { RecipeDetailModal } from '@/components/recipes/RecipeDetailModal';
import { STATIC_RECIPES } from '@/lib/recipes/data';
import type { Recipe, RecipeFilters } from '@/types/recipe.types';

export default function RecipesPage() {
    const router = useRouter();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('todos');

    // Filters state
    const [filters, setFilters] = useState<RecipeFilters>({});
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchRecipes();
    }, []);

    const fetchRecipes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('recipes')
                .select('*')
                .eq('is_active', true)
                .order('views', { ascending: false }); // Popular first

            if (error) {
                console.warn('Error fetching recipes, using fallback:', error);
                setRecipes(STATIC_RECIPES);
            } else if (data && data.length > 0) {
                setRecipes(data as Recipe[]);
            } else {
                // Fallback if DB is empty
                setRecipes(STATIC_RECIPES);
            }
        } catch (error) {
            console.error('Exception fetching recipes:', error);
            setRecipes(STATIC_RECIPES);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredRecipes = useMemo(() => {
        return recipes.filter(recipe => {
            // 1. Category (Meal Type)
            if (activeCategory !== 'todos') {
                if (!recipe.meal_type.includes(activeCategory)) return false;
            }

            // 2. Search Query (Name or Ingredients)
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesName = recipe.name.toLowerCase().includes(query);
                const matchesIng = recipe.ingredients.some(ing => ing.name.toLowerCase().includes(query));
                if (!matchesName && !matchesIng) return false;
            }

            return true;
        });
    }, [recipes, activeCategory, searchQuery]);

    const categories = [
        { id: 'todos', label: 'Todos' },
        { id: 'breakfast', label: 'Café da Manhã' },
        { id: 'lunch', label: 'Almoço/Jantar' },
        { id: 'snack', label: 'Lanches' },
        { id: 'pre_workout', label: 'Pré-Treino' },
        { id: 'post_workout', label: 'Pós-Treino' },
    ];

    return (
        <div className="min-h-screen bg-[#0B0E14] pb-24">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-[#0B0E14]/95 backdrop-blur-xl border-b border-white/5 pt-safe-top">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4 mb-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="text-2xl font-bold text-white flex-1">Receitas Saudáveis</h1>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-6">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search size={20} className="text-gray-500" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar receitas, ingredientes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#121214] border border-white/10 text-white text-sm rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:bg-[#18181b] transition-all placeholder-gray-600 shadow-inner"
                        />
                        {/* Filter Button (Visual only for now) */}
                        <div className="absolute inset-y-0 right-2 flex items-center">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`p-2.5 rounded-xl transition-all ${showFilters ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent'}`}
                            >
                                <SlidersHorizontal size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Categories Scroller */}
                    <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide -mx-4 px-4 mask-linear-fade">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-xs font-bold transition-all border shadow-lg ${activeCategory === cat.id
                                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 border-blue-400/50 text-white shadow-blue-500/20 scale-105'
                                        : 'bg-[#18181b] border-white/5 text-gray-400 hover:border-white/10 hover:text-white hover:bg-[#202023]'
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 py-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-gray-400 text-sm">Carregando o cardápio...</p>
                    </div>
                ) : filteredRecipes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredRecipes.map(recipe => (
                            <RecipeCard
                                key={recipe.id}
                                recipe={recipe}
                                onClick={() => setSelectedRecipe(recipe)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                        <div className="w-16 h-16 bg-[#1F2937] rounded-full flex items-center justify-center mb-4">
                            <FilterX size={32} className="text-gray-600" />
                        </div>
                        <h3 className="text-white font-bold text-lg mb-2">Nenhuma receita encontrada</h3>
                        <p className="text-gray-400 text-sm mb-6 max-w-xs">
                            Tente ajustar os filtros ou buscar por outros ingredientes.
                        </p>
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setActiveCategory('todos');
                            }}
                            className="text-blue-400 font-medium text-sm hover:text-blue-300 transition-colors"
                        >
                            Limpar filtros
                        </button>
                    </div>
                )}
            </main>

            {/* Modal */}
            {selectedRecipe && (
                <RecipeDetailModal
                    recipe={selectedRecipe}
                    onClose={() => setSelectedRecipe(null)}
                    onAddToDiary={() => {
                        // TODO: Implement Add to Diary
                        console.log('Add to diary:', selectedRecipe.name);
                        setSelectedRecipe(null);
                    }}
                />
            )}
        </div>
    );
}
