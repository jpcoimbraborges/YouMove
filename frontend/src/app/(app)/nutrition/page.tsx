'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
    LayoutGrid,
    Sparkles,
    TrendingUp,
    Utensils,
    Users,
    Bell,
    Plus,
    Flame,
    Droplets,
    Beef,
    Wheat,
    Croissant,
    ScanLine,
    ChefHat,
    X,
    Save,
    Search,
    ChevronLeft,
    ChevronRight,
    Settings,
    Trash2,
    Calendar,
    Edit,
    Check,
    Brain,
    Camera,
    Wand2
} from 'lucide-react';
import { ScanFoodModal } from '@/components/features/nutrition/ScanFoodModal';
import { SuggestMenuModal } from '@/components/features/nutrition/SuggestMenuModal';

const navItems = [
    { icon: LayoutGrid, label: 'Dashboard', href: '/dashboard', active: false },
    { icon: Sparkles, label: 'Treinos IA', href: '/workout?mode=ai', active: false },
    { icon: TrendingUp, label: 'Progresso', href: '/progress', active: false },
    { icon: Utensils, label: 'Nutrição', href: '/nutrition', active: true },
    { icon: Users, label: 'Comunidade', href: '/community', active: false },
];

export default function NutritionPage() {
    const { user } = useAuth();

    // Date State
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // State
    const [caloriesConsumed, setCaloriesConsumed] = useState(0);
    const [caloriesGoal, setCaloriesGoal] = useState(2400);
    const [waterIntake, setWaterIntake] = useState(0);
    const [waterGoal, setWaterGoal] = useState(3.0);
    const [mealGroups, setMealGroups] = useState<any[]>([]);
    const [allLogs, setAllLogs] = useState<any[]>([]); // Store all logs for deletion

    // Food Modal State
    const [showFoodModal, setShowFoodModal] = useState(false);
    const [activeMeal, setActiveMeal] = useState('');
    const [editingLogId, setEditingLogId] = useState<number | null>(null);
    const [foodForm, setFoodForm] = useState({
        name: '',
        calories: '',
        protein: '',
        carbs: '',
        fats: ''
    });
    const [isSavingFood, setIsSavingFood] = useState(false);
    const [saveToLibrary, setSaveToLibrary] = useState(true);

    // Food Library State
    const [foodLibrary, setFoodLibrary] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredFoods, setFilteredFoods] = useState<any[]>([]);

    // AI Feature Modals State
    const [showScanModal, setShowScanModal] = useState(false);
    const [showSuggestModal, setShowSuggestModal] = useState(false);

    // Toast/Notification State
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Delete Confirmation
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Real Macros State
    const [macros, setMacros] = useState({
        protein: { current: 0, goal: 180, label: 'Proteína', color: '#8B5CF6' },
        carbs: { current: 0, goal: 250, label: 'Carbos', color: '#3B82F6' },
        fats: { current: 0, goal: 70, label: 'Gorduras', color: '#F59E0B' }
    });
    const [userProfile, setUserProfile] = useState<any>(null);

    // Helper: Show Toast
    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Helper: Change Date
    const changeDate = (days: number) => {
        const current = new Date(selectedDate);
        current.setDate(current.getDate() + days);
        setSelectedDate(current.toISOString().split('T')[0]);
    };

    const isToday = selectedDate === new Date().toISOString().split('T')[0];

    // Helper: Calculate Profile Goals
    const calculateProfileGoals = (profile: any) => {
        if (!profile) return null;

        const weight = profile.weight_kg || 75;
        const height = profile.height_cm || 175;
        const age = profile.birth_date ? (new Date().getFullYear() - new Date(profile.birth_date).getFullYear()) : 25;
        const goal = profile.fitness_goal || 'Ganhar massa muscular'; // Default from edit page
        const level = profile.fitness_level || 'Intermediário'; // Default from edit page

        // 1. Calculate BMR (Mifflin-St Jeor) - Using neutral/male base (+5) as specific gender is not in DB yet
        const bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;

        // 2. Activity Multiplier
        let activityFactor = 1.35; // Default Intermediate
        if (level === 'Iniciante' || level === 'beginner') activityFactor = 1.2;
        else if (level === 'Intermediário' || level === 'intermediate') activityFactor = 1.35;
        else if (level === 'Avançado' || level === 'advanced') activityFactor = 1.55;
        else if (level === 'Atleta' || level === 'elite') activityFactor = 1.75;

        const tdee = bmr * activityFactor;

        // 3. Goal Adjustment
        let targetCalories = tdee;
        let proteinPerKg = 1.8;
        let fatPerKg = 0.9;

        // Mapping from Edit Page Labels: 'Ganhar massa muscular', 'Perder gordura', etc.
        const normalizedGoal = goal.toLowerCase();

        if (normalizedGoal.includes('perder') || normalizedGoal.includes('fat') || normalizedGoal.includes('gordura')) {
            targetCalories = tdee - 500;
            proteinPerKg = 2.2; // Higher protein to spare muscle
            fatPerKg = 0.8;
        } else if (normalizedGoal.includes('ganhar') || normalizedGoal.includes('muscle') || normalizedGoal.includes('massa')) {
            targetCalories = tdee + 300;
            proteinPerKg = 2.0;
            fatPerKg = 1.0;
        } else if (normalizedGoal.includes('força') || normalizedGoal.includes('strength')) {
            targetCalories = tdee + 200;
            proteinPerKg = 2.0;
            fatPerKg = 1.0;
        }
        // Maintain/Other = TDEE

        const dailyCalories = Math.round(targetCalories);

        // 4. Calculate Macros
        const proteinG = Math.round(weight * proteinPerKg);
        const fatsG = Math.round(weight * fatPerKg);

        // Remaining calories for carbs
        // Protein = 4kcal/g, Fat = 9kcal/g, Carbs = 4kcal/g
        const caloriesFromProtAndFat = (proteinG * 4) + (fatsG * 9);
        const remainingCalories = dailyCalories - caloriesFromProtAndFat;
        const carbsG = Math.max(50, Math.round(remainingCalories / 4)); // Ensure at least 50g

        // 5. Calculate Water
        const waterLiters = Number(((weight * 35) / 1000).toFixed(1));

        return {
            calories: dailyCalories,
            protein: proteinG,
            carbs: carbsG,
            fats: fatsG,
            water: waterLiters
        };
    };

    // Load Data
    const loadNutritionData = async () => {
        if (!user) return;

        try {
            // 1. Fetch User Profile & Auto-Calculate Goals
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile) {
                setUserProfile(profile);
                const calculated = calculateProfileGoals(profile);

                if (calculated) {
                    setCaloriesGoal(calculated.calories);
                    setWaterGoal(calculated.water);
                    setMacros(prev => ({
                        protein: { ...prev.protein, goal: calculated.protein },
                        carbs: { ...prev.carbs, goal: calculated.carbs },
                        fats: { ...prev.fats, goal: calculated.fats }
                    }));

                    // Silent Sync to DB (Optional but good for robustness)
                    supabase.from('nutrition_goals').upsert({
                        user_id: user.id,
                        daily_calories: calculated.calories,
                        protein_g: calculated.protein,
                        carbs_g: calculated.carbs,
                        fats_g: calculated.fats,
                        water_liters: calculated.water
                    }).then(({ error }: { error: any }) => { if (error) console.error('Erro silencioso de sincronização de meta', error) });
                }
            }

            // 2. Fetch Logs for Selected Date (Meals + Water)
            const { data: logs } = await supabase
                .from('nutrition_logs')
                .select('*')
                .eq('user_id', user.id)
                .eq('log_date', selectedDate);

            setAllLogs(logs || []); // Store for deletion

            if (logs) {
                let totalWater = 0;
                let totalCals = 0;
                let totalProt = 0;
                let totalCarbs = 0;
                let totalFats = 0;

                // Group logs by meal type
                const groups = {
                    breakfast: { id: 'breakfast', name: 'Café da Manhã', items: [] as any[], calories: 0, completed: false },
                    lunch: { id: 'lunch', name: 'Almoço', items: [] as any[], calories: 0, completed: false },
                    snack: { id: 'snack', name: 'Lanche', items: [] as any[], calories: 0, completed: false },
                    dinner: { id: 'dinner', name: 'Jantar', items: [] as any[], calories: 0, completed: false },
                };

                logs.forEach((log: any) => {
                    if (log.meal_type === 'water') {
                        totalWater += (log.water_ml || 0);
                    } else {
                        // It's a food item
                        const type = log.meal_type as keyof typeof groups;
                        if (groups[type]) {
                            groups[type].items.push(log.item_name);
                            groups[type].calories += (log.calories || 0);
                            groups[type].completed = true; // Mark as started/completed if has items
                        }

                        totalCals += (log.calories || 0);
                        totalProt += (log.protein_g || 0);
                        totalCarbs += (log.carbs_g || 0);
                        totalFats += (log.fats_g || 0);
                    }
                });

                setWaterIntake(totalWater / 1000);
                setCaloriesConsumed(totalCals);

                // Update Macros Current Values
                setMacros(prev => ({
                    protein: { ...prev.protein, current: Math.round(totalProt) },
                    carbs: { ...prev.carbs, current: Math.round(totalCarbs) },
                    fats: { ...prev.fats, current: Math.round(totalFats) }
                }));

                // Map to array for rendering
                const orderedGroups = Object.values(groups).map(g => ({
                    ...g,
                    // Simple time approximation based on type
                    time: g.id === 'breakfast' ? '08:00' : g.id === 'lunch' ? '13:00' : g.id === 'snack' ? '16:00' : '20:00'
                }));
                setMealGroups(orderedGroups);
            }
        } catch (error) {
            console.error('Error loading nutrition:', error);
        }
    };

    // Load Food Library
    const loadFoodLibrary = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('food_library')
                .select('*')
                .eq('user_id', user.id)
                .order('usage_count', { ascending: false });

            if (error) throw error;
            setFoodLibrary(data || []);
        } catch (error) {
            console.error('Error loading food library:', error);
        }
    };

    // Search food library
    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = foodLibrary.filter(food =>
                food.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredFoods(filtered);
        } else {
            setFilteredFoods([]);
        }
    }, [searchQuery, foodLibrary]);

    useEffect(() => {
        loadNutritionData();
        loadFoodLibrary();
    }, [user, selectedDate]); // Reload when date changes

    // Handle Adding Water
    const addWater = async (amountMl: number) => {
        if (!user) return;

        // Optimistic UI Update
        const newIntake = waterIntake + (amountMl / 1000);
        setWaterIntake(newIntake);

        try {
            await supabase.from('nutrition_logs').insert({
                user_id: user.id,
                log_date: selectedDate,
                meal_type: 'water',
                item_name: 'Água',
                water_ml: amountMl
            });
            showToast(`+${amountMl}ml de água adicionado!`);
        } catch (error) {
            console.error('Error saving water:', error);
            showToast('Erro ao salvar água', 'error');
        }
    };

    // Handle Add/Edit Food
    const openFoodModal = (mealId: string, logItem?: any) => {
        setActiveMeal(mealId);
        setSearchQuery('');

        if (logItem) {
            // Editing existing item
            setEditingLogId(logItem.id);
            setFoodForm({
                name: logItem.item_name,
                calories: logItem.calories?.toString() || '',
                protein: logItem.protein_g?.toString() || '',
                carbs: logItem.carbs_g?.toString() || '',
                fats: logItem.fats_g?.toString() || ''
            });
            setSaveToLibrary(false); // Don't re-save when editing
        } else {
            // Adding new item
            setEditingLogId(null);
            setFoodForm({ name: '', calories: '', protein: '', carbs: '', fats: '' });
            setSaveToLibrary(true);
        }

        setShowFoodModal(true);
    };

    // Quick add from library
    const quickAddFromLibrary = (food: any) => {
        setFoodForm({
            name: food.name,
            calories: food.calories?.toString() || '',
            protein: food.protein_g?.toString() || '',
            carbs: food.carbs_g?.toString() || '',
            fats: food.fats_g?.toString() || ''
        });
        setSearchQuery('');
        setSaveToLibrary(false); // Already in library
    };

    const handleSaveFood = async () => {
        if (!user || !foodForm.name) return;

        setIsSavingFood(true);
        try {
            if (editingLogId) {
                // Update existing log
                await supabase
                    .from('nutrition_logs')
                    .update({
                        item_name: foodForm.name,
                        calories: Number(foodForm.calories) || 0,
                        protein_g: Number(foodForm.protein) || 0,
                        carbs_g: Number(foodForm.carbs) || 0,
                        fats_g: Number(foodForm.fats) || 0
                    })
                    .eq('id', editingLogId);

                showToast(`${foodForm.name} atualizado!`);
            } else {
                // Insert new log
                await supabase.from('nutrition_logs').insert({
                    user_id: user.id,
                    log_date: selectedDate,
                    meal_type: activeMeal,
                    item_name: foodForm.name,
                    calories: Number(foodForm.calories) || 0,
                    protein_g: Number(foodForm.protein) || 0,
                    carbs_g: Number(foodForm.carbs) || 0,
                    fats_g: Number(foodForm.fats) || 0
                });

                showToast(`${foodForm.name} adicionado com sucesso!`);
            }

            // Save to library if checkbox is checked
            if (saveToLibrary && !editingLogId) {
                await supabase.from('food_library').upsert({
                    user_id: user.id,
                    name: foodForm.name,
                    calories: Number(foodForm.calories) || 0,
                    protein_g: Number(foodForm.protein) || 0,
                    carbs_g: Number(foodForm.carbs) || 0,
                    fats_g: Number(foodForm.fats) || 0
                }, {
                    onConflict: 'user_id,name',
                    ignoreDuplicates: false
                });

                // Increment usage count
                await supabase.rpc('increment_food_usage', {
                    p_user_id: user.id,
                    p_food_name: foodForm.name
                });

                loadFoodLibrary(); // Refresh library
            }

            setShowFoodModal(false);
            loadNutritionData();
        } catch (error) {
            console.error('Error saving food:', error);
            showToast('Erro ao salvar alimento', 'error');
        } finally {
            setIsSavingFood(false);
        }
    };

    // Handle Delete Item
    const handleDeleteItem = async (logId: number) => {
        if (!user) return;

        try {
            await supabase
                .from('nutrition_logs')
                .delete()
                .eq('id', logId);

            setItemToDelete(null);
            showToast('Item removido com sucesso!');
            loadNutritionData();
        } catch (error) {
            console.error('Error deleting item:', error);
            showToast('Erro ao remover item', 'error');
        }
    };

    // AI Handlers
    const handleScanComplete = async (data: any) => {
        // Data format received from API: { foods: [{ name, calories, protein, carbs, fats }] }
        if (data.foods && data.foods.length > 0) {
            const food = data.foods[0]; // Take the first one for now or show selection modal
            // Open food modal populated with scanned data
            setActiveMeal('lunch'); // Default or ask user later
            setFoodForm({
                name: food.name,
                calories: food.calories?.toString() || '',
                protein: food.protein?.toString() || '',
                carbs: food.carbs?.toString() || '',
                fats: food.fats?.toString() || ''
            });
            setShowFoodModal(true);
            showToast('Alimento identificado com sucesso!');
        }
    };

    const handleApplyMenu = async (menu: any) => {
        if (!user || !menu.meals) return;

        try {
            const updates = menu.meals.map((meal: any) => {
                // Map AI meal names to our DB types
                let mealType = 'snack';
                const name = meal.name.toLowerCase();
                if (name.includes('café') || name.includes('manhã')) mealType = 'breakfast';
                else if (name.includes('almoço')) mealType = 'lunch';
                else if (name.includes('jantar')) mealType = 'dinner';

                // Create a consolidated item for the meal
                // Example Item Name: "Sugestão IA: Ovos, Pão, Café"
                const description = meal.items.join(', ');

                return {
                    user_id: user.id,
                    log_date: selectedDate,
                    meal_type: mealType,
                    item_name: description,
                    calories: meal.calories || 0,
                    protein_g: meal.protein || 0,
                    carbs_g: meal.carbs || 0,
                    fats_g: meal.fats || 0
                };
            });

            // Insert all meals at once
            const { error } = await supabase
                .from('nutrition_logs')
                .insert(updates);

            if (error) throw error;

            showToast('Cardápio salvo no seu diário!');
            loadNutritionData(); // Refresh the UI
        } catch (error) {
            console.error('Error applying menu:', error);
            showToast('Erro ao salvar cardápio', 'error');
        }
    };

    return (
        <div className="min-h-screen flex text-slate-200 font-sans selection:bg-blue-500/30" style={{ background: '#000000' }}>
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:flex flex-col w-64 p-6 border-r border-[#1f1f23] bg-[#09090b]">
                <div className="flex items-center gap-2 mb-10">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#3B82F6' }}>
                        <span className="text-white font-bold text-lg">Y</span>
                    </div>
                    <span className="text-white font-semibold text-lg">YouMove</span>
                </div>
                <nav className="flex flex-col gap-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${item.active
                                ? 'text-white bg-[#1c1c1f] shadow-[0_0_20px_rgba(0,0,0,0.4)]'
                                : 'text-gray-500 hover:text-gray-200 hover:bg-[#1c1c1f]/50'
                                }`}
                        >
                            <item.icon size={22} strokeWidth={item.active ? 2 : 1.5} className={item.active ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'group-hover:text-gray-300'} />
                            <span className="font-medium text-[15px]">{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Gradient Orb Background Effect */}
            <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none z-0" />

            {/* Main Content */}
            <main className="flex-1 pb-32 lg:pb-12 overflow-y-auto relative z-10 custom-scrollbar">
                <header className="sticky top-0 z-30 px-6 py-5 border-b border-[#1f1f23] backdrop-blur-xl bg-[#000000]/80 supports-[backdrop-filter]:bg-[#000000]/60">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                                Nutrição Inteligente
                                <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase tracking-widest font-bold">Beta</span>
                            </h1>
                            <p className="text-sm text-gray-400">Suas metas são calculadas conforme seu perfil</p>
                        </div>
                        {/* Meta Auto-Calculation Indicator (Disabled Button Look for Info) */}
                        <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 text-xs">
                            <Brain size={14} />
                            Metas Automáticas
                        </div>
                    </div>

                    {/* Date Navigation */}
                    <div className="flex items-center justify-center gap-2 bg-[#121214] p-1 rounded-2xl border border-[#1f1f23]">
                        <button
                            onClick={() => changeDate(-1)}
                            className="p-2.5 rounded-xl hover:bg-[#27272a] text-gray-500 hover:text-white transition-all active:scale-95"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div className="px-6 py-2 rounded-xl bg-white/5 border border-white/10">
                            <span className="text-white font-semibold">
                                {isToday ? 'Hoje' : new Date(selectedDate).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                })}
                            </span>
                        </div>
                        <button
                            onClick={() => changeDate(1)}
                            disabled={isToday}
                            className="p-2.5 rounded-xl hover:bg-[#27272a] text-gray-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </header>

                <div className="p-4 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto">

                    {/* LEFT COLUMN: Summary (lg:col-span-8) */}
                    <div className="lg:col-span-8 flex flex-col gap-6">

                        {/* Calories Main Card */}
                        <div className="relative rounded-[2rem] p-8 overflow-hidden min-h-[300px] flex items-center justify-between group border border-[#1f1f23] hover:border-blue-500/20 transition-all duration-500 shadow-2xl shadow-black/50">
                            {/* Premium Gradient Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[#0e0e11] via-[#09090b] to-[#000000] z-0" />
                            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />

                            <div className="relative z-10 flex-1">
                                <h2 className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                    Saldo Diário
                                </h2>
                                <div className="flex items-baseline gap-3 mb-8">
                                    <span className="text-6xl font-black text-white tracking-tight drop-shadow-lg">{caloriesGoal - caloriesConsumed}</span>
                                    <span className="text-gray-500 font-medium text-lg">kcal restantes</span>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    {Object.entries(macros).map(([key, data]) => (
                                        <div key={key} className="bg-[#18181b]/50 rounded-2xl p-4 border border-[#27272a] backdrop-blur-md hover:bg-[#18181b] transition-all group/macro relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/macro:translate-x-full transition-transform duration-1000" />

                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-2 h-2 rounded-full shadow-[0_0_8px]" style={{ background: data.color, boxShadow: `0 0 10px ${data.color}40` }} />
                                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{data.label}</span>
                                            </div>
                                            <p className="text-2xl font-black text-white mb-2 tracking-tight">{data.current}<span className="text-sm font-medium text-gray-600 ml-1">g</span></p>
                                            <div className="w-full h-1.5 bg-[#27272a] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-1000 relative"
                                                    style={{ width: `${Math.min(100, (data.current / data.goal) * 100)}%`, background: data.color }}
                                                >
                                                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/20" />
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-2 text-right font-medium">meta: {data.goal}g</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions - Modernized Buttons */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Escanear Refeição */}
                            <button
                                onClick={() => setShowScanModal(true)}
                                className="group relative overflow-hidden rounded-[1.5rem] bg-[#1F2937] p-1 border border-white/5 transition-all hover:border-blue-500/30"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="relative flex items-center gap-4 p-5 bg-[#121214] rounded-[1.2rem] h-full transition-colors group-hover:bg-[#151518]">
                                    <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform duration-300">
                                        <Camera size={26} className="text-white" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">Escanear Refeição</h3>
                                        <p className="text-xs text-gray-400 mt-1">Registre calorias instantaneamente com uma foto</p>
                                    </div>
                                    <div className="ml-auto opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                        <ChevronRight size={20} className="text-blue-500" />
                                    </div>
                                </div>
                            </button>

                            {/* Sugerir Cardápio */}
                            <button
                                onClick={() => setShowSuggestModal(true)}
                                className="group relative overflow-hidden rounded-[1.5rem] bg-[#1F2937] p-1 border border-white/5 transition-all hover:border-purple-500/30"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="relative flex items-center gap-4 p-5 bg-[#121214] rounded-[1.2rem] h-full transition-colors group-hover:bg-[#151518]">
                                    <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-purple-600/20 group-hover:scale-105 transition-transform duration-300">
                                        <Wand2 size={26} className="text-white" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">Sugerir Cardápio</h3>
                                        <p className="text-xs text-gray-400 mt-1">IA cria um plano perfeito para sua meta hoje</p>
                                    </div>
                                    <div className="ml-auto opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                        <ChevronRight size={20} className="text-purple-500" />
                                    </div>
                                </div>
                            </button>
                        </div>


                        {/* Meals Timeline */}
                        <div>
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3 pl-1">
                                <div className="w-8 h-8 rounded-lg bg-[#27272a] flex items-center justify-center border border-[#3f3f46]">
                                    <Utensils size={16} className="text-gray-300" />
                                </div>
                                Diário Alimentar
                            </h3>
                            <div className="space-y-4">
                                {mealGroups.map((meal) => (
                                    <div key={meal.id} className="group relative bg-[#121214] border border-[#27272a] p-5 rounded-[1.5rem] flex items-start gap-5 hover:border-[#3f3f46] transition-all hover:bg-[#18181b] overflow-hidden">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${meal.completed
                                            ? 'bg-gradient-to-br from-green-500/20 to-green-500/5 text-green-400 border border-green-500/20'
                                            : 'bg-[#18181b] text-gray-600 border border-[#27272a]'
                                            }`}>
                                            {meal.name.includes('Café') ? <Croissant size={24} strokeWidth={1.5} /> :
                                                meal.name.includes('Jantar') ? <Beef size={24} strokeWidth={1.5} /> :
                                                    <Wheat size={24} strokeWidth={1.5} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className={`font-bold text-lg ${meal.completed ? 'text-white' : 'text-gray-500'}`}>{meal.name}</h4>
                                                <span className="text-xs font-mono font-medium text-gray-500 bg-[#1c1c1f] px-2 py-1 rounded-lg border border-[#27272a]">{meal.time}</span>
                                            </div>
                                            {meal.items.length > 0 ? (
                                                <div className="space-y-2 mt-3">
                                                    {allLogs
                                                        .filter((log: any) => log.meal_type === meal.id)
                                                        .map((log: any) => (
                                                            <div key={log.id} className="flex items-center justify-between bg-[#09090b] px-4 py-3 rounded-xl border border-[#1f1f23] group/item hover:border-[#3f3f46] transition-colors max-w-full">
                                                                <span className="text-gray-300 font-medium text-sm truncate pr-2 flex-1 min-w-0">{log.item_name}</span>
                                                                <div className="flex items-center gap-3 shrink-0">
                                                                    <span className="text-xs font-bold text-gray-500 bg-[#1c1c1f] px-2 py-0.5 rounded border border-[#27272a]">{log.calories} kcal</span>
                                                                    <div className="flex items-center gap-1 relative z-20">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                openFoodModal(meal.id, log);
                                                                            }}
                                                                            className="p-1.5 hover:bg-blue-500/20 rounded-lg text-gray-500 hover:text-blue-400 transition-all"
                                                                            title="Editar"
                                                                        >
                                                                            <Edit size={14} />
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setItemToDelete(log.id);
                                                                                setShowDeleteConfirm(true);
                                                                            }}
                                                                            className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-500 hover:text-red-400 transition-all"
                                                                            title="Deletar"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-600 font-medium italic mt-1">Nenhum registro ainda</p>
                                            )}
                                        </div>
                                        <div className="text-right pl-2 border-l border-[#27272a]">
                                            <span className="block font-black text-xl text-white tracking-tight">{meal.calories > 0 ? meal.calories : '-'}</span>
                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">kcal</span>
                                        </div>

                                        <button
                                            onClick={() => openFoodModal(meal.id)}
                                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center backdrop-blur-[2px] rounded-[1.5rem] transition-all duration-300 cursor-pointer"
                                        >
                                            <div className="bg-[#0066FF] text-white px-6 py-2.5 rounded-full font-bold flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform shadow-xl shadow-blue-500/30">
                                                <Plus size={18} strokeWidth={2.5} /> Adicionar
                                            </div>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Hydration & Insights (lg:col-span-4) */}
                    <div className="lg:col-span-4 flex flex-col gap-6">

                        {/* Hydration Card */}
                        <div className="bg-gradient-to-b from-blue-900/20 to-[#161b22] border border-blue-500/20 rounded-3xl p-6 relative overflow-hidden transition-all hover:border-blue-500/40 group">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        <Droplets size={18} className="text-blue-400" />
                                        Hidratação
                                    </h3>
                                    <p className="text-xs text-blue-200/60 mt-1">Meta: {waterGoal}L</p>
                                </div>
                                <span className="text-2xl font-black text-blue-400">{waterIntake.toFixed(2)}L</span>
                            </div>

                            {/* Water Bottle Visualization */}
                            <div className="h-48 bg-[#0B0E14] rounded-2xl relative overflow-hidden flex flex-col justify-end border border-white/5 shadow-inner">
                                <div
                                    className="w-full bg-blue-500 transition-all duration-1000 relative"
                                    style={{ height: `${Math.min(100, (waterIntake / waterGoal) * 100)}%` }}
                                >
                                    <div className="absolute top-0 left-0 right-0 h-2 bg-blue-400 opacity-50 blur-[2px]" />
                                    {/* Bubbles animation */}
                                    <div className="absolute inset-0 w-full h-full opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-4xl font-black text-white/10 mix-blend-overlay">H₂O</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mt-4">
                                {[250, 500, 750].map((amount) => (
                                    <button
                                        key={amount}
                                        onClick={() => addWater(amount)}
                                        className="py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold transition-all border border-blue-500/10 hover:border-blue-500/30 active:scale-95"
                                    >
                                        +{amount}ml
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            {/* Mobile Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 flex justify-around items-center py-4 border-t border-[#1f1f23] backdrop-blur-xl z-50 bg-[#09090b]/90">
                {navItems.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={`flex flex-col items-center gap-1 px-3 py-1 min-w-[44px] justify-center ${item.active ? 'text-blue-500' : 'text-gray-500'
                            }`}
                    >
                        <item.icon size={22} strokeWidth={item.active ? 2 : 1.5} />
                        <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
                    </Link>
                ))}
            </nav>

            {/* Modals */}
            {showScanModal && (
                <ScanFoodModal
                    onClose={() => setShowScanModal(false)}
                    onScanComplete={handleScanComplete}
                />
            )}

            {showSuggestModal && (
                <SuggestMenuModal
                    onClose={() => setShowSuggestModal(false)}
                    onApplyMenu={handleApplyMenu}
                    userProfile={userProfile}
                />
            )}

            {/* Add/Edit Food Modal */}
            {showFoodModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#121214] rounded-3xl w-full max-w-md border border-[#27272a] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-[#27272a] flex items-center justify-between bg-[#18181b]">
                            <h3 className="text-lg font-bold text-white">
                                {editingLogId ? 'Editar Alimento' : 'Adicionar Alimento'}
                            </h3>
                            <button
                                onClick={() => setShowFoodModal(false)}
                                className="w-8 h-8 rounded-full bg-[#27272a] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Search / Suggestions */}
                            {!editingLogId && (
                                <div className="mb-6">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 text-gray-500" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Buscar na biblioteca..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-[#09090b] border border-[#27272a] rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                    {filteredFoods.length > 0 && (
                                        <div className="mt-2 max-h-40 overflow-y-auto bg-[#09090b] border border-[#27272a] rounded-xl divide-y divide-[#27272a]">
                                            {filteredFoods.map(food => (
                                                <button
                                                    key={food.id}
                                                    onClick={() => quickAddFromLibrary(food)}
                                                    className="w-full text-left px-4 py-3 hover:bg-[#1f1f23] transition-colors flex items-center justify-between group"
                                                >
                                                    <span className="text-sm text-gray-300">{food.name}</span>
                                                    <span className="text-xs text-gray-500 group-hover:text-blue-400">{food.calories} kcal</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Nome do Alimento</label>
                                <input
                                    type="text"
                                    value={foodForm.name}
                                    onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                                    className="w-full bg-[#09090b] border border-[#27272a] rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="Ex: Arroz Branco (100g)"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Calorias (kcal)</label>
                                    <input
                                        type="number"
                                        value={foodForm.calories}
                                        onChange={(e) => setFoodForm({ ...foodForm, calories: e.target.value })}
                                        className="w-full bg-[#09090b] border border-[#27272a] rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Proteína (g)</label>
                                    <input
                                        type="number"
                                        value={foodForm.protein}
                                        onChange={(e) => setFoodForm({ ...foodForm, protein: e.target.value })}
                                        className="w-full bg-[#09090b] border border-[#27272a] rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Carboidratos (g)</label>
                                    <input
                                        type="number"
                                        value={foodForm.carbs}
                                        onChange={(e) => setFoodForm({ ...foodForm, carbs: e.target.value })}
                                        className="w-full bg-[#09090b] border border-[#27272a] rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Gorduras (g)</label>
                                    <input
                                        type="number"
                                        value={foodForm.fats}
                                        onChange={(e) => setFoodForm({ ...foodForm, fats: e.target.value })}
                                        className="w-full bg-[#09090b] border border-[#27272a] rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {!editingLogId && (
                                <div className="flex items-center gap-2 pt-2">
                                    <button
                                        onClick={() => setSaveToLibrary(!saveToLibrary)}
                                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${saveToLibrary ? 'bg-blue-600 border-blue-600' : 'border-gray-500'}`}
                                    >
                                        {saveToLibrary && <Check size={14} className="text-white" />}
                                    </button>
                                    <label className="text-sm text-gray-400 cursor-pointer" onClick={() => setSaveToLibrary(!saveToLibrary)}>
                                        Salvar na biblioteca para uso futuro
                                    </label>
                                </div>
                            )}

                            <button
                                onClick={handleSaveFood}
                                disabled={isSavingFood || !foodForm.name}
                                className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSavingFood ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        Salvar Registro
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#121214] rounded-2xl w-full max-w-sm border border-[#27272a] p-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={24} className="text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Remover item?</h3>
                        <p className="text-gray-400 text-sm mb-6">Você tem certeza que deseja remover este item do seu diário?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-3 rounded-xl border border-[#27272a] text-gray-300 font-medium hover:bg-[#27272a] transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => itemToDelete && handleDeleteItem(itemToDelete).then(() => setShowDeleteConfirm(false))}
                                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors"
                            >
                                Remover
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-2xl z-[100] flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-300 ${toast.type === 'success' ? 'bg-[#000]' : 'bg-red-900/90'
                    } border ${toast.type === 'success' ? 'border-green-500/30' : 'border-red-500/30'}`}>
                    {toast.type === 'success' ? (
                        <CheckCircleIcon size={20} className="text-green-500" />
                    ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-red-500 flex items-center justify-center">
                            <X size={12} className="text-red-500" />
                        </div>
                    )}
                    <span className="font-medium text-white">{toast.message}</span>
                </div>
            )}
        </div>
    );
}

function CheckCircleIcon({ size, className }: { size: number, className: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
    );
}
