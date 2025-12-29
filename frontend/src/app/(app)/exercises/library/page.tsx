/**
 * Página de Biblioteca de Exercícios Wger
 * 
 * Exemplo completo de uso dos componentes Wger
 * Rota: /exercises/library
 */

'use client';

import { useState } from 'react';
import { ExerciseBrowser, ExerciseModal } from '@/components/wger/ExerciseComponents';
import type { ExerciseWithImage } from '@/services/wger';
import { LayoutGrid, ArrowLeft } from 'lucide-react';
import Link from 'next/link';


export default function ExerciseLibraryPage() {
    const [selectedExercise, setSelectedExercise] = useState<ExerciseWithImage | null>(null);

    const handleSelectExercise = (exercise: ExerciseWithImage) => {
        setSelectedExercise(exercise);
    };

    const handleCloseModal = () => {
        setSelectedExercise(null);
    };

    const handleConfirmSelection = (exercise: ExerciseWithImage) => {
        console.log('Exercício selecionado:', exercise);
        // Aqui você pode adicionar ao treino, etc
        alert(`Exercício "${exercise.name}" adicionado!`);
        handleCloseModal();
    };

    return (
        <div className="min-h-screen" style={{ background: '#0B0E14' }}>
            {/* Header */}
            <header className="border-b border-white/5 sticky top-0 z-40 backdrop-blur-xl" style={{ background: 'rgba(11, 14, 20, 0.95)' }}>
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/workout"
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <LayoutGrid size={20} className="text-blue-400" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">Biblioteca Wger</h1>
                                <p className="text-xs text-gray-400">Banco de dados open-source</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <ExerciseBrowser
                    onSelectExercise={handleSelectExercise}
                    selectedId={selectedExercise?.id}
                />
            </main>

            {/* Modal */}
            <ExerciseModal
                exercise={selectedExercise}
                onClose={handleCloseModal}
                onSelect={handleConfirmSelection}
            />

            {/* Info Footer */}
            <footer className="mt-16 py-8 border-t border-white/5">
                <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
                    <p>
                        Dados fornecidos por{' '}
                        <a
                            href="https://wger.de"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300"
                        >
                            Wger Workout Manager
                        </a>
                        {' '}- Open Source Fitness Database
                    </p>
                </div>
            </footer>
        </div>
    );
}
