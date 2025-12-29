/**
 * YOUMOVE - Template Detail API
 * GET /api/templates/[id]
 * POST /api/templates/[id]/use - Copy template to user workouts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const { id } = params;

        // Fetch template
        const { data: template, error } = await supabase
            .from('workout_templates')
            .select('*')
            .eq('id', id)
            .eq('is_active', true)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Template not found' },
                    { status: 404 }
                );
            }
            console.error('Error fetching template:', error);
            return NextResponse.json(
                { error: 'Failed to fetch template', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            template
        });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

export async function POST(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const { id } = params;
        const body = await req.json();
        const { user_id } = body;

        if (!user_id) {
            return NextResponse.json(
                { error: 'user_id is required' },
                { status: 400 }
            );
        }

        // Fetch template
        const { data: template, error: fetchError } = await supabase
            .from('workout_templates')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !template) {
            return NextResponse.json(
                { error: 'Template not found' },
                { status: 404 }
            );
        }

        // Map template category to valid workout_type enum
        const categoryToWorkoutType: Record<string, string> = {
            'strength': 'strength',
            'hypertrophy': 'hypertrophy',
            'endurance': 'endurance',
            'weight_loss': 'hiit',
            'functional': 'custom',
            'flexibility': 'flexibility'
        };

        const workoutType = categoryToWorkoutType[template.category] || 'custom';

        // Map template muscles to valid muscle_group enum values
        const muscleMapping: Record<string, string> = {
            'chest': 'chest',
            'back': 'back',
            'shoulders': 'shoulders',
            'biceps': 'biceps',
            'triceps': 'triceps',
            'forearms': 'forearms',
            'core': 'core',
            'quadriceps': 'quadriceps',
            'hamstrings': 'hamstrings',
            'glutes': 'glutes',
            'calves': 'calves',
            'hip_flexors': 'hip_flexors',
            'full_body': 'full_body',
            'full-body': 'full_body',
            'legs': 'quadriceps',
            'arms': 'biceps',
            'abs': 'core'
        };

        // Map target muscles to valid enum values, filtering out invalid ones
        const validMuscles = (template.target_muscles || [])
            .map((m: string) => muscleMapping[m.toLowerCase()])
            .filter((m: string | undefined): m is string => !!m);

        // Create workout from template
        const { data: workout, error: createError } = await supabase
            .from('workouts')
            .insert({
                user_id,
                name: template.name,
                description: template.description,
                workout_type: workoutType,
                difficulty: template.difficulty,
                target_muscles: validMuscles.length > 0 ? validMuscles : ['full_body'],
                avg_duration_minutes: template.duration_minutes,
                exercises: template.exercises,
                is_ai_generated: false,
                is_template: false,
                is_active: true
            })
            .select()
            .single();

        if (createError) {
            console.error('Error creating workout:', createError);
            console.error('Workout type:', workoutType);
            console.error('Valid muscles:', validMuscles);
            console.error('Template data:', JSON.stringify(template, null, 2));
            return NextResponse.json(
                { error: 'Failed to create workout', details: createError.message },
                { status: 500 }
            );
        }

        // Increment uses_count
        await supabase
            .from('workout_templates')
            .update({ uses_count: (template.uses_count || 0) + 1 })
            .eq('id', id);

        return NextResponse.json({
            success: true,
            workout
        });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
