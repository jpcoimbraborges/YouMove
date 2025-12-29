import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    // Fail-safe: Se não houver chaves, não tenta conectar e evita erro 500
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('Supabase env vars missing in middleware. Skipping auth check.');
        return NextResponse.next();
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({ name, value: '', ...options });
                },
            },
        }
    );

    const { data: { session } } = await supabase.auth.getSession();

    // Roteamento Condicional
    const path = request.nextUrl.pathname;

    // Rotas públicas que não requerem autenticação
    const publicRoutes = ['/login', '/signup', '/forgot-password', '/'];
    const isPublicRoute = publicRoutes.includes(path) || path.startsWith('/auth');

    // Se o usuário não estiver logado e tentar acessar rota protegida
    if (!session && !isPublicRoute) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Se o usuário estiver logado e tentar acessar login/signup
    if (session && (path === '/login' || path === '/signup')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - app-icon.png (pwa icon)
         * - manifest.json (pwa manifest)
         * - public folder content
         */
        '/((?!_next/static|_next/image|favicon.ico|app-icon.png|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
