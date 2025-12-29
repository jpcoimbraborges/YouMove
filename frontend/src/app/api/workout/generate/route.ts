import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { generateWorkoutWithAI, generateWeeklyPlanWithAI, GenerateWorkoutInput } from '@/lib/ai/engines/ai-workout-generator';


import { z } from 'zod';

// Schema de Validação
const GenerateWorkoutRequestSchema = z.object({
    muscles: z.array(z.string()).min(1, "Selecione pelo menos um grupo muscular"),
    duration: z.number().min(15).max(180).default(60),
    equipment: z.union([z.string(), z.array(z.string())]).optional(),
    experience: z.string().optional(),
    goal: z.string().optional(),
    duration_type: z.enum(['single', 'weekly']).default('single'),
});

export async function POST(req: Request) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch (error) {
                        // Handle cookie setting error in server component (usually ok in route handlers)
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch (error) {
                        // Handle cookie setting error
                    }
                },
            },
        }
    );

    // 1. Check Authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Check if OpenAI API key is configured
        if (!process.env.OPENAI_API_KEY) {
            console.error('OPENAI_API_KEY is not configured');
            return NextResponse.json(
                { error: 'AI service not configured. Please contact support.' },
                { status: 503 }
            );
        }

        // 2. Parse & Validate Input
        const rawBody = await req.json();
        const validation = GenerateWorkoutRequestSchema.safeParse(rawBody);

        if (!validation.success) {
            return NextResponse.json(
                {
                    error: 'Invalid request data',
                    details: validation.error.format()
                },
                { status: 400 }
            );
        }

        const { muscles, duration, equipment, experience, goal, duration_type } = validation.data;

        console.log('[Workout Generation] Request params:', { muscles, duration, equipment, experience, goal, duration_type });

        // 3. Fetch user profile from database (including equipment)
        const { data: profile } = await supabase
            .from('profiles')
            .select('weight_kg, height_cm, fitness_goal, fitness_level, birth_date, equipment_available, full_name')
            .eq('id', session.user.id)
            .single();

        console.log('[Workout Generation] User profile:', {
            name: profile?.full_name,
            goal: profile?.fitness_goal,
            level: profile?.fitness_level,
            weight: profile?.weight_kg,
            height: profile?.height_cm,
            equipment_count: profile?.equipment_available?.length || 0
        });

        // Calculate age from birth_date if available
        let age = 25; // default
        if (profile?.birth_date) {
            const birthDate = new Date(profile.birth_date);
            const today = new Date();
            age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
        }

        // Map fitness_goal to API goal format
        const goalMapping: Record<string, string> = {
            'Ganhar massa muscular': 'hypertrophy',
            'Perder gordura': 'fat_loss',
            'Manter forma': 'maintenance',
            'Aumentar força': 'strength',
            'Melhorar condicionamento': 'endurance',
            'Reabilitação': 'rehabilitation'
        };

        // Map fitness_level to API format
        const levelMapping: Record<string, string> = {
            'Iniciante': 'beginner',
            'beginner': 'beginner',
            'Intermediário': 'intermediate',
            'intermediate': 'intermediate',
            'Avançado': 'advanced',
            'advanced': 'advanced',
            'Atleta': 'elite',
            'elite': 'elite'
        };

        // Use profile data or fallbacks
        const userFitnessLevel = profile?.fitness_level
            ? levelMapping[profile.fitness_level] || profile.fitness_level
            : experience || 'intermediate';

        const userGoal = profile?.fitness_goal
            ? goalMapping[profile.fitness_goal] || 'hypertrophy'
            : goal || 'hypertrophy';

        // Use equipment from profile if not provided in request
        // Map equipment IDs to human-readable names for the AI
        const equipmentIdToName: Record<string, string> = {
            'bodyweight': 'peso corporal',
            'dumbbells': 'halteres',
            'barbell': 'barra',
            'resistance_bands': 'elásticos',
            'pull_up_bar': 'barra fixa',
            'jump_rope': 'corda de pular',
            'cable_machine': 'máquina de cabo',
            'smith_machine': 'smith machine',
            'leg_press': 'leg press',
            'lat_pulldown': 'puxador/pulldown',
            'chest_press': 'supino máquina',
            'leg_extension': 'cadeira extensora',
            'leg_curl': 'mesa flexora',
            'rowing_machine': 'remadora',
            'bench': 'banco',
            'kettlebell': 'kettlebell',
            'yoga_mat': 'tapete',
            'foam_roller': 'rolo de espuma',
            'medicine_ball': 'medicine ball',
            'trx': 'TRX/suspensão'
        };

        // Determine equipment to use
        let userEquipment: string[] = [];

        // Smart equipment mapping based on frontend selection
        if (equipment) {
            if (equipment === 'gym' || equipment.includes('gym')) {
                // Full gym access
                userEquipment = ['academia completa'];
                console.log('[Workout Generation] Using full gym equipment');
            } else if (equipment === 'home_dumbbells' || equipment.includes('home')) {
                // Home with dumbbells
                userEquipment = ['halteres', 'banco', 'barra', 'peso corporal'];
                console.log('[Workout Generation] Using home dumbbell equipment');
            } else if (equipment === 'bodyweight' || equipment.includes('bodyweight')) {
                // Bodyweight only
                userEquipment = ['peso corporal', 'barra fixa', 'tapete'];
                console.log('[Workout Generation] Using bodyweight only');
            } else if (Array.isArray(equipment) && equipment.length > 0) {
                // Custom equipment array from request
                userEquipment = equipment;
            } else {
                // Fallback to full gym
                userEquipment = ['academia completa'];
            }
        } else if (profile?.equipment_available && profile.equipment_available.length > 0) {
            // Use equipment from profile
            userEquipment = profile.equipment_available.map((id: string) =>
                equipmentIdToName[id] || id
            );
            console.log('[Workout Generation] Using profile equipment:', userEquipment);
        } else {
            // Default: assume full gym access
            userEquipment = ['academia completa'];
            console.log('[Workout Generation] No equipment configured, assuming full gym');
        }

        // Construct input for AI engine
        const aiInput: GenerateWorkoutInput = {
            user_id: session.user.id,
            user_profile: {
                fitness_level: userFitnessLevel as any,
                goal: userGoal as any,
                age: age,
                weight_kg: profile?.weight_kg || undefined,
                height_cm: profile?.height_cm || undefined,
                name: profile?.full_name?.split(' ')[0] || undefined,
            },
            muscles: muscles || ['full_body'],
            available_minutes: duration || 60,
            equipment: userEquipment,
        };

        // 3. Generate Workout
        console.log('[Workout Generation] Generating workout for user:', session.user.id);

        // Handle Weekly Plan
        if (duration_type === 'weekly') {
            const result = await generateWeeklyPlanWithAI(aiInput);
            if (!result.success || !result.plan) {
                return NextResponse.json({ error: 'Failed to generate weekly plan' }, { status: 500 });
            }
            return NextResponse.json(result.plan);
        }

        // Handle Single Workout
        const result = await generateWorkoutWithAI(aiInput);

        console.log('[Workout Generation] AI Response:', {
            success: result.success,
            hasWorkout: !!result.workout,
            error: result.ai_response?.error,
            was_adjusted: result.was_adjusted
        });

        if (!result.success || !result.workout) {
            console.error('[Workout Generation] AI Generation failed:', {
                error: result.ai_response?.error,
                requestId: result.ai_response?.request_id
            });

            // Return more specific error message
            const errorMessage = result.ai_response?.error?.message || 'Failed to generate workout';
            const errorCode = result.ai_response?.error?.code || 'UNKNOWN_ERROR';

            return NextResponse.json(
                {
                    error: errorMessage,
                    code: errorCode,
                    details: result.ai_response?.error?.details
                },
                { status: 500 }
            );
        }

        // 4. Return Result
        console.log('[Workout Generation] Success! Returning workout:', result.workout.name);
        return NextResponse.json(result.workout);

    } catch (error) {
        console.error('[Workout Generation] Exception:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: errorMessage, code: 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }
}
