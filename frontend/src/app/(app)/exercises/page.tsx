'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import {
    Search,
    Dumbbell,
    Target,
    ChevronRight,
    Filter,
    X
} from 'lucide-react';

interface Exercise {
    id: string;
    name: string;
    muscle: string;
    equipment: string;
    difficulty: string;
    instructions: string[];
}

const EXERCISES: Exercise[] = [
    {
        id: '1',
        name: 'Supino Reto',
        muscle: 'Peito',
        equipment: 'Barra',
        difficulty: 'Intermediário',
        instructions: [
            'Deite no banco com os pés apoiados no chão',
            'Segure a barra com pegada um pouco mais larga que os ombros',
            'Desça a barra controladamente até o peito',
            'Empurre a barra para cima até estender os braços'
        ]
    },
    {
        id: '2',
        name: 'Agachamento Livre',
        muscle: 'Pernas',
        equipment: 'Barra',
        difficulty: 'Intermediário',
        instructions: [
            'Posicione a barra sobre os trapézios',
            'Pés na largura dos ombros, pontas ligeiramente para fora',
            'Desça flexionando quadris e joelhos',
            'Mantenha o core ativado e costas retas',
            'Suba de forma explosiva'
        ]
    },
    {
        id: '3',
        name: 'Levantamento Terra',
        muscle: 'Costas',
        equipment: 'Barra',
        difficulty: 'Avançado',
        instructions: [
            'Fique de frente para a barra, pés na largura do quadril',
            'Flexione os quadris e joelhos para segurar a barra',
            'Mantenha a lombar neutra',
            'Levante a barra estendendo quadris e joelhos simultaneamente',
            'Retorne controladamente ao chão'
        ]
    },
    {
        id: '4',
        name: 'Rosca Direta',
        muscle: 'Bíceps',
        equipment: 'Barra/Halteres',
        difficulty: 'Iniciante',
        instructions: [
            'Em pé, segure a barra com pegada supinada',
            'Cotovelos próximos ao corpo',
            'Flexione os cotovelos levantando a barra',
            'Contraia o bíceps no topo',
            'Desça controladamente'
        ]
    },
    {
        id: '5',
        name: 'Tríceps Pulley',
        muscle: 'Tríceps',
        equipment: 'Cabo',
        difficulty: 'Iniciante',
        instructions: [
            'Fique de frente para o aparelho',
            'Segure a barra com pegada pronada',
            'Cotovelos junto ao corpo',
            'Estenda os cotovelos empurrando para baixo',
            'Retorne controladamente'
        ]
    },
    {
        id: '6',
        name: 'Desenvolvimento',
        muscle: 'Ombros',
        equipment: 'Halteres',
        difficulty: 'Intermediário',
        instructions: [
            'Sentado ou em pé, halteres ao lado dos ombros',
            'Empurre os pesos para cima',
            'Estenda completamente os braços',
            'Desça até a posição inicial'
        ]
    },
    {
        id: '7',
        name: 'Remada Curvada',
        muscle: 'Costas',
        equipment: 'Barra',
        difficulty: 'Intermediário',
        instructions: [
            'Incline o tronco para frente mantendo as costas retas',
            'Segure a barra com pegada pronada',
            'Puxe a barra em direção ao abdômen',
            'Contraia as escápulas no topo',
            'Retorne controladamente'
        ]
    },
    {
        id: '8',
        name: 'Leg Press',
        muscle: 'Pernas',
        equipment: 'Máquina',
        difficulty: 'Iniciante',
        instructions: [
            'Sente-se no aparelho com as costas apoiadas',
            'Pés na plataforma na largura dos ombros',
            'Flexione os joelhos descendo a plataforma',
            'Empurre de volta estendendo as pernas'
        ]
    },
    {
        id: '9',
        name: 'Cadeira Extensora',
        muscle: 'Quadríceps',
        equipment: 'Máquina',
        difficulty: 'Iniciante',
        instructions: [
            'Sente-se com as costas apoiadas',
            'Tornozelos sob o apoio',
            'Estenda os joelhos levantando o peso',
            'Contraia o quadríceps no topo',
            'Desça controladamente'
        ]
    },
    {
        id: '10',
        name: 'Crucifixo',
        muscle: 'Peito',
        equipment: 'Halteres',
        difficulty: 'Intermediário',
        instructions: [
            'Deite no banco com halteres acima do peito',
            'Braços levemente flexionados',
            'Abra os braços em arco até sentir o alongamento',
            'Retorne à posição inicial contraindo o peito'
        ]
    },
    {
        id: '11',
        name: 'Prancha',
        muscle: 'Core',
        equipment: 'Peso Corporal',
        difficulty: 'Iniciante',
        instructions: [
            'Apoie os antebraços e pontas dos pés no chão',
            'Corpo em linha reta da cabeça aos calcanhares',
            'Ative o core e glúteos',
            'Mantenha a posição pelo tempo determinado'
        ]
    },
    {
        id: '12',
        name: 'Elevação Lateral',
        muscle: 'Ombros',
        equipment: 'Halteres',
        difficulty: 'Iniciante',
        instructions: [
            'Em pé, halteres ao lado do corpo',
            'Levante os braços lateralmente até a altura dos ombros',
            'Cotovelos ligeiramente flexionados',
            'Desça controladamente'
        ]
    }
];

