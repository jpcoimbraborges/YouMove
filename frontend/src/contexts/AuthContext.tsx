'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Verificação se Supabase está configurado
        if (!isSupabaseConfigured()) {
            console.warn('[YouMove] Supabase não configurado. Autenticação desabilitada.');
            setLoading(false);
            return;
        }

        // Check active session
        const initSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setSession(session);
                setUser(session?.user ?? null);
            } catch (error) {
                console.error('Error checking session:', error);
            } finally {
                setLoading(false);
            }
        };

        initSession();

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event: string, session: Session | null) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);

                if (_event === 'SIGNED_OUT') {
                    setUser(null);
                    setSession(null);
                    router.push('/login');
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [router]);

    const signOut = async () => {
        try {
            // Primeiro faz signOut no cliente
            if (supabase?.auth) {
                await supabase.auth.signOut();
            }

            // Depois chama a API do servidor para limpar os cookies
            await fetch('/api/auth/signout', {
                method: 'POST',
                credentials: 'include',
            });

            // Limpa o estado local
            setUser(null);
            setSession(null);

            // Limpa qualquer dado do localStorage relacionado ao app
            if (typeof window !== 'undefined') {
                const keysToRemove = Object.keys(localStorage).filter(
                    key => key.startsWith('sb-') || key.startsWith('youmove')
                );
                keysToRemove.forEach(key => localStorage.removeItem(key));
            }

            // Força um full reload para garantir que tudo esteja limpo
            window.location.href = '/login';
        } catch (error) {
            console.error('Error during signOut:', error);
            // Mesmo com erro, tenta redirecionar
            window.location.href = '/login';
        }
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
