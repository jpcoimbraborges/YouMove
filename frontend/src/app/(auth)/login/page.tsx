'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    Sparkles,
    Shield,
    CheckCircle2,
    Cpu,
    TrendingUp
} from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!supabase || !supabase.auth) {
            setError('Erro de sistema: Conexão com Supabase não configurada.');
            setLoading(false);
            return;
        }

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) throw signInError;

            // Force full reload to ensure cookies are sent to middleware
            window.location.href = '/dashboard';
        } catch (err: any) {
            console.error(err);
            if (err.message === 'Invalid login credentials') {
                setError('Email ou senha incorretos.');
            } else if (err.message.includes('Email not confirmed')) {
                setError('Seu email ainda não foi confirmado. Verifique sua caixa de entrada.');
            } else {
                setError(err.message || 'Erro ao fazer login. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        if (!supabase || !supabase.auth) {
            setError('Erro de sistema: Conexão com Supabase não configurada.');
            return;
        }

        try {
            const { error: googleError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (googleError) throw googleError;
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Erro ao conectar com Google. Tente novamente.');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#121214] text-zinc-100 relative overflow-hidden">

            {/* Ambient Background Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-40 h-40 rounded-3xl mb-6 group overflow-hidden">
                        <Image
                            src="/youmove-logo.png"
                            alt="YouMove Logo"
                            width={160}
                            height={160}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            priority
                        />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2 font-geist">
                        Acesse sua conta
                    </h1>
                    <p className="text-zinc-400">
                        Bem-vindo de volta ao <span className="text-blue-500 font-semibold">YouMove</span>
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-8 shadow-xl relative overflow-hidden">
                    {/* Subtle Top Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-[1px] bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        {/* Email Input */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-400 ml-1">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={18} strokeWidth={1.5} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="exemplo@email.com"
                                    className="w-full bg-zinc-800/50 border border-zinc-700 text-zinc-200 rounded-xl px-12 py-3.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-zinc-600"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-xs font-medium text-zinc-400">Senha</label>
                                <Link href="/forgot-password" className="text-xs text-blue-500 hover:text-blue-400 transition-colors">
                                    Esqueceu a senha?
                                </Link>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={18} strokeWidth={1.5} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-zinc-800/50 border border-zinc-700 text-zinc-200 rounded-xl px-12 py-3.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-zinc-600"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm">
                                <Shield size={16} strokeWidth={1.5} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Entrar
                                    <ArrowRight size={18} strokeWidth={2} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="my-6 flex items-center gap-4">
                        <div className="h-[1px] flex-1 bg-zinc-800" />
                        <span className="text-xs text-zinc-500 font-medium">OU</span>
                        <div className="h-[1px] flex-1 bg-zinc-800" />
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium py-3.5 rounded-xl border border-zinc-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continuar com Google
                    </button>
                </div>

                {/* Footer Sign Up */}
                <p className="text-center text-zinc-500 mt-8 text-sm">
                    Não tem uma conta?{' '}
                    <Link href="/signup" className="text-blue-500 font-semibold hover:text-blue-400 hover:underline transition-colors">
                        Cadastre-se gratuitamente
                    </Link>
                </p>

                {/* Tech Stack Indicators */}
                <div className="flex justify-center gap-8 mt-12 opacity-50">
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest font-medium">
                        <Cpu size={12} strokeWidth={1.5} />
                        <span>AI Powered</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest font-medium">
                        <Shield size={12} strokeWidth={1.5} />
                        <span>Secure</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
