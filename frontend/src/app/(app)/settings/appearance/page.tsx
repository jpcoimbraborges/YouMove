'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun, Monitor, Check, Palette, Sparkles } from 'lucide-react';

export default function AppearancePage() {
    const { theme, setTheme, accentColor, setAccentColor } = useTheme();

    const colors = [
        { id: 'lime', value: '#C6FF00' },
        { id: 'blue', value: '#2196F3' },
        { id: 'purple', value: '#9C27B0' },
        { id: 'orange', value: '#FF9800' },
        { id: 'pink', value: '#E91E63' },
        { id: 'teal', value: '#1DE9B6' },
    ] as const;

    return (
        <div className="pb-24">
            <PageHeader title="Aparência" showBack />

            <div className="px-5 py-4 space-y-8">
                {/* Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 p-6 border border-white/10">
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                            <Palette size={24} className="text-purple-300" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg text-white">Personalize o visual</h2>
                            <p className="text-sm text-purple-200">Escolha o tema que combina com você e deixe o app com a sua cara.</p>
                        </div>
                    </div>
                    {/* Decorative background elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl -ml-10 -mb-10" />
                </div>

                {/* Theme Selection */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Monitor size={14} />
                        Tema
                    </h3>

                    <div className="space-y-3">
                        {/* Dark Mode */}
                        <button
                            onClick={() => setTheme('dark')}
                            className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${theme === 'dark'
                                ? 'bg-white/10 border-primary shadow-glow-primary'
                                : 'bg-white/5 border-transparent hover:bg-white/10'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-primary text-white' : 'bg-white/10 text-gray-400'
                                    }`}>
                                    <Moon size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-white">Modo Escuro</span>
                                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                                            Recomendado
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">Visual elegante, ideal para uso noturno</p>
                                </div>
                            </div>
                            {theme === 'dark' && (
                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                    <Check size={14} className="text-white" />
                                </div>
                            )}
                        </button>

                        {/* Light Mode */}
                        <button
                            onClick={() => setTheme('light')}
                            className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${theme === 'light'
                                ? 'bg-white/10 border-primary shadow-glow-primary'
                                : 'bg-white/5 border-transparent hover:bg-white/10'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-primary text-white' : 'bg-white/10 text-gray-400'
                                    }`}>
                                    <Sun size={20} />
                                </div>
                                <div className="text-left">
                                    <span className="font-medium text-white block">Modo Claro</span>
                                    <p className="text-xs text-gray-500 mt-0.5">Melhor visibilidade em ambientes iluminados</p>
                                </div>
                            </div>
                            {theme === 'light' && (
                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                    <Check size={14} className="text-white" />
                                </div>
                            )}
                        </button>

                        {/* System Mode */}
                        <button
                            onClick={() => setTheme('system')}
                            className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${theme === 'system'
                                ? 'bg-white/10 border-primary shadow-glow-primary'
                                : 'bg-white/5 border-transparent hover:bg-white/10'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'system' ? 'bg-primary text-white' : 'bg-white/10 text-gray-400'
                                    }`}>
                                    <Monitor size={20} />
                                </div>
                                <div className="text-left">
                                    <span className="font-medium text-white block">Automático</span>
                                    <p className="text-xs text-gray-500 mt-0.5">Segue as configurações do seu dispositivo</p>
                                </div>
                            </div>
                            {theme === 'system' && (
                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                    <Check size={14} className="text-white" />
                                </div>
                            )}
                        </button>
                    </div>
                </div>

                {/* Accent Color Selection */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles size={14} />
                        Cor de Destaque
                    </h3>

                    <div className="card">
                        <div className="flex items-center justify-between gap-2 px-2 py-4">
                            {colors.map((color) => (
                                <button
                                    key={color.id}
                                    onClick={() => setAccentColor(color.id)}
                                    className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95 ${accentColor === color.id ? 'scale-110' : ''
                                        }`}
                                    style={{
                                        backgroundColor: color.value,
                                        boxShadow: accentColor === color.id ? `0 0 12px ${color.value}80` : 'none'
                                    }}
                                >
                                    {accentColor === color.id && (
                                        <Check size={20} className="text-black/50 stroke-[3]" />
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="text-center mt-4 pb-2">
                            <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
                                Cores personalizadas em breve!
                                <span className="text-xs opacity-50">🎨</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Preview Section */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        PREVIEW
                    </h3>
                    <div className="card-premium p-4 rounded-xl border border-white/10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                                <Sparkles size={20} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-white truncate">Treino gerado</h4>
                                    <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        Novo
                                    </span>
                                </div>
                                <p className="text-sm text-gray-400 truncate">Peito e Tríceps • 45 min</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Development Note */}
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex gap-3">
                    <div className="shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    </div>
                    <p className="text-xs text-blue-200 leading-relaxed">
                        <span className="font-bold text-blue-100">Nota:</span> O tema claro está em desenvolvimento. Por enquanto, o tema escuro oferece a melhor experiência.
                    </p>
                </div>
            </div>
        </div>
    );
}
