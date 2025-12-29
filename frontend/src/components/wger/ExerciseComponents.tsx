/**
 * Wger Exercise Components
 * 
 * Componentes React prontos para uso com exercícios Wger
 */

'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Search, Dumbbell, X } from 'lucide-react';
import { useWgerExercises } from '@/hooks/useWgerExercises';
import type { ExerciseWithImage } from '@/services/wger';

// ============================================================================
// EXERCISE CARD - Card individual de exercício
// ============================================================================

interface ExerciseCardProps {
    exercise: ExerciseWithImage;
    onClick?: (exercise: ExerciseWithImage) => void;
    selected?: boolean;
}

export function ExerciseCard({ exercise, onClick, selected }: ExerciseCardProps) {
    return (
        <div
            onClick={() => onClick?.(exercise)}
            className={`
        rounded-2xl overflow-hidden transition-all cursor-pointer
        ${selected
                    ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20'
                    : 'hover:shadow-xl hover:scale-[1.02]'
                }
      `}
            style={{ background: '#1F2937' }}
        >
            {/* Image */}
            <div className="aspect-video bg-gray-800 relative">
                {exercise.imageUrl ? (
                    <Image
                        src={exercise.imageUrl}
                        alt={exercise.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <Dumbbell size={48} className="text-gray-600" strokeWidth={1.5} />
                    </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="font-bold text-white text-lg mb-2 line-clamp-1">
                    {exercise.name}
                </h3>

                <div
                    className="text-sm text-gray-400 line-clamp-2"
                    dangerouslySetInnerHTML={{
                        __html: exercise.description.replace(/<[^>]*>/g, ''),
                    }}
                />

                {/* Badges */}
                <div className="flex gap-2 mt-3">
                    {exercise.imageUrl && (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                            Com imagem
                        </span>
                    )}
                    {exercise.muscles && exercise.muscles.length > 0 && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                            {exercise.muscles.length} músculos
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// EXERCISE GRID - Grid responsivo de exercícios
// ============================================================================

interface ExerciseGridProps {
    exercises: ExerciseWithImage[];
    onSelectExercise?: (exercise: ExerciseWithImage) => void;
    selectedId?: number;
    loading?: boolean;
}

export function ExerciseGrid({
    exercises,
    onSelectExercise,
    selectedId,
    loading,
}: ExerciseGridProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-2xl h-64 animate-pulse"
                        style={{ background: '#1F2937' }}
                    />
                ))}
            </div>
        );
    }

    if (exercises.length === 0) {
        return (
            <div className="text-center py-16">
                <Dumbbell size={64} className="mx-auto text-gray-600 mb-4" strokeWidth={1} />
                <h3 className="text-xl font-bold text-white mb-2">
                    Nenhum exercício encontrado
                </h3>
                <p className="text-gray-400">
                    Tente ajustar os filtros ou buscar por outro termo
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exercises.map((exercise) => (
                <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onClick={onSelectExercise}
                    selected={exercise.id === selectedId}
                />
            ))}
        </div>
    );
}

// ============================================================================
// EXERCISE SEARCH - Barra de busca com filtros
// ============================================================================

interface ExerciseSearchProps {
    onSearchChange: (query: string) => void;
    onFilterChange?: (filters: { onlyWithImages: boolean }) => void;
    initialQuery?: string;
}

export function ExerciseSearch({
    onSearchChange,
    onFilterChange,
    initialQuery = '',
}: ExerciseSearchProps) {
    const [query, setQuery] = useState(initialQuery);
    const [onlyWithImages, setOnlyWithImages] = useState(false);

    const handleQueryChange = (value: string) => {
        setQuery(value);
        onSearchChange(value);
    };

    const handleFilterToggle = () => {
        const newValue = !onlyWithImages;
        setOnlyWithImages(newValue);
        onFilterChange?.({ onlyWithImages: newValue });
    };

    return (
        <div className="space-y-4">
            {/* Search input */}
            <div className="relative">
                <Search
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                    type="text"
                    placeholder="Buscar exercícios..."
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 rounded-xl text-white placeholder-gray-500 border border-gray-700 focus:border-blue-500 focus:outline-none transition-all"
                    style={{ background: '#1F2937' }}
                />
                {query && (
                    <button
                        onClick={() => handleQueryChange('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-3">
                <button
                    onClick={handleFilterToggle}
                    className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${onlyWithImages
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }
          `}
                >
                    Apenas com imagem
                </button>
            </div>
        </div>
    );
}

// ============================================================================
// EXERCISE BROWSER - Componente completo com busca + grid
// ============================================================================

interface ExerciseBrowserProps {
    onSelectExercise?: (exercise: ExerciseWithImage) => void;
    selectedId?: number;
}

export function ExerciseBrowser({ onSelectExercise, selectedId }: ExerciseBrowserProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [onlyWithImages, setOnlyWithImages] = useState(false);

    const { exercises, isLoading, stats } = useWgerExercises({
        searchQuery,
        onlyWithImages,
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Biblioteca de Exercícios</h2>
                    <p className="text-gray-400 text-sm mt-1">
                        {stats.filtered} de {stats.total} exercícios
                        {onlyWithImages && ` (${stats.withImages} com imagem)`}
                    </p>
                </div>
            </div>

            {/* Search */}
            <ExerciseSearch
                onSearchChange={setSearchQuery}
                onFilterChange={(filters) => setOnlyWithImages(filters.onlyWithImages)}
            />

            {/* Grid */}
            <ExerciseGrid
                exercises={exercises}
                onSelectExercise={onSelectExercise}
                selectedId={selectedId}
                loading={isLoading}
            />
        </div>
    );
}

// ============================================================================
// EXERCISE MODAL - Modal de detalhes do exercício
// ============================================================================

interface ExerciseModalProps {
    exercise: ExerciseWithImage | null;
    onClose: () => void;
    onSelect?: (exercise: ExerciseWithImage) => void;
}

export function ExerciseModal({ exercise, onClose, onSelect }: ExerciseModalProps) {
    if (!exercise) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                style={{ background: '#1F2937' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Image */}
                {exercise.imageUrl && (
                    <div className="aspect-video relative">
                        <Image
                            src={exercise.imageUrl}
                            alt={exercise.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                )}

                {/* Content */}
                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <h2 className="text-2xl font-bold text-white">{exercise.name}</h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div
                        className="prose prose-invert max-w-none text-gray-300"
                        dangerouslySetInnerHTML={{ __html: exercise.description }}
                    />

                    {/* Actions */}
                    <div className="flex gap-3 mt-6">
                        {onSelect && (
                            <button
                                onClick={() => onSelect(exercise)}
                                className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-500 hover:bg-blue-600 transition-colors"
                            >
                                Selecionar Exercício
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl font-medium text-gray-300 hover:bg-white/5 transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
