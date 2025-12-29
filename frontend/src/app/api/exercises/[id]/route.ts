/**
 * API Route: GET /api/exercises/[id]
 * 
 * Retorna um exercício específico por ID com cache de 24h
 * Usa serviço wger.ts (testado e funcionando)
 */

import { NextResponse } from 'next/server';
import { getWgerExerciseById } from '@/services/wger';

export const dynamic = 'force-static';
export const revalidate = 86400; // 24 horas

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const exerciseId = Number(id);

        if (isNaN(exerciseId)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid exercise ID',
                },
                { status: 400 }
            );
        }

        console.log(`[API /exercises/${exerciseId}] 🔍 Fetching exercise...`);

        const exercise = await getWgerExerciseById(exerciseId);

        if (!exercise) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Exercise not found',
                },
                { status: 404 }
            );
        }

        console.log(`[API /exercises/${exerciseId}] ✅ Found: ${exercise.name}`);

        return NextResponse.json(
            {
                success: true,
                data: exercise,
                timestamp: new Date().toISOString(),
            },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
                },
            }
        );
    } catch (error) {
        console.error('[API /exercises/[id]] ❌ Error:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch exercise',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
