/**
 * YOUMOVE - ExerciseDB Sync API
 * 
 * Endpoint para sincronizar exercícios do ExerciseDB para o banco local
 * Esta rota deve ser chamada em background ou por admin, nunca pelo usuário final
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const EXERCISEDB_BASE_URL = 'https://exercisedb.p.rapidapi.com';

interface ExerciseDBExercise {
    id: string;
    name: string;
    bodyPart: string;
    target: string;
    secondaryMuscles: string[];
    equipment: string;
    gifUrl?: string; // Pode não vir da API
    instructions: string[];
}

// Função para gerar URL da imagem baseado no nome do exercício
function getGifUrl(exerciseId: string, exerciseName?: string): string {
    // Se temos o nome do exercício, usar o repositório GitHub free-exercise-db
    if (exerciseName) {
        // Converter nome para slug (formato do GitHub)
        const slug = exerciseName
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('_')
            .replace(/[^a-zA-Z0-9_\/]/g, '');

        return `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${slug}/0.jpg`;
    }

    // Fallback: tentar o padrão antigo (provavelmente não funcionará)
    return `https://v2.exercisedb.io/image/${exerciseId}`;
}

// Mapeamento de nomes de exercícios para português
const exerciseTranslations: Record<string, string> = {
    'barbell bench press': 'Supino Reto com Barra',
    'dumbbell bench press': 'Supino Reto com Halteres',
    'incline barbell bench press': 'Supino Inclinado com Barra',
    'lat pulldown': 'Puxada na Polia Alta',
    'seated cable row': 'Remada Sentado na Polia',
    'barbell squat': 'Agachamento com Barra',
    'leg press': 'Leg Press',
    'deadlift': 'Levantamento Terra',
    'dumbbell curl': 'Rosca Direta com Halteres',
    'tricep pushdown': 'Tríceps na Polia',
    'shoulder press': 'Desenvolvimento de Ombros',
    'lateral raise': 'Elevação Lateral',
    'plank': 'Prancha Abdominal',
    'crunch': 'Abdominal Crunch',
    'push up': 'Flexão de Braços',
    'pull up': 'Barra Fixa',
};

function translateExerciseName(englishName: string): string {
    const lowerName = englishName.toLowerCase();
    return exerciseTranslations[lowerName] || englishName;
}

function determineDifficulty(exercise: ExerciseDBExercise): string {
    const beginnerEquipment = ['body weight', 'machine', 'cable', 'resistance band'];
    const advancedEquipment = ['barbell', 'olympic barbell'];

    if (beginnerEquipment.includes(exercise.equipment.toLowerCase())) {
        return 'beginner';
    }
    if (advancedEquipment.includes(exercise.equipment.toLowerCase())) {
        return 'advanced';
    }
    return 'intermediate';
}

function getSupabaseClient(): SupabaseClient | null {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return null;
    }

    return createClient(supabaseUrl, supabaseServiceKey);
}

async function fetchExercisesFromAPI(
    endpoint: string,
    rapidApiKey: string
): Promise<ExerciseDBExercise[]> {
    const response = await fetch(`${EXERCISEDB_BASE_URL}${endpoint}`, {
        headers: {
            'X-RapidAPI-Key': rapidApiKey,
            'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
        }
    });

    if (!response.ok) {
        throw new Error(`ExerciseDB API error: ${response.status}`);
    }

    return response.json();
}

export async function POST(request: NextRequest) {
    const rapidApiKey = process.env.RAPIDAPI_KEY;

    if (!rapidApiKey) {
        return NextResponse.json(
            { error: 'RAPIDAPI_KEY não configurada' },
            { status: 500 }
        );
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
        return NextResponse.json(
            { error: 'Configuração do Supabase incompleta' },
            { status: 500 }
        );
    }

    try {
        const body = await request.json();
        const { bodyPart, limit = 100 } = body;

        let exercises: ExerciseDBExercise[];

        if (bodyPart) {
            exercises = await fetchExercisesFromAPI(`/exercises/bodyPart/${bodyPart}?limit=${limit}`, rapidApiKey);
        } else {
            exercises = await fetchExercisesFromAPI(`/exercises?limit=${limit}`, rapidApiKey);
        }

        const exercisesToInsert = exercises.map(ex => ({
            external_id: ex.id,
            name: ex.name,
            name_pt: translateExerciseName(ex.name),
            body_part: ex.bodyPart,
            target_muscle: ex.target,
            secondary_muscles: ex.secondaryMuscles,
            equipment: ex.equipment,
            gif_url: ex.gifUrl || getGifUrl(ex.id, ex.name),
            instructions: ex.instructions,
            difficulty: determineDifficulty(ex),
            cached_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true
        }));

        const { data, error } = await supabase
            .from('exercise_library')
            .upsert(exercisesToInsert, {
                onConflict: 'external_id',
                ignoreDuplicates: false
            })
            .select();

        if (error) {
            console.error('Error upserting exercises:', error);
            return NextResponse.json(
                { error: 'Erro ao salvar exercícios', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `${data?.length || 0} exercícios sincronizados`,
            count: data?.length || 0
        });

    } catch (error) {
        console.error('Sync API error:', error);
        return NextResponse.json(
            {
                error: 'Erro ao sincronizar exercícios',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    const supabase = getSupabaseClient();

    if (!supabase) {
        return NextResponse.json({
            status: 'not_configured',
            totalExercises: 0,
            message: 'Supabase não configurado'
        });
    }

    try {
        const { count, error } = await supabase
            .from('exercise_library')
            .select('*', { count: 'exact', head: true });

        if (error) {
            throw error;
        }

        return NextResponse.json({
            status: 'ok',
            totalExercises: count || 0,
            lastUpdated: new Date().toISOString()
        });

    } catch (error) {
        return NextResponse.json(
            { error: 'Erro ao verificar biblioteca' },
            { status: 500 }
        );
    }
}
