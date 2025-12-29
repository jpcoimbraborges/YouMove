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
    const maxCalories = Math.max(...data.map(d => d.calories), 500); // Min scale 500

    return (
        <div className={`bg-[#1F2937] p-6 rounded-3xl border border-white/5 ${className}`}>
            <div className="flex justify-between items-start mb-6">
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
            <div className="relative h-48 w-full mt-4">
                {totalCalories > 0 ? (
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="calorieGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f97316" stopOpacity="0.5" />
                                <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                            </linearGradient>
                        </defs>

                        {/* Grid Lines */}
                        <line x1="0" y1="25" x2="100" y2="25" stroke="#ffffff10" strokeWidth="0.5" />
                        <line x1="0" y1="50" x2="100" y2="50" stroke="#ffffff10" strokeWidth="0.5" />
                        <line x1="0" y1="75" x2="100" y2="75" stroke="#ffffff10" strokeWidth="0.5" />

                        {/* Area Path */}
                        <path
                            d={`M 0,100 ${data.map((d, i) =>
                                `L ${(i / (data.length - 1)) * 100},${100 - (d.calories / maxCalories) * 90}`
                            ).join(' ')} L 100,100 Z`}
                            fill="url(#calorieGradient)"
                        />

                        {/* Line Path */}
                        <path
                            d={`M 0,${100 - (data.length > 0 ? (data[0].calories / maxCalories) * 90 : 0)} ${data.map((d, i) =>
                                `L ${(i / (data.length - 1)) * 100},${100 - (d.calories / maxCalories) * 90}`
                            ).join(' ')}`}
                            fill="none"
                            stroke="#f97316"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Points */}
                        {data.map((d, i) => (
                            <circle
                                key={i}
                                cx={(i / (data.length - 1)) * 100}
                                cy={100 - (d.calories / maxCalories) * 90}
                                r="2"
                                className="fill-[#1F2937] stroke-orange-500 transition-all duration-300 hover:r-4 hover:fill-orange-500"
                                strokeWidth="1.5"
                            >
                                <title>{d.calories} kcal</title>
                            </circle>
                        ))}
                    </svg>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-600 text-sm">
                        Sem dados de calorias esta semana
                    </div>
                )}
            </div>

            {/* X Axis Labels */}
            <div className="flex justify-between mt-4">
                {data.map((d, i) => (
                    <span key={i} className="text-[10px] uppercase text-gray-500 font-medium text-center w-8">
                        {d.day}
                    </span>
                ))}
            </div>
        </div>
    );
}
