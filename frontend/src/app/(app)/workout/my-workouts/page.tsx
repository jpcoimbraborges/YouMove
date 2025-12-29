'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
    Dumbbell,
    Clock,
    Target,
    Play,
    Trash2,
    MoreVertical,
    Sparkles,
    Calendar,
    ChevronRight,
    Plus
} from 'lucide-react';

interface Workout {
    id: string;
    name: string;
    difficulty: string;
    target_muscles: string[];
    exercises: any[];
    is_ai_generated: boolean;
    avg_duration_minutes: number;
    created_at: string;
}

export default function MyWorkoutsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        const fetchWorkouts = async () => {
            if (!user || !supabase?.from) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('workouts')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching workouts:', error);
            } else {
                setWorkouts(data || []);
            }
            setLoading(false);
        };

        fetchWorkouts();
    }, [user]);

    const handleDelete = async (id: string) => {
        const { error } = await supabase
            .from('workouts')
            .delete()
            .eq('id', id);

        if (!error) {
            setWorkouts(workouts.filter(w => w.id !== id));
        }
        setDeleteConfirm(null);
    };

    const handleStartWorkout = (id: string) => {
        router.push(`/workout/active/${id}`);
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'beginner': return 'text-green-400 bg-green-500/20';
            case 'intermediate': return 'text-yellow-400 bg-yellow-500/20';
            case 'advanced': return 'text-orange-400 bg-orange-500/20';
            case 'elite': return 'text-red-400 bg-red-500/20';
            default: return 'text-gray-400 bg-gray-500/20';
        }
    };

    const getDifficultyLabel = (difficulty: string) => {
        const labels: Record<string, string> = {
            'beginner': 'Iniciante',
            'intermediate': 'Intermediário',
            'advanced': 'Avançado',
            'elite': 'Elite'
        };
        return labels[difficulty] || difficulty;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short'
        });
    };

    return (
        <div className="pb-24">
            <PageHeader title="Meus Treinos" showBack />

            <div className="px-5 py-4">
                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                        onClick={() => router.push('/workout/generate')}
                        className="card flex items-center gap-3 hover:bg-white/5 transition-colors"
                    >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-primary/20 flex items-center justify-center">
                            <Sparkles size={20} className="text-purple-400" />
                        </div>
                        <div className="text-left">
                            <p className="font-medium text-sm">Gerar com IA</p>
                            <p className="text-xs text-gray-500">Novo treino</p>
                        </div>
                    </button>
                    <button
                        onClick={() => router.push('/exercises')}
                        className="card flex items-center gap-3 hover:bg-white/5 transition-colors"
                    >
                        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                            <Dumbbell size={20} className="text-accent" />
                        </div>
                        <div className="text-left">
                            <p className="font-medium text-sm">Exercícios</p>
                            <p className="text-xs text-gray-500">Ver biblioteca</p>
                        </div>
                    </button>
                </div>

                {/* Workouts List */}
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                    Treinos Salvos ({workouts.length})
                </h2>

                {loading ? (
                    <div className="text-center py-12 text-gray-500">
                        Carregando treinos...
                    </div>
                ) : workouts.length === 0 ? (
                    <div className="text-center py-12">
                        <Dumbbell size={48} className="text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 mb-2">Nenhum treino salvo</p>
                        <p className="text-sm text-gray-500 mb-6">
                            Gere seu primeiro treino com IA!
                        </p>
                        <Button onClick={() => router.push('/workout/generate')}>
                            <Sparkles size={18} />
                            Gerar Treino
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {workouts.map((workout) => (
                            <div key={workout.id} className="card">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center shrink-0">
                                        {workout.is_ai_generated ? (
                                            <Sparkles size={24} className="text-purple-400" />
                                        ) : (
                                            <Dumbbell size={24} className="text-primary" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold truncate">{workout.name}</h3>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${getDifficultyColor(workout.difficulty)}`}>
                                                {getDifficultyLabel(workout.difficulty)}
                                            </span>
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Clock size={12} />
                                                {workout.avg_duration_minutes || workout.exercises?.length * 5}min
                                            </span>
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Target size={12} />
                                                {workout.exercises?.length || 0} exercícios
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                                            <Calendar size={12} />
                                            {formatDate(workout.created_at)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <Button
                                        onClick={() => handleStartWorkout(workout.id)}
                                        className="flex-1"
                                    >
                                        <Play size={16} />
                                        Iniciar
                                    </Button>
                                    <button
                                        onClick={() => setDeleteConfirm(workout.id)}
                                        className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                {/* Delete Confirmation */}
                                {deleteConfirm === workout.id && (
                                    <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                                        <p className="text-sm text-red-400 mb-3">Tem certeza que deseja excluir este treino?</p>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="secondary"
                                                onClick={() => setDeleteConfirm(null)}
                                                className="flex-1"
                                            >
                                                Cancelar
                                            </Button>
                                            <button
                                                onClick={() => handleDelete(workout.id)}
                                                className="flex-1 py-2 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                                            >
                                                Excluir
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
