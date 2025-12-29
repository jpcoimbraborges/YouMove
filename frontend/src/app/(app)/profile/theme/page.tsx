'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
    Moon,
    Sun,
    Monitor,
    Check,
    Palette,
    Sparkles,
    Eye,
    Paintbrush
} from 'lucide-react';

type ThemeOption = 'light' | 'dark' | 'system';

interface ThemeConfig {
    id: ThemeOption;
    name: string;
    description: string;
    icon: React.ReactNode;
    gradient: string;
    bgPreview: string;
    textPreview: string;
    recommended?: boolean;
}

const themeOptions: ThemeConfig[] = [
    {
        id: 'dark',
        name: 'Modo Escuro',
        description: 'Visual elegante, ideal para uso noturno',
        icon: <Moon size={24} />,
        gradient: 'from-indigo-500 to-purple-600',
        bgPreview: '#0A0F14',
        textPreview: '#FFFFFF',
        recommended: true
    },
    {
        id: 'light',
        name: 'Modo Claro',
        description: 'Melhor visibilidade em ambientes iluminados',
        icon: <Sun size={24} />,
        gradient: 'from-amber-400 to-orange-500',
        bgPreview: '#F8FAFC',
        textPreview: '#0F172A'
    },
    {
        id: 'system',
        name: 'Automático',
        description: 'Segue as configurações do seu dispositivo',
        icon: <Monitor size={24} />,
        gradient: 'from-emerald-400 to-cyan-500',
        bgPreview: 'linear-gradient(135deg, #0A0F14 50%, #F8FAFC 50%)',
        textPreview: '#888888'
    }
];

const accentColors = [
    { id: 'lime', color: '#C6FF00', name: 'Lima', selected: true },
    { id: 'blue', color: '#3B82F6', name: 'Azul' },
    { id: 'purple', color: '#8B5CF6', name: 'Roxo' },
    { id: 'orange', color: '#F59E0B', name: 'Laranja' },
    { id: 'pink', color: '#EC4899', name: 'Rosa' },
    { id: 'emerald', color: '#10B981', name: 'Esmeralda' },
];

export default function ThemePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [selectedTheme, setSelectedTheme] = useState<ThemeOption>('dark');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            const { data } = await supabase
                .from('profiles')
                .select('theme')
                .eq('id', user.id)
                .single();

            if (data?.theme) {
                setSelectedTheme(data.theme as ThemeOption);
            }
            setLoading(false);
        };

        fetchProfile();
    }, [user]);

    const handleSelectTheme = async (theme: ThemeOption) => {
        if (!user) return;

        setSelectedTheme(theme);
        setSaving(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    theme,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;

            // Apply theme to document
            if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
                document.documentElement.classList.remove('light');
            } else {
                document.documentElement.classList.add('light');
                document.documentElement.classList.remove('dark');
            }

        } catch (err: any) {
            console.error('Error saving theme:', err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0D1421 0%, #0A0F14 100%)' }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <p className="text-gray-400 text-sm">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-24 min-h-screen" style={{ background: 'linear-gradient(180deg, #0D1421 0%, #0A0F14 100%)' }}>
            <PageHeader title="Aparência" showBack />

            <div className="px-5 py-4 space-y-6">
                {/* Header Card */}
                <div className="rounded-2xl p-5 relative overflow-hidden" style={{
                    background: 'linear-gradient(145deg, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.1) 100%)',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />
                    <div className="relative flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                            style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)' }}>
                            <Palette size={22} className="text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg mb-1">Personalize o visual</h2>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                Escolha o tema que combina com você e deixe o app com a sua cara.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Theme Section */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Eye size={18} className="text-purple-400" />
                        <h3 className="font-bold text-sm uppercase tracking-wider">Tema</h3>
                    </div>

                    <div className="space-y-3">
                        {themeOptions.map(theme => {
                            const isSelected = selectedTheme === theme.id;
                            return (
                                <button
                                    key={theme.id}
                                    onClick={() => handleSelectTheme(theme.id)}
                                    disabled={saving}
                                    className={`w-full p-4 rounded-2xl transition-all duration-200 active:scale-[0.98] ${isSelected
                                            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500'
                                            : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Preview Circle */}
                                        <div
                                            className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-all"
                                            style={{
                                                background: theme.bgPreview.includes('gradient') ? theme.bgPreview : theme.bgPreview,
                                                color: theme.textPreview,
                                                border: '2px solid rgba(255,255,255,0.1)'
                                            }}
                                        >
                                            {theme.icon}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 text-left">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-lg">{theme.name}</h4>
                                                {theme.recommended && (
                                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white uppercase">
                                                        Recomendado
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-400">{theme.description}</p>
                                        </div>

                                        {/* Check */}
                                        {isSelected && (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                                                <Check size={18} className="text-white" strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Accent Color Section */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Paintbrush size={18} className="text-accent" />
                        <h3 className="font-bold text-sm uppercase tracking-wider">Cor de Destaque</h3>
                    </div>

                    <div className="rounded-2xl p-4" style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                        <div className="flex justify-between mb-3">
                            {accentColors.map(accent => (
                                <button
                                    key={accent.id}
                                    className={`w-11 h-11 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 ${accent.selected ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0A0F14]' : ''
                                        }`}
                                    style={{
                                        backgroundColor: accent.color,
                                        boxShadow: accent.selected ? `0 0 24px ${accent.color}40` : 'none'
                                    }}
                                    title={accent.name}
                                />
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                            Cores personalizadas em breve! <Sparkles size={12} className="inline text-accent" />
                        </p>
                    </div>
                </div>

                {/* Preview Card */}
                <div className="rounded-2xl overflow-hidden" style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                    <div className="p-4 border-b border-white/5">
                        <h4 className="font-bold text-sm text-gray-400 uppercase tracking-wider">Preview</h4>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-primary to-blue-400 flex items-center justify-center">
                                <Sparkles size={18} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-sm">Treino gerado</p>
                                <p className="text-xs text-gray-500">Peito e Tríceps • 45 min</p>
                            </div>
                            <div className="px-2 py-1 bg-accent/20 rounded-md">
                                <span className="text-xs font-bold text-accent">Novo</span>
                            </div>
                        </div>
                        <div className="h-2 rounded-full bg-white/5">
                            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-primary to-accent" />
                        </div>
                    </div>
                </div>

                {/* Info Note */}
                <div className="rounded-2xl p-4" style={{
                    background: 'linear-gradient(145deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                    <p className="text-sm text-blue-300 flex items-start gap-2">
                        <span className="text-lg">💡</span>
                        <span><strong>Nota:</strong> O tema claro está em desenvolvimento. Por enquanto, o tema escuro oferece a melhor experiência.</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
