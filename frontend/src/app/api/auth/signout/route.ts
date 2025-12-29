import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    // Fail-safe: Se não houver chaves, retorna erro
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return NextResponse.json(
            { error: 'Supabase not configured' },
            { status: 500 }
        );
    }

    let response = NextResponse.json({ success: true });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    response.cookies.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    response.cookies.set({ name, value: '', ...options, maxAge: 0 });
                },
            },
        }
    );

    // Fazer signOut no servidor para limpar a sessão
    await supabase.auth.signOut();

    // Limpar todos os cookies relacionados ao Supabase manualmente
    const cookieNames = [
        'sb-access-token',
        'sb-refresh-token',
        `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`,
    ];

    cookieNames.forEach(name => {
        response.cookies.set({
            name,
            value: '',
            maxAge: 0,
            path: '/',
        });
    });

    // Limpar qualquer cookie que comece com 'sb-'
    request.cookies.getAll().forEach(cookie => {
        if (cookie.name.startsWith('sb-')) {
            response.cookies.set({
                name: cookie.name,
                value: '',
                maxAge: 0,
                path: '/',
            });
        }
    });

    return response;
}
