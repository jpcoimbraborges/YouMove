'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import {
    Timer,
    Volume2,
    Vibrate,
    Save,
    CheckCircle,
    Minus,
    Plus,
    Sparkles,
    Palette
} from 'lucide-react';

interface Settings {
    defaultRestTime: number;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    autoStartRest: boolean;
    aiCoachEnabled: boolean;
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<Settings>({
        defaultRestTime: 90,
        soundEnabled: true,
        vibrationEnabled: true,
        autoStartRest: true,
        aiCoachEnabled: true
    });
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        // Load from localStorage
        const savedSettings = localStorage.getItem('youmove_settings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem('youmove_settings', JSON.stringify(settings));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const adjustRestTime = (delta: number) => {
        const newTime = Math.max(15, Math.min(300, settings.defaultRestTime + delta));
        setSettings({ ...settings, defaultRestTime: newTime });
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins > 0) {
            return secs > 0 ? `${mins}min ${secs}s` : `${mins}min`;
        }
        return `${secs}s`;
    };

    return (
        <div className="pb-32">
            <PageHeader title="Configurações" showBack />

            <div className="px-5 py-4 space-y-6">
                {/* Timer Settings */}
                <div className="space-y-4">
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Timer size={16} />
                        Tempo de Descanso
                    </h2>

                    <div className="card p-0 overflow-hidden">
                        <button
                            onClick={() => window.location.href = '/settings/appearance'}
                            className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                                    <Palette size={18} className="text-pink-400" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium">Aparência</p>
                                    <p className="text-xs text-gray-500">Temas e cores</p>
                                </div>
                            </div>
                            <div className="text-gray-500">
                                ›
                            </div>
                        </button>
                    </div>

                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2 pt-4">
                        <Timer size={16} />
                        Tempo de Descanso
                    </h2>

                    <div className="card">
                        <p className="text-sm text-gray-400 mb-4">
                            Tempo padrão de descanso entre séries
                        </p>
                        <div className="flex items-center justify-center gap-6">
                            <button
                                onClick={() => adjustRestTime(-15)}
                                className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 transition-transform"
                            >
                                <Minus size={24} className="text-white" />
                            </button>
                            <div className="text-center">
                                <p className="text-4xl font-bold text-primary">
                                    {formatTime(settings.defaultRestTime)}
                                </p>
                            </div>
                            <button
                                onClick={() => adjustRestTime(15)}
                                className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 transition-transform"
                            >
                                <Plus size={24} className="text-white" />
                            </button>
                        </div>
                        <div className="flex justify-center gap-2 mt-4">
                            {[30, 60, 90, 120].map((time) => (
                                <button
                                    key={time}
                                    onClick={() => setSettings({ ...settings, defaultRestTime: time })}
                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${settings.defaultRestTime === time
                                        ? 'bg-primary text-white'
                                        : 'bg-white/5 text-gray-400'
                                        }`}
                                >
                                    {formatTime(time)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Notification Settings */}
                <div className="space-y-4">
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                        Notificações
                    </h2>

                    <div className="card space-y-4">
                        {/* Sound */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                    <Volume2 size={18} className="text-blue-400" />
                                </div>
                                <div>
                                    <p className="font-medium">Som</p>
                                    <p className="text-xs text-gray-500">Alerta sonoro ao fim do descanso</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
                                className={`w-14 h-8 rounded-full transition-colors ${settings.soundEnabled ? 'bg-primary' : 'bg-white/10'
                                    }`}
                            >
                                <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${settings.soundEnabled ? 'translate-x-7' : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>

                        {/* Vibration */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                    <Vibrate size={18} className="text-purple-400" />
                                </div>
                                <div>
                                    <p className="font-medium">Vibração</p>
                                    <p className="text-xs text-gray-500">Vibrar ao fim do descanso</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, vibrationEnabled: !settings.vibrationEnabled })}
                                className={`w-14 h-8 rounded-full transition-colors ${settings.vibrationEnabled ? 'bg-primary' : 'bg-white/10'
                                    }`}
                            >
                                <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${settings.vibrationEnabled ? 'translate-x-7' : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>

                        {/* Auto Start Rest */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                                    <Timer size={18} className="text-green-400" />
                                </div>
                                <div>
                                    <p className="font-medium">Auto-iniciar Descanso</p>
                                    <p className="text-xs text-gray-500">Iniciar timer automaticamente</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, autoStartRest: !settings.autoStartRest })}
                                className={`w-14 h-8 rounded-full transition-colors ${settings.autoStartRest ? 'bg-primary' : 'bg-white/10'
                                    }`}
                            >
                                <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${settings.autoStartRest ? 'translate-x-7' : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* AI Settings */}
                <div className="space-y-4">
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles size={16} />
                        Inteligência Artificial
                    </h2>

                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                    <Sparkles size={18} className="text-purple-400" />
                                </div>
                                <div>
                                    <p className="font-medium">AI Coach</p>
                                    <p className="text-xs text-gray-500">Dicas inteligentes durante o treino</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, aiCoachEnabled: !settings.aiCoachEnabled })}
                                className={`w-14 h-8 rounded-full transition-colors ${settings.aiCoachEnabled ? 'bg-primary' : 'bg-white/10'
                                    }`}
                            >
                                <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${settings.aiCoachEnabled ? 'translate-x-7' : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* App Info */}
                <div className="text-center text-xs text-gray-500 pt-4">
                    <p>YouMove v1.0.0</p>
                    <p className="mt-1">Feito com 💚 para atletas</p>
                </div>
            </div>

            {/* Save Button */}
            <div className="fixed bottom-20 left-0 right-0 p-5 z-50" style={{ background: 'linear-gradient(0deg, #0A0F14 0%, transparent 100%)' }}>
                <Button
                    onClick={handleSave}
                    fullWidth
                    className={saved ? 'bg-green-500 hover:bg-green-600' : ''}
                >
                    {saved ? (
                        <>
                            <CheckCircle size={20} />
                            Salvo!
                        </>
                    ) : (
                        <>
                            <Save size={20} />
                            Salvar Configurações
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
