'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Utensils, ChevronRight, Flame, Beef, Wheat, Droplet } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface NutritionData {
    consumed: {
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
    };
    goals: {
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
    };
}

interface NutritionSummaryWidgetProps {
    userId: string;
}

export function NutritionSummaryWidget({ userId }: NutritionSummaryWidgetProps) {
    const [data, setData] = useState<NutritionData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNutritionData = async () => {
            if (!userId) return;

            try {
                // Get today's date
                const today = new Date().toISOString().split('T')[0];

                // Fetch today's logs
                const { data: logs } = await supabase
                    .from('nutrition_logs')
                    .select('calories, protein_g, carbs_g, fats_g')
                    .eq('user_id', userId)
                    .eq('log_date', today);

                // Fetch user's nutrition goals
                const { data: goals } = await supabase
                    .from('nutrition_goals')
                    .select('daily_calories, protein_g, carbs_g, fats_g')
                    .eq('user_id', userId)
                    .single();

                // Calculate consumed totals
                const consumed = (logs || []).reduce(
                    (acc: { calories: number; protein: number; carbs: number; fats: number }, log: any) => ({
                        calories: acc.calories + (log.calories || 0),
                        protein: acc.protein + (log.protein_g || 0),
                        carbs: acc.carbs + (log.carbs_g || 0),
                        fats: acc.fats + (log.fats_g || 0)
                    }),
                    { calories: 0, protein: 0, carbs: 0, fats: 0 }
                );

                setData({
                    consumed,
                    goals: {
                        calories: goals?.daily_calories || 2000,
                        protein: goals?.protein_g || 150,
                        carbs: goals?.carbs_g || 250,
                        fats: goals?.fats_g || 60
                    }
                });
            } catch (error) {
                console.error('Error fetching nutrition data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNutritionData();
    }, [userId]);

    if (loading) {
        return (
            <div className="rounded-2xl p-6 border border-white/5" style={{ background: '#1c2128' }}>
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-white/5 rounded w-1/2" />
                    <div className="h-24 bg-white/5 rounded" />
                </div>
            </div>
        );
    }

    const caloriePercentage = data
        ? Math.min(100, Math.round((data.consumed.calories / data.goals.calories) * 100))
        : 0;

    const macros = data
        ? [
            {
                label: 'Proteína',
                icon: Beef,
                consumed: Math.round(data.consumed.protein),
                goal: data.goals.protein,
                color: 'text-red-400',
                bgColor: 'bg-red-500/20'
            },
            {
                label: 'Carbos',
                icon: Wheat,
                consumed: Math.round(data.consumed.carbs),
                goal: data.goals.carbs,
                color: 'text-yellow-400',
                bgColor: 'bg-yellow-500/20'
            },
            {
                label: 'Gorduras',
                icon: Droplet,
                consumed: Math.round(data.consumed.fats),
                goal: data.goals.fats,
                color: 'text-purple-400',
                bgColor: 'bg-purple-500/20'
            }
        ]
        : [];

    return (
        <Link
            href="/nutrition"
            className="rounded-2xl p-6 border border-white/5 hover:border-white/10 
                       transition-all duration-300 hover:scale-[1.01] cursor-pointer group"
            style={{ background: '#1c2128' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <Utensils size={18} className="text-orange-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Nutrição Hoje</h2>
                </div>
                <ChevronRight
                    size={20}
                    className="text-gray-500 group-hover:text-gray-300 transition-colors"
                />
            </div>

            {/* Calories Progress */}
            <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Flame size={16} className="text-orange-400" />
                        <span className="text-sm text-gray-400">Calorias</span>
                    </div>
                    <span className="text-sm font-bold text-white">
                        {data?.consumed.calories || 0} / {data?.goals.calories || 2000}
                    </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
                        style={{ width: `${caloriePercentage}%` }}
                    />
                </div>
            </div>

            {/* Macros Grid */}
            <div className="grid grid-cols-3 gap-2">
                {macros.map((macro) => (
                    <div
                        key={macro.label}
                        className="bg-white/5 rounded-xl p-3 text-center hover:bg-white/10 transition-colors"
                    >
                        <macro.icon size={16} className={`mx-auto mb-1 ${macro.color}`} />
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                            {macro.label}
                        </p>
                        <p className="text-xs font-bold text-white">
                            {macro.consumed}
                            <span className="text-gray-600">/{macro.goal}g</span>
                        </p>
                    </div>
                ))}
            </div>
        </Link>
    );
}
