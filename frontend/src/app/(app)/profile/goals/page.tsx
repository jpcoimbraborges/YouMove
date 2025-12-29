'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Target, TrendingDown, Dumbbell, Zap, Heart, Activity, Maximize, Save, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type GoalType = 'lose_weight' | 'build_muscle' | 'improve_endurance' | 'increase_strength' | 'general_fitness' | 'flexibility' | 'sport_specific';

interface Goal {
    id: GoalType;
    title: string;
    description: string;
    icon: any;
    color: string;
}

const goals: Goal[] = [
    {
        id: 'lose_weight',
        title: 'Perder Peso',
        description: 'Queimar gordura e reduzir medidas',
        icon: TrendingDown,
        color: '#EF4444'
    },
    {
        id: 'build_muscle',
        title: 'Ganhar Massa',
        description: 'Hipertrofia e ganho muscular',
        icon: Dumbbell,
        color: '#3B82F6'
    },
    {
        id: 'increase_strength',
        title: 'Aumentar Força',
        description: 'Melhorar força e potência',
        icon: Zap,
        color: '#F59E0B'
    },
    {
        id: 'improve_endurance',
        title: 'Melhorar Resistência',
        description: 'Aumentar capacidade cardiovascular',
        icon: Heart,
        color: '#EC4899'
    },
    {
        id: 'general_fitness',
        title: 'Fitness Geral',
        description: 'Saúde e bem-estar geral',
        icon: Activity,
        color: '#10B981'
    },
    {
        id: 'flexibility',
        title: 'Flexibilidade',
        description: 'Aumentar mobilidade e alongamento',
        icon: Maximize,
        color: '#8B5CF6'
    }
];

export default function GoalsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<GoalType | null>(null);

    useEffect(() => {
        const loadGoal = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('primary_goal')
                    .eq('id', user.id)
                    .single();

                if (profile?.primary_goal) {
                    setSelectedGoal(profile.primary_goal as GoalType);
                }
            } catch (error) {
                console.error('Error loading goal:', error);
            } finally {
                setLoading(false);
            }
        };

        loadGoal();
    }, [user]);

    const handleSave = async () => {
        if (!user || !selectedGoal) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ primary_goal: selectedGoal })
                .eq('id', user.id);

            if (error) throw error;

            alert('✅ Objetivo salvo com sucesso!');
            router.push('/profile');
        } catch (error: any) {
            console.error('Error saving:', error);
            alert('❌ Erro ao salvar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0E14' }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    <p className="text-gray-400 text-sm">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ background: '#0B0E14' }}>
            {/* Header */}
            <div className="sticky top-0 z-30 p-4 lg:p-6 border-b border-white/5 backdrop-blur-xl" style={{ background: 'rgba(11, 14, 20, 0.9)' }}>
                <div className="flex items-center gap-4 max-w-3xl mx-auto">
                    <button
                        onClick={() => router.push('/profile')}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl lg:text-2xl font-bold text-white">Meus Objetivos</h1>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 lg:p-8 pb-28 max-w-3xl mx-auto">
                {/* Description */}
                <div className="rounded-2xl p-4 border border-blue-500/20 mb-6" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/20 flex-shrink-0">
                            <Target size={20} className="text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-white font-semibold mb-1">Defina Seu Objetivo</h2>
                            <p className="text-sm text-gray-400">
                                Escolha seu principal objetivo de treino. Isso nos ajudará a personalizar recomendações e treinos IA.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Goals Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {goals.map((goal) => {
                        const Icon = goal.icon;
                        const isSelected = selectedGoal === goal.id;

                        return (
                            <button
                                key={goal.id}
                                onClick={() => setSelectedGoal(goal.id)}
                                className={`relative rounded-2xl p-5 text-left transition-all border-2 ${isSelected
                                        ? 'border-blue-500'
                                        : 'border-white/10 hover:border-white/20'
                                    }`}
                                style={{
                                    background: isSelected ? 'rgba(59, 130, 246, 0.1)' : '#1F2937'
                                }}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{ background: `${goal.color}20` }}
                                    >
                                        <Icon size={24} style={{ color: goal.color }} />
                                    </div>
                                    {isSelected && (
                                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                            <Check size={14} className="text-white" />
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">{goal.title}</h3>
                                <p className="text-sm text-gray-400">{goal.description}</p>
                            </button>
                        );
                    })}
                </div>

                {/* Selected Goal Info */}
                {selectedGoal && (
                    <div className="rounded-2xl p-5 border border-white/5 mb-6" style={{ background: '#1F2937' }}>
                        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            Objetivo Selecionado
                        </h3>
                        <p className="text-gray-400 text-sm mb-4">
                            {goals.find(g => g.id === selectedGoal)?.title}
                        </p>
                        <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
                            <p className="text-xs text-blue-400">
                                💡 Nosso Coach IA criará treinos personalizados focados neste objetivo!
                            </p>
                        </div>
                    </div>
                )}

                {/* Tips */}
                <div className="rounded-xl p-4 border border-white/5 mb-6" style={{ background: '#1F2937' }}>
                    <h4 className="text-white font-semibold mb-3 text-sm">💪 Dicas para Alcançar Seu Objetivo</h4>
                    <ul className="space-y-2 text-sm text-gray-400">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5">•</span>
                            <span>Mantenha consistência nos treinos (pelo menos 3x por semana)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5">•</span>
                            <span>Acompanhe seu progresso regularmente</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5">•</span>
                            <span>Use treinos IA personalizados para otimizar resultados</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5">•</span>
                            <span>Descanse adequadamente entre treinos</span>
                        </li>
                    </ul>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving || !selectedGoal}
                    className="w-full py-4 rounded-xl font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{
                        background: '#3b82f6',
                        boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
                    }}
                >
                    {saving ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Save size={20} />
                            Salvar Objetivo
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
