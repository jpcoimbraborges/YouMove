'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { calculateCalories } from '@/lib/calorie-calculator';
import {
    Dumbbell,
    Plus,
    Trash2,
    Clock,
    ChevronRight,
    Activity,
    Zap,
    Save,
    Heart,
    Waves,
    Flame,
    StretchVertical,
    Sparkles,
    Target,
    TrendingUp,
    Grip,
    LayoutGrid,
    Calendar,
    Users,
    ArrowLeft,
    Pencil,
    FileUp,
    X
} from 'lucide-react';

// Navigation items
const navItems = [
    { icon: LayoutGrid, label: 'Dashboard', href: '/dashboard', active: false },
    { icon: Calendar, label: 'Histórico', href: '/history', active: false },
    { icon: Dumbbell, label: 'Treinos', href: '/workout', active: true },
    { icon: TrendingUp, label: 'Progresso', href: '/progress', active: false },
    { icon: Users, label: 'Comunidade', href: '/community', active: false },
];

type WorkoutType = 'strength' | 'cardio' | 'flexibility' | 'mixed';

interface Exercise {
    id: string;
    name: string;
    sets: number;
    reps: number;
    weight_kg: number;
    rest_seconds: number;
}

const muscleGroups = [
    { id: 'chest', name: 'Peito' },
    { id: 'back', name: 'Costas' },
    { id: 'shoulders', name: 'Ombros' },
    { id: 'biceps', name: 'Bíceps' },
    { id: 'triceps', name: 'Tríceps' },
    { id: 'quadriceps', name: 'Pernas' },  // Changed from 'legs' to valid DB enum
    { id: 'glutes', name: 'Glúteos' },
    { id: 'core', name: 'Core' },
    { id: 'cardio', name: 'Cardio' }, // Added Cardio
    { id: 'full_body', name: 'Full Body' },
];

const workoutTypes = [
    { id: 'strength', name: 'Força', icon: Dumbbell, description: 'Musculação' },
    { id: 'cardio', name: 'Cardio', icon: Heart, description: 'Aeróbico' },
    { id: 'flexibility', name: 'Flex', icon: StretchVertical, description: 'Alongamento' },
    { id: 'mixed', name: 'Misto', icon: Sparkles, description: 'Combinado' },
];

const popularExercises: Record<string, string[]> = {
    chest: ['Supino Reto', 'Supino Inclinado', 'Crucifixo', 'Flexão', 'Voador', 'Crossover', 'Pullover'],
    back: ['Puxada', 'Remada Curvada', 'Remada Baixa', 'Barra Fixa', 'Serrote', 'Remada Cavalinho', 'Pullover', 'Face Pull', 'Encolhimento'],
    shoulders: ['Desenvolvimento', 'Desenvolvimento Arnold', 'Elevação Lateral', 'Elevação Frontal', 'Crucifixo Inverso', 'Face Pull', 'Encolhimento'],
    biceps: ['Rosca Direta', 'Rosca Martelo', 'Rosca Scott', 'Rosca Concentrada', 'Rosca 21'],
    triceps: ['Tríceps Pulley', 'Tríceps Testa', 'Tríceps Corda', 'Tríceps Francês', 'Mergulho'],
    quadriceps: ['Agachamento', 'Leg Press', 'Hack', 'Extensora', 'Flexora', 'Stiff', 'Passada', 'Búlgaro', 'Panturrilha'],
    glutes: ['Hip Thrust', 'Elevação Pélvica', 'Coice', 'Cadeira Abdutora', 'Abdução', 'Agachamento Sumô', 'Ponte'],
    core: ['Prancha', 'Prancha Lateral', 'Abdominal Supra', 'Abdominal Bicicleta', 'Infra', 'Infra na Barra', 'Remador', 'Russian Twist', 'Super-Homem', 'Extensão Lombar'],
    cardio: [
        'Esteira', 'Bicicleta', 'Elíptico', 'Simulador de Escada', 'Remo', // Machines
        'Pular Corda', 'Polichinelo', 'Burpee', 'Mountain Climber', 'Corrida Estacionária', // Bodyweight
        'Corrida de Rua', 'Caminhada', 'Natação', 'Ciclismo' // Outdoor
    ],
    full_body: ['Burpee', 'Thruster', 'Clean', 'Snatch', 'Kettlebell Swing', 'Russian Twist'],
};

