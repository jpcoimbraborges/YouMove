'use client';

import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';

interface DayData {
    day: string;
    calories: number;
    date: string;
}

interface CalorieChartProps {
    data: DayData[];
    totalCalories: number;
    className?: string;
}

export function CalorieChart({ data, totalCalories, className = '' }: CalorieChartProps) {
    const [animated, setAnimated] = useState(false);

    useEffect(() => {
        // Trigger animation after mount
        const timer = setTimeout(() => setAnimated(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const maxCalories = Math.max(...data.map(d => d.calories), 500); // Min scale 500

    return (
        <div className={`bg-[#1F2937] p-6 rounded-3xl border border-white/5 ${className}`}>
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h3 className="font-bold text-white text-lg flex items-center gap-2 mb-1">
                        <Flame className="text-orange-500 fill-orange-500" size={20} />
                        Gasto Calórico
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">Últimos 7 dias</p>
                </div>

                <div className="text-right">
                    <p className="text-3xl font-bold text-white tabular-nums tracking-tight">
                        {totalCalories.toLocaleString()}
                        <span className="text-sm text-orange-500 font-normal ml-1">kcal</span>
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Total da Semana</p>
                </div>
            </div>

            {/* Chart Area */}
            <div className="flex items-end justify-between h-48 gap-2">
                {data.map((item, index) => {
                    const heightPercentage = (item.calories / maxCalories) * 100;
                    const isToday = new Date().toISOString().startsWith(item.date); // Simple check, assuming ISO strings match

                    return (
                        <div key={index} className="flex-1 flex flex-col items-center gap-3 group relative">
                            {/* Tooltip */}
                            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap z-10 pointer-events-none">
                                {item.calories} kcal
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-orange-500 rotate-45" />
                            </div>

                            {/* Bar Container */}
                            <div className="w-full relative h-full flex items-end justify-center">
                                {/* Bar Track */}
                                <div className="absolute bottom-0 w-2 lg:w-3 h-full bg-white/5 rounded-full" />

                                {/* Active Bar */}
                                <div
                                    className={`w-2 lg:w-3 rounded-full relative transition-all duration-1000 ease-out ${isToday
                                            ? 'bg-gradient-to-t from-orange-600 to-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.5)]'
                                            : 'bg-white/10 group-hover:bg-orange-500/80'
                                        }`}
                                    style={{
                                        height: animated ? `${Math.max(heightPercentage, 0)}%` : '0%',
                                    }}
                                >
                                    {/* Top Glow/Cap */}
                                    {item.calories > 0 && (
                                        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full aspect-square rounded-full ${isToday ? 'bg-orange-300' : 'bg-white/30'
                                            }`} />
                                    )}
                                </div>
                            </div>

                            {/* Label */}
                            <span className={`text-[10px] font-bold uppercase ${isToday ? 'text-orange-500' : 'text-gray-500'
                                }`}>
                                {item.day}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
