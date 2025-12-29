'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    User,
    Shield,
    CheckCircle2,
    Cpu,
    TrendingUp
} from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        if (formData.password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setLoading(true);

        // Check verification
        if (!supabase || !supabase.auth) {
            setError('Erro de configuração: Chaves do Supabase não encontradas. Verifique as variáveis de ambiente.');
            setLoading(false);
            return;
        }

        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.name,
                    },
                },
            });

            if (signUpError) throw signUpError;

            // Force full reload to ensure cookies are sent to middleware
            window.location.href = '/dashboard';
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Erro ao criar conta. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col safe-top safe-bottom relative overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #0D1421 0%, #0A0F14 50%, #0D1117 100%)' }}>

            {/* Decorative Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]"
                    style={{ background: 'linear-gradient(180deg, #2563EB 0%, #7C3AED 100%)' }} />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-15 blur-[100px]"
                    style={{ background: '#C6FF00' }} />
            </div>

            <div className="relative z-10 flex flex-col flex-1 px-6 max-w-md mx-auto w-full">
                {/* Logo Section */}
                <div className="flex flex-col items-center pt-8 pb-4">
                    <div className="relative mb-4 group">
                        <div className="w-40 h-40 rounded-3xl transition-all duration-500 group-hover:scale-105 group-hover:shadow-[0_0_50px_rgba(37,99,235,0.4)]"
                            style={{
                                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                            }}>
                            <Image
                                src="/youmove-logo.png"
                                alt="YouMove"
                                width={160}
                                height={160}
                                className="w-full h-full object-cover rounded-3xl"
                                priority
                            />
                        </div>
                    </div>
                </div>

                {/* Welcome Text */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold mb-1">
                        Crie sua conta
                    </h1>
                    <p className="text-secondary text-sm">Comece sua transformação hoje</p>
                </div>

                {/* Login Card */}
                <div className="rounded-3xl p-6 mb-6"
                    style={{
                        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
                        backdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                    }}>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                        {/* Name */}
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                                <User size={18} className="text-gray-400" />
                            </div>
                            <input
                                name="name"
                                type="text"
                                placeholder="Seu nome"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                autoComplete="name"
                                className="w-full py-3.5 pl-16 pr-4 rounded-2xl text-white placeholder:text-gray-500 outline-none transition-all focus:ring-2 focus:ring-primary/50"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)'
                                }}
                            />
                        </div>

                        {/* Email */}
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: 'rgba(59, 130, 246, 0.12)' }}>
                                <Mail size={18} className="text-primary" />
                            </div>
                            <input
                                name="email"
                                type="email"
                                placeholder="Seu email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                autoComplete="email"
                                className="w-full py-3.5 pl-16 pr-4 rounded-2xl text-white placeholder:text-gray-500 outline-none transition-all focus:ring-2 focus:ring-primary/50"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)'
                                }}
                            />
                        </div>

                        {/* Password */}
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: 'rgba(198, 255, 0, 0.1)' }}>
                                <Lock size={18} className="text-accent" />
                            </div>
                            <input
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Criar senha"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                autoComplete="new-password"
                                className="w-full py-3.5 pl-16 pr-14 rounded-2xl text-white placeholder:text-gray-500 outline-none transition-all focus:ring-2 focus:ring-accent/50"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)'
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg text-gray-500 hover:text-white transition"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {/* Confirm Password */}
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: 'rgba(198, 255, 0, 0.05)' }}>
                                <Lock size={18} className="text-accent/70" />
                            </div>
                            <input
                                name="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Confirmar senha"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                autoComplete="new-password"
                                className="w-full py-3.5 pl-16 pr-4 rounded-2xl text-white placeholder:text-gray-500 outline-none transition-all focus:ring-2 focus:ring-accent/50"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)'
                                }}
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                <Shield size={18} className="text-red-500" />
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Terms */}
                        <p className="text-xs text-gray-400 text-center px-4 my-1">
                            Ao criar conta, você aceita os <Link href="/terms" className="text-primary hover:underline">Termos</Link> e <Link href="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>.
                        </p>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
                            style={{
                                background: 'linear-gradient(135deg, #C6FF00 0%, #9ACD32 100%)',
                                color: '#0A0F14',
                                boxShadow: '0 12px 40px rgba(198, 255, 0, 0.25)'
                            }}
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-3 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                            ) : (
                                <>
                                    Criar Conta
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Login Link */}
                <p className="text-center text-gray-400 mb-8">
                    Já tem conta?{' '}
                    <Link href="/login" className="font-semibold hover:underline" style={{ color: '#C6FF00' }}>
                        Entrar agora
                    </Link>
                </p>
            </div>
        </div>
    );
}