export default function NewWorkoutPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);
    const [workoutType, setWorkoutType] = useState<WorkoutType>('strength');
    const [workoutName, setWorkoutName] = useState('');
    const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [showExerciseSelector, setShowExerciseSelector] = useState(false);
    const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

    const generateId = () => Math.random().toString(36).substring(2, 9);

    const addExercise = (name: string) => {
        setExercises(prev => [...prev, {
            id: generateId(),
            name,
            sets: 3,
            reps: 12,
            weight_kg: 0,
            rest_seconds: 60,
        }]);
        setShowExerciseSelector(false);
    };

    const addCustomExercise = () => {
        const name = prompt('Nome do exercício:');
        if (name) addExercise(name);
    };

    const removeExercise = (id: string) => {
        setExercises(prev => prev.filter(e => e.id !== id));
    };

    const updateExercise = (id: string, field: keyof Exercise, value: any) => {
        setExercises(prev => prev.map(e =>
            e.id === id ? { ...e, [field]: value } : e
        ));
    };

    const toggleMuscle = (muscleId: string) => {
        setSelectedMuscles(prev =>
            prev.includes(muscleId)
                ? prev.filter(m => m !== muscleId)
                : [...prev, muscleId]
        );
    };

    const calculateEstimatedDuration = () => {
        if (exercises.length === 0) return 45; // Default if no exercises

        let total = 0;
        exercises.forEach(ex => {
            // Estimate: each set takes ~45 seconds + rest time
            total += ex.sets * 45 + (ex.sets - 1) * ex.rest_seconds;
        });

        const minutes = Math.round(total / 60);

        // Ensure it's within database constraints (15-180 minutes)
        return Math.max(15, Math.min(180, minutes));
    };



    const [userWeight, setUserWeight] = useState<number>(70);

    // Fetch user profile weight
    useEffect(() => {
        const fetchWeight = async () => {
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('weight_kg')
                    .eq('id', user.id)
                    .single();

                if (data?.weight_kg) {
                    setUserWeight(data.weight_kg);
                }
            }
        };
        fetchWeight();
    }, [user]);

    const calculateEstimatedCalories = () => {
        return calculateCalories(exercises, userWeight);
    };


    const handleSave = async () => {
        if (!user) {
            alert('Você precisa estar logado para salvar treinos');
            return;
        }
        if (!workoutName.trim()) {
            alert('Digite um nome para o treino');
            return;
        }
        if (exercises.length === 0) {
            alert('Adicione pelo menos um exercício');
            return;
        }
        if (selectedMuscles.length === 0) {
            alert('Selecione pelo menos um grupo muscular');
            return;
        }

        setSaving(true);
        try {
            // Map frontend types to backend enums
            const mapWorkoutType = (type: string) => {
                if (type === 'mixed') return 'custom';
                if (type === 'flexibility') return 'flexibility';
                if (type === 'cardio') return 'cardio';
                return 'strength';
            };

            const mapMuscleGroups = (muscles: string[]) => {
                const mapped: string[] = [];
                muscles.forEach(m => {
                    if (m === 'legs') {
                        mapped.push('quadriceps', 'hamstrings');
                    } else if (m !== 'cardio') { // Filter out 'cardio' as it's not a muscle enum
                        mapped.push(m);
                    }
                });

                // If list is empty (e.g. only 'cardio' was selected), default to 'full_body'
                if (mapped.length === 0) {
                    mapped.push('full_body');
                }

                return [...new Set(mapped)];
            };

            const workoutData = {
                user_id: user.id,
                name: workoutName,
                workout_type: mapWorkoutType(workoutType),
                difficulty: 'intermediate',
                target_muscles: mapMuscleGroups(selectedMuscles),
                exercises: exercises.map(ex => ({
                    exercise_id: null,
                    name: ex.name,
                    exercise_name: ex.name,
                    sets: ex.sets,
                    target_reps: ex.reps,
                    reps: ex.reps,
                    weight_kg: ex.weight_kg,
                    rest_seconds: ex.rest_seconds,
                    is_cardio: workoutType === 'cardio',
                })),
                avg_duration_minutes: calculateEstimatedDuration() || 45,
                is_active: true,
                is_public: false,
            };

            console.log('Saving workout:', workoutData);

            const { data, error } = await supabase
                .from('workouts')
                .insert(workoutData)
                .select()
                .single();

            if (error) {
                console.error('Supabase error details:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                throw new Error(error.message || 'Erro ao salvar no banco de dados');
            }

            if (!data) {
                throw new Error('Nenhum dado retornado após salvar');
            }

            console.log('Workout saved successfully:', data);

            // Show success message
            alert('✅ Treino salvo com sucesso!');

            // Navigate to workout list
            router.push('/workout');

        } catch (error: any) {
            console.error('Error saving workout:', error);
            alert(`❌ Erro ao salvar treino:\n\n${error.message}\n\nVerifique o console para mais detalhes.`);
        } finally {
            setSaving(false);
        }
    };

    const handleMagicFill = async () => {
        // Simple AI suggestion for workout name based on muscles
        if (selectedMuscles.length > 0) {
            const muscleNames = selectedMuscles.map(m =>
                muscleGroups.find(mg => mg.id === m)?.name
            ).filter(Boolean).join(' + ');
            setWorkoutName(`Treino ${muscleNames}`);
        } else {
            setWorkoutName('Treino do Dia');
        }
    };

    return (
        <div className="h-screen flex overflow-hidden" style={{ background: '#0B0E14' }}>
            {/* Sidebar - Desktop Only */}
            <aside className="hidden lg:flex flex-col w-56 p-5 border-r border-white/5" style={{ background: '#111318' }}>
                <div className="flex items-center gap-2 mb-10">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#3b82f6' }}>
                        <span className="text-white font-bold text-lg">Y</span>
                    </div>
                    <span className="text-white font-semibold text-lg">YouMove</span>
                </div>

                <nav className="flex flex-col gap-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.active
                                ? 'text-white shadow-lg shadow-blue-500/20'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                            style={item.active ? { background: '#3b82f6' } : {}}
                        >
                            <item.icon size={20} strokeWidth={1.5} />
                            <span className="font-medium text-sm">{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 pb-40 lg:pb-24 overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-30 p-4 lg:p-6 border-b border-white/5 backdrop-blur-xl" style={{ background: 'rgba(11, 14, 20, 0.9)' }}>
                    <div className="flex items-center justify-between max-w-4xl mx-auto">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <h1 className="text-xl lg:text-2xl font-bold text-white">Criar Novo Treino</h1>
                        </div>
                        <button className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-all">
                            <FileUp size={16} />
                            <span className="hidden sm:inline">Importar de Anterior</span>
                        </button>
                    </div>
                </div>

                <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-8">
                    {/* Workout Name - Display Text Input */}
                    <div className="relative">
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={workoutName}
                                onChange={(e) => setWorkoutName(e.target.value)}
                                placeholder="Dê um nome ao seu treino..."
                                className="flex-1 bg-transparent border-0 text-white text-2xl lg:text-3xl font-bold placeholder-gray-600 focus:outline-none"
                            />
                            <button
                                onClick={handleMagicFill}
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-yellow-500 hover:bg-yellow-500/10 transition-all"
                                title="Preencher com IA"
                            >
                                <Sparkles size={20} />
                            </button>
                            <Pencil size={18} className="text-gray-600" />
                        </div>
                        <div className="h-px bg-white/10 mt-3" />
                    </div>

                    {/* Workout Type - Selection Grid */}
                    <div>
                        <label className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4 block">
                            Tipo de Treino
                        </label>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {workoutTypes.map(type => {
                                const IconComponent = type.icon;
                                const isSelected = workoutType === type.id;
                                return (
                                    <button
                                        key={type.id}
                                        onClick={() => setWorkoutType(type.id as WorkoutType)}
                                        className={`p-5 rounded-2xl flex flex-col items-center gap-3 transition-all duration-200 border ${isSelected
                                            ? 'border-blue-500 bg-blue-500/10'
                                            : 'border-transparent hover:border-gray-700'
                                            }`}
                                        style={{ background: isSelected ? 'rgba(59, 130, 246, 0.1)' : '#1F2937' }}
                                    >
                                        <IconComponent
                                            size={28}
                                            className={isSelected ? 'text-blue-400' : 'text-gray-400'}
                                            strokeWidth={1.5}
                                        />
                                        <div className="text-center">
                                            <span className={`block font-semibold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                                {type.name}
                                            </span>
                                            <span className="text-xs text-gray-500">{type.description}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Target Muscles - Multi-select Chips */}
                    <div>
                        <label className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4 block">
                            Músculos Alvo
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {muscleGroups.map(muscle => {
                                const isSelected = selectedMuscles.includes(muscle.id);
                                return (
                                    <button
                                        key={muscle.id}
                                        onClick={() => toggleMuscle(muscle.id)}
                                        className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 min-h-[44px] ${isSelected
                                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                            : 'bg-[#1F2937] text-gray-400 hover:bg-[#2a3544] hover:text-white'
                                            }`}
                                    >
                                        {muscle.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Exercise Builder Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                                Rotina de Exercícios
                            </label>
                            <span className="text-sm text-gray-500">{exercises.length} exercícios</span>
                        </div>

                        {/* Exercise List or Empty State */}
                        {exercises.length === 0 ? (
                            <div
                                className="border-2 border-dashed border-gray-700 rounded-2xl p-10 text-center"
                                style={{ background: 'rgba(31, 41, 55, 0.3)' }}
                            >
                                <Dumbbell size={48} className="text-gray-600 mx-auto mb-4" strokeWidth={1} />
                                <p className="text-gray-400 font-medium mb-1">Seu treino está vazio</p>
                                <p className="text-gray-600 text-sm">Adicione o primeiro exercício</p>
                            </div>
                        ) : (
                            <div className="space-y-3 mb-4">
                                {exercises.map((exercise, index) => (
                                    <div
                                        key={exercise.id}
                                        className="rounded-2xl overflow-hidden transition-all"
                                        style={{ background: '#1F2937' }}
                                    >
                                        <button
                                            onClick={() => setExpandedExercise(expandedExercise === exercise.id ? null : exercise.id)}
                                            className="w-full p-4 flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                                    <span className="text-sm font-bold text-blue-400">{index + 1}</span>
                                                </div>
                                                <div className="text-left">
                                                    <span className="font-semibold text-white block">{exercise.name}</span>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                        <span>{exercise.sets} séries</span>
                                                        <span>•</span>
                                                        <span>{exercise.reps} reps</span>
                                                        {exercise.weight_kg > 0 && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="text-blue-400">{exercise.weight_kg}kg</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight
                                                size={18}
                                                className={`text-gray-500 transition-transform ${expandedExercise === exercise.id ? 'rotate-90' : ''}`}
                                            />
                                        </button>

                                        {/* Expanded Details */}
                                        {expandedExercise === exercise.id && (
                                            <div className="px-4 pb-4 border-t border-white/5 pt-4">
                                                <div className="grid grid-cols-4 gap-2 mb-4">
                                                    {[
                                                        { label: 'Séries', field: 'sets', value: exercise.sets },
                                                        { label: 'Reps', field: 'reps', value: exercise.reps },
                                                        { label: 'Peso (kg)', field: 'weight_kg', value: exercise.weight_kg },
                                                        { label: 'Desc (s)', field: 'rest_seconds', value: exercise.rest_seconds },
                                                    ].map(item => (
                                                        <div key={item.field}>
                                                            <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">{item.label}</label>
                                                            <input
                                                                type="number"
                                                                value={item.value}
                                                                onChange={(e) => updateExercise(exercise.id, item.field as keyof Exercise, Number(e.target.value))}
                                                                className="w-full px-2 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white text-center text-sm font-bold focus:outline-none focus:border-blue-500/50"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                                <button
                                                    onClick={() => removeExercise(exercise.id)}
                                                    className="w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all"
                                                >
                                                    <Trash2 size={14} /> Remover
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add Exercise Button */}
                        <button
                            onClick={() => setShowExerciseSelector(!showExerciseSelector)}
                            className="w-full py-4 rounded-2xl border border-blue-500/30 text-blue-400 font-medium flex items-center justify-center gap-2 hover:bg-blue-500/10 transition-all min-h-[56px]"
                            style={{ background: 'transparent' }}
                        >
                            <Plus size={20} />
                            Adicionar Exercício
                        </button>

                        {/* Exercise Selector Modal */}
                        {showExerciseSelector && (
                            <div className="mt-4 rounded-2xl p-5 border border-white/5" style={{ background: '#1F2937' }}>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-medium text-gray-400">Selecione um exercício</span>
                                    <button
                                        onClick={() => setShowExerciseSelector(false)}
                                        className="text-gray-500 hover:text-white"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                {selectedMuscles.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Target size={32} className="mx-auto mb-3 text-gray-600" />
                                        <p className="text-gray-500 text-sm">Selecione um músculo alvo primeiro</p>
                                    </div>
                                ) : (
                                    <div className="max-h-64 overflow-y-auto space-y-4">
                                        {selectedMuscles.map(muscle => (
                                            <div key={muscle}>
                                                <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">
                                                    {muscleGroups.find(m => m.id === muscle)?.name}
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {popularExercises[muscle]?.map(ex => (
                                                        <button
                                                            key={ex}
                                                            onClick={() => addExercise(ex)}
                                                            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition-all flex items-center gap-2"
                                                        >
                                                            <Plus size={12} className="text-blue-400" />
                                                            {ex}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            onClick={addCustomExercise}
                                            className="w-full py-3 rounded-xl border border-dashed border-gray-600 text-gray-400 text-sm hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Sparkles size={14} /> Exercício Personalizado
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sticky Footer */}
                <div className="fixed bottom-[72px] lg:bottom-0 left-0 lg:left-56 right-0 z-40 p-4 lg:p-6 border-t border-white/5 backdrop-blur-xl" style={{ background: 'rgba(11, 14, 20, 0.95)' }}>
                    <div className="max-w-4xl mx-auto flex flex-col lg:flex-row items-center gap-4">
                        {/* Estimates */}
                        <div className="flex items-center gap-6 text-sm text-gray-400">
                            <span className="flex items-center gap-2">
                                <Clock size={16} className="text-blue-400" />
                                Est: {calculateEstimatedDuration() || 0} min
                            </span>
                            <span className="flex items-center gap-2">
                                <Flame size={16} className="text-orange-400" />
                                {calculateEstimatedCalories()} kcal
                            </span>
                        </div>

                        <div className="flex-1" />

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <button
                                onClick={() => router.back()}
                                className="flex-1 lg:flex-none px-6 py-3.5 rounded-xl text-gray-400 hover:text-white font-medium transition-all min-h-[48px]"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 lg:flex-none px-8 py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 min-h-[48px]"
                                style={{
                                    background: '#3b82f6',
                                    boxShadow: '0 0 30px rgba(59, 130, 246, 0.4)'
                                }}
                            >
                                {saving ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Salvar Treino
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </main>


        </div>
    );
}
