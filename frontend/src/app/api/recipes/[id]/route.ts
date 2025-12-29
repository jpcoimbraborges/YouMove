/**
 * YOUMOVE - Recipe Detail API
 * GET /api/recipes/[id]
 * Fetch single recipe and increment views
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

        // Fetch recipe
        const { data: recipe, error } = await supabase
            .from('recipes')
            .select('*')
            .eq('id', id)
            .eq('is_active', true)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Recipe not found' },
                    { status: 404 }
                );
            }
            console.error('Error fetching recipe:', error);
            return NextResponse.json(
                { error: 'Failed to fetch recipe', details: error.message },
                { status: 500 }
            );
        }

        // Increment views (fire and forget)
        supabase
            .from('recipes')
            .update({ views: (recipe.views || 0) + 1 })
            .eq('id', id)
            .then(({ error }) => {
                if (error) console.error('Error incrementing views:', error);
            });

        return NextResponse.json({
            success: true,
            recipe
        });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
