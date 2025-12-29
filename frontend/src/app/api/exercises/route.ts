/**
 * YOUMOVE - Exercise Library API
 * 
 * Endpoint para buscar exercícios da API Wger com cache de 24h
 * Usa serviço wger.ts (testado e funcionando)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWgerExercises } from '@/services/wger';

export const dynamic = 'force-dynamic'; // Necessário para ler searchParams
// Cache de dados é gerenciado pelo serviço Wger (fetch next revalidate)
// export const revalidate = 86400; // Removido pois conflita com force-dynamic para searchParams

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    // Parâmetros de filtro
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const onlyWithImages = searchParams.get('onlyWithImages') === 'true';
    const limit = parseInt(searchParams.get('limit') || '200');
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
        console.log('[API /exercises] 🚀 Fetching from Wger Unified Service...');

        // Busca exercícios do serviço Wger unificado
        let exercises = await getWgerExercises();

        // Aplicar filtros
        if (search) {
            const searchLower = search.toLowerCase();
            exercises = exercises.filter(ex =>
                ex.name.toLowerCase().includes(searchLower) ||
                ex.description.toLowerCase().includes(searchLower)
            );
        }

        if (category) {
            const categoryId = parseInt(category);
            exercises = exercises.filter(ex => ex.category === categoryId);
        }

        if (onlyWithImages) {
            exercises = exercises.filter(ex => ex.imageUrl !== null);
        }

        // Aplicar paginação
        const total = exercises.length;
        const paginatedExercises = exercises.slice(offset, offset + limit);

        console.log(`[API /exercises] ✅ Returning ${paginatedExercises.length} of ${total} exercises`);

        return NextResponse.json(
            {
                success: true,
                data: paginatedExercises,
                count: paginatedExercises.length,
                total: total,
                cached: true,
                timestamp: new Date().toISOString(),
                filters: {
                    search: search || null,
                    category: category || null,
                    onlyWithImages,
                },
                // Backward compatibility
                exercises: paginatedExercises,
            },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
                },
            }
        );
    } catch (error) {
        console.error('[API /exercises] ❌ Error:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch exercises from Wger',
                message: error instanceof Error ? error.message : 'Unknown error',
                data: [],
                exercises: [],
                count: 0,
            },
            { status: 500 }
        );
    }
}
