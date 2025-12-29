/**
 * Custom Hook: useWgerExercises
 * 
 * Hook React otimizado para buscar exercícios Wger em Client Components
 * com cache, debounce e estados de loading/error
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import type { ExerciseWithImage } from '@/services/wger';


interface UseWgerExercisesOptions {
    /**
     * Filtro de busca (nome ou descrição)
     */
    searchQuery?: string;

    /**
     * Filtro por categoria (opcional)
     */
    category?: number;

    /**
     * Apenas exercícios com imagem
     */
    onlyWithImages?: boolean;

    /**
     * Debounce delay em ms para o search
     */
    debounceMs?: number;
}

interface UseWgerExercisesReturn {
    /**
     * Lista de exercícios (filtrada se searchQuery fornecido)
     */
    exercises: ExerciseWithImage[];

    /**
     * Estado de carregamento
     */
    isLoading: boolean;

    /**
     * Erro se houver
     */
    error: Error | null;

    /**
     * Refetch manual
     */
    refetch: () => Promise<void>;

    /**
     * Estatísticas
     */
    stats: {
        total: number;
        filtered: number;
        withImages: number;
    };
}

/**
 * Hook para buscar e filtrar exercícios Wger
 * 
 * @example
 * ```tsx
 * function ExercisesList() {
 *   const { exercises, isLoading, stats } = useWgerExercises({
 *     searchQuery: 'supino',
 *     onlyWithImages: true
 *   });
 *   
 *   if (isLoading) return <Loading />;
 *   
 *   return (
 *     <div>
 *       <p>{stats.filtered} exercícios encontrados</p>
 *       {exercises.map(ex => <ExerciseCard key={ex.id} {...ex} />)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useWgerExercises(
    options: UseWgerExercisesOptions = {}
): UseWgerExercisesReturn {
    const {
        searchQuery = '',
        category,
        onlyWithImages = false,
        debounceMs = 300,
    } = options;

    const [exercises, setExercises] = useState<ExerciseWithImage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Debounced search query
    const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [searchQuery, debounceMs]);

    // Fetch function
    const fetchExercises = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Chama API route em vez de importar serviço diretamente
            // Isso permite que o cache do Next.js funcione
            const response = await fetch('/api/exercises');

            if (!response.ok) {
                throw new Error(`Failed to fetch exercises: ${response.status}`);
            }

            const data = await response.json();
            setExercises(data.data || []);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
            setExercises([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchExercises();
    }, []); // Busca apenas uma vez

    // Filtragem local (memoizada)
    const filteredExercises = useMemo(() => {
        let result = exercises;

        // Filtro por texto
        if (debouncedQuery) {
            const query = debouncedQuery.toLowerCase().trim();
            result = result.filter(
                (ex) =>
                    ex.name.toLowerCase().includes(query) ||
                    ex.description.toLowerCase().includes(query)
            );
        }

        // Filtro por categoria
        if (category !== undefined) {
            result = result.filter((ex) => ex.category === category);
        }

        // Filtro por imagem
        if (onlyWithImages) {
            result = result.filter((ex) => ex.imageUrl !== null);
        }

        return result;
    }, [exercises, debouncedQuery, category, onlyWithImages]);

    // Estatísticas
    const stats = useMemo(
        () => ({
            total: exercises.length,
            filtered: filteredExercises.length,
            withImages: exercises.filter((ex) => ex.imageUrl !== null).length,
        }),
        [exercises, filteredExercises]
    );

    return {
        exercises: filteredExercises,
        isLoading,
        error,
        refetch: fetchExercises,
        stats,
    };
}

/**
 * Hook simplificado para buscar um exercício específico
 */
export function useWgerExerciseById(id: number | null) {
    const [exercise, setExercise] = useState<ExerciseWithImage | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!id) {
            setExercise(null);
            return;
        }

        const fetchExercise = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(`/api/exercises/${id}`);

                if (!response.ok) {
                    throw new Error(`Exercise not found: ${id}`);
                }

                const data = await response.json();
                setExercise(data.data);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Unknown error'));
                setExercise(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchExercise();
    }, [id]);

    return { exercise, isLoading, error };
}
