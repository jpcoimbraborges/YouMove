import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Use service role key to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        console.log('🗑️ Deleting all data for user:', userId);

        // Delete workout_logs first (foreign key constraint)
        const { error: logsError, count: logsCount } = await supabaseAdmin
            .from('workout_logs')
            .delete()
            .eq('user_id', userId);

        if (logsError) {
            console.warn('Error deleting logs:', logsError);
        } else {
            console.log('Deleted workout_logs:', logsCount);
        }

        // Delete workout_sessions
        const { error: sessionsError, count: sessionsCount } = await supabaseAdmin
            .from('workout_sessions')
            .delete()
            .eq('user_id', userId);

        if (sessionsError) {
            console.error('Error deleting sessions:', sessionsError);
            return NextResponse.json({
                error: `Failed to delete sessions: ${sessionsError.message}`
            }, { status: 500 });
        }

        console.log('Deleted workout_sessions:', sessionsCount);

        // Also delete personal_records if exists
        const { error: prError } = await supabaseAdmin
            .from('personal_records')
            .delete()
            .eq('user_id', userId);

        if (prError) {
            console.warn('Error deleting personal_records:', prError);
        }

        return NextResponse.json({
            success: true,
            message: 'All workout data deleted successfully',
            deleted: {
                logs: logsCount || 0,
                sessions: sessionsCount || 0
            }
        });

    } catch (error: any) {
        console.error('Reset data error:', error);
        return NextResponse.json({
            error: error.message || 'Unknown error'
        }, { status: 500 });
    }
}
