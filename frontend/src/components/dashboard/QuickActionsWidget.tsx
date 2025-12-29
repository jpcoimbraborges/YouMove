'use client';

import Link from 'next/link';
import { LucideIcon, Brain, Utensils, TrendingUp, Dumbbell, Calendar, ChefHat } from 'lucide-react';

interface QuickAction {
    id: string;
    label: string;
    icon: LucideIcon;
    href: string;
    color: string;
    bgGradient: string;
    iconBg: string;
}

const quickActions: QuickAction[] = [
    {
        id: 'ai-workout',
        label: 'Treino IA',
        icon: Brain,
        href: '/workout?mode=ai',
        color: 'text-cyan-400',
        bgGradient: 'from-cyan-600/20 to-blue-600/20',
        iconBg: 'bg-cyan-500/20'
    },
    {
        id: 'log-meal',
        label: 'Registrar Refeição',
        icon: Utensils,
        href: '/nutrition',
        color: 'text-orange-400',
        bgGradient: 'from-orange-600/20 to-red-600/20',
        iconBg: 'bg-orange-500/20'
    },
    {
        id: 'recipes-library',
        label: 'Receitas Fit',
        icon: ChefHat,
        href: '/nutrition/recipes',
        color: 'text-purple-400',
        bgGradient: 'from-purple-600/20 to-pink-600/20',
        iconBg: 'bg-purple-500/20'
    },
    {
        id: 'view-progress',
        label: 'Ver Progresso',
        icon: TrendingUp,
        href: '/progress',
        color: 'text-green-400',
        bgGradient: 'from-green-600/20 to-emerald-600/20',
        iconBg: 'bg-green-500/20'
    }
];

export function QuickActionsWidget() {
    return (
        <div className="rounded-2xl p-6 border border-white/5" style={{ background: '#1c2128' }}>
            <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Dumbbell size={18} className="text-blue-400" />
                </div>
                <h2 className="text-lg font-bold text-white">Quick Actions</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                    <Link
                        key={action.id}
                        href={action.href}
                        className="group relative overflow-hidden rounded-xl p-4 border border-white/5 
                                   hover:border-white/10 transition-all duration-300 hover:scale-[1.02] 
                                   active:scale-95 cursor-pointer"
                    >
                        {/* Gradient background on hover */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${action.bgGradient} 
                                         opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                        {/* Content */}
                        <div className="relative z-10 flex flex-col items-center text-center gap-3">
                            <div className={`w-12 h-12 rounded-xl ${action.iconBg} 
                                            flex items-center justify-center 
                                            group-hover:scale-110 transition-transform duration-300
                                            border border-white/10`}>
                                <action.icon size={24} className={action.color} strokeWidth={2} />
                            </div>
                            <span className="text-sm font-medium text-gray-300 
                                           group-hover:text-white transition-colors">
                                {action.label}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
