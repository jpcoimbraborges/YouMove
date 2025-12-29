/**
 * YOUMOVE - Templates API
 * GET /api/templates
 * Fetch workout templates with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        // Extract query params
        const searchQuery = searchParams.get('search');
        const category = searchParams.get('category');
        const difficulty = searchParams.get('difficulty');
        const maxDuration = searchParams.get('maxDuration');
        const targetMuscle = searchParams.get('targetMuscle');
        const featured = searchParams.get('featured');
        const sortBy = searchParams.get('sortBy') || 'uses_count';
        const sortDirection = searchParams.get('sortDirection') || 'desc';
        const limit = parseInt(searchParams.get('limit') || '50');

        // Build query
        let query = supabase
            .from('workout_templates')
            .select('*')
            .eq('is_active', true);

        // Apply filters
        if (category) {
            query = query.eq('category', category);
        }

        if (difficulty) {
            query = query.eq('difficulty', difficulty);
        }

        if (maxDuration) {
            query = query.lte('duration_minutes', parseInt(maxDuration));
        }

        if (targetMuscle) {
            query = query.contains('target_muscles', [targetMuscle]);
        }

        if (featured === 'true') {
            query = query.eq('is_featured', true);
        }

        // Apply sorting
        const ascending = sortDirection === 'asc';
        query = query.order(sortBy, { ascending });

        // Apply limit
        query = query.limit(limit);

        // Execute query
        const { data: templates, error } = await query;

        if (error) {
            console.error('Error fetching templates:', error);
            return NextResponse.json(
                { error: 'Failed to fetch templates', details: error.message },
                { status: 500 }
            );
        }

        // Client-side text search
        let filteredTemplates = templates || [];
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filteredTemplates = filteredTemplates.filter((template: any) =>
                template.name.toLowerCase().includes(q) ||
                template.description?.toLowerCase().includes(q) ||
                template.tags.some((tag: string) => tag.toLowerCase().includes(q))
            );
        }

        return NextResponse.json({
            success: true,
            templates: filteredTemplates,
            count: filteredTemplates.length
        });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