const MUSCLES = ['Todos', 'Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Core', 'Quadríceps'];

export default function ExercisesPage() {
    const [search, setSearch] = useState('');
    const [selectedMuscle, setSelectedMuscle] = useState('Todos');
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

    const filteredExercises = EXERCISES.filter(ex => {
        const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
        const matchesMuscle = selectedMuscle === 'Todos' || ex.muscle === selectedMuscle;
        return matchesSearch && matchesMuscle;
    });

    return (
        <div className="pb-24">
            <PageHeader title="Exercícios" showBack />

            <div className="px-5 py-4">
                {/* Search */}
                <div className="relative mb-4">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                        type="text"
                        placeholder="Buscar exercício..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-3 text-foreground focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted"
                    />
                </div>

                {/* Muscle Filter */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
                    {MUSCLES.map((muscle) => (
                        <button
                            key={muscle}
                            onClick={() => setSelectedMuscle(muscle)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${selectedMuscle === muscle
                                ? 'bg-primary text-white border-primary'
                                : 'bg-surface text-muted border-border hover:bg-surface-hover'
                                }`}
                        >
                            {muscle}
                        </button>
                    ))}
                </div>

                {/* Exercise List */}
                <div className="space-y-3">
                    {filteredExercises.map((exercise) => (
                        <button
                            key={exercise.id}
                            onClick={() => setSelectedExercise(exercise)}
                            className="card w-full flex items-center gap-4 text-left hover:bg-surface-hover transition-colors p-4"
                        >
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <Dumbbell size={24} className="text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold truncate">{exercise.name}</h3>
                                <div className="flex items-center gap-2 text-xs text-muted mt-1">
                                    <span className="flex items-center gap-1">
                                        <Target size={12} />
                                        {exercise.muscle}
                                    </span>
                                    <span>•</span>
                                    <span>{exercise.equipment}</span>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-muted shrink-0" />
                        </button>
                    ))}
                </div>

                {filteredExercises.length === 0 && (
                    <div className="text-center py-12 text-muted">
                        Nenhum exercício encontrado
                    </div>
                )}
            </div>

            {/* Exercise Detail Modal */}
            {selectedExercise && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4"
                    onClick={() => setSelectedExercise(null)}
                >
                    <div
                        className="w-full max-w-lg bg-surface rounded-[2rem] p-6 max-h-[85vh] overflow-y-auto animate-scale-in border border-border shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Pull handle */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-border" />

                        <div className="flex items-center justify-between mb-6 mt-6">
                            <h2 className="text-2xl font-bold">{selectedExercise.name}</h2>
                            <button
                                onClick={() => setSelectedExercise(null)}
                                className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center border border-border"
                            >
                                <X size={18} className="text-muted" />
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-6">
                            <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wide">
                                {selectedExercise.muscle}
                            </div>
                            <div className="px-3 py-1.5 rounded-lg bg-surface-hover border border-border text-muted text-xs font-semibold uppercase tracking-wide">
                                {selectedExercise.equipment}
                            </div>
                            <div className="px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent-dark dark:text-accent text-xs font-semibold uppercase tracking-wide">
                                {selectedExercise.difficulty}
                            </div>
                        </div>

                        <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                                <Target size={18} className="text-primary" />
                            </div>
                            Como Executar
                        </h3>
                        <div className="space-y-4">
                            {selectedExercise.instructions.map((step, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5 shadow-sm shadow-primary/30">
                                        {i + 1}
                                    </div>
                                    <p className="text-muted text-sm leading-relaxed">{step}</p>
                                </div>
                            ))}
                        </div>

                        <div className="h-4" /> {/* Bottom spacer */}
                    </div>
                </div>
            )}
        </div>
    );
}
