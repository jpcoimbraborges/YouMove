'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Clock, Dumbbell, Trophy, Flame, TrendingUp, Save, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationSettings {
    push_notifications_enabled: boolean;
    workout_reminders: boolean;
    reminder_time: string;
    achievement_alerts: boolean;
    progress_updates: boolean;
    motivational_messages: boolean;
    sound_enabled: boolean;
}

export default function NotificationsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<NotificationSettings>({
        push_notifications_enabled: true,
        workout_reminders: true,
        reminder_time: '08:00',
        achievement_alerts: true,
        progress_updates: true,
        motivational_messages: true,
        sound_enabled: true
    });

    useEffect(() => {
        const loadSettings = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('push_notifications_enabled, workout_reminders, reminder_time')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setSettings(prev => ({
                        ...prev,
                        push_notifications_enabled: profile.push_notifications_enabled ?? true,
                        workout_reminders: profile.workout_reminders ?? true,
                        reminder_time: profile.reminder_time || '08:00'
                    }));
                }
            } catch (error) {
                console.error('Error loading settings:', error);
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    push_notifications_enabled: settings.push_notifications_enabled,
                    workout_reminders: settings.workout_reminders,
                    reminder_time: settings.reminder_time
                })
                .eq('id', user.id);

            if (error) throw error;

            alert('✅ Configurações salvas com sucesso!');
        } catch (error: any) {
            console.error('Error saving:', error);
            alert('❌ Erro ao salvar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleSetting = (key: keyof NotificationSettings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const notificationTypes = [
        {
            key: 'workout_reminders' as keyof NotificationSettings,
            icon: Dumbbell,
            title: 'Lembretes de Treino',
            description: 'Receba notificações para não perder seus treinos',
            color: 'text-blue-400'
        },
        {
            key: 'achievement_alerts' as keyof NotificationSettings,
            icon: Trophy,
            title: 'Conquistas e Recordes',
            description: 'Seja notificado ao bater novos recordes',
            color: 'text-yellow-400'
        },
        {
            key: 'progress_updates' as keyof NotificationSettings,
            icon: TrendingUp,
            title: 'Atualizações de Progresso',
            description: 'Resumos semanais do seu desempenho',
            color: 'text-green-400'
        },
        {
            key: 'motivational_messages' as keyof NotificationSettings,
            icon: Flame,
            title: 'Mensagens Motivacionais',
            description: 'Dicas e motivação do Coach IA',
            color: 'text-orange-400'
        }
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0E14' }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    <p className="text-gray-400 text-sm">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ background: '#0B0E14' }}>
            {/* Header */}
            <div className="sticky top-0 z-30 p-4 lg:p-6 border-b border-white/5 backdrop-blur-xl" style={{ background: 'rgba(11, 14, 20, 0.9)' }}>
                <div className="flex items-center gap-4 max-w-3xl mx-auto">
                    <button
                        onClick={() => router.push('/profile')}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl lg:text-2xl font-bold text-white">Notificações</h1>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 lg:p-8 pb-28 max-w-3xl mx-auto space-y-6">
                {/* Master Toggle */}
                <div className="rounded-2xl p-5 border border-blue-500/20" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/20">
                                <Bell size={24} className="text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Notificações Push</h3>
                                <p className="text-sm text-gray-400">Ativar/desativar todas as notificações</p>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleSetting('push_notifications_enabled')}
                            className={`w-14 h-7 rounded-full p-1 transition-colors duration-200 ${settings.push_notifications_enabled ? 'bg-blue-500' : 'bg-white/10'
                                }`}
                        >
                            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${settings.push_notifications_enabled ? 'translate-x-7' : 'translate-x-0'
                                }`} />
                        </button>
                    </div>
                </div>

                {/* Notification Types */}
                <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: '#1F2937' }}>
                    <h3 className="text-xs text-gray-400 font-medium px-5 py-3 uppercase tracking-wider border-b border-white/5">
                        Tipos de Notificação
                    </h3>
                    {notificationTypes.map((type, index) => (
                        <div
                            key={type.key}
                            className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors"
                            style={{
                                borderBottom: index < notificationTypes.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                            }}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/5`}>
                                    <type.icon size={20} className={type.color} />
                                </div>
                                <div>
                                    <p className="text-white font-medium">{type.title}</p>
                                    <p className="text-sm text-gray-400">{type.description}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => toggleSetting(type.key)}
                                disabled={!settings.push_notifications_enabled}
                                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${settings[type.key] ? 'bg-blue-500' : 'bg-white/10'
                                    } ${!settings.push_notifications_enabled ? 'opacity-30' : ''}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${settings[type.key] ? 'translate-x-6' : 'translate-x-0'
                                    }`} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Reminder Time */}
                <div className="rounded-2xl p-5 border border-white/5" style={{ background: '#1F2937' }}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10">
                            <Clock size={20} className="text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-semibold">Horário dos Lembretes</h3>
                            <p className="text-sm text-gray-400">Quando você prefere ser lembrado?</p>
                        </div>
                    </div>
                    <input
                        type="time"
                        value={settings.reminder_time}
                        onChange={(e) => setSettings(prev => ({ ...prev, reminder_time: e.target.value }))}
                        disabled={!settings.workout_reminders || !settings.push_notifications_enabled}
                        className="w-full px-4 py-3 rounded-xl text-white bg-black/30 border border-white/10 focus:border-blue-500 focus:outline-none disabled:opacity-30"
                    />
                </div>

                {/* Sound Setting */}
                <div className="rounded-2xl p-5 border border-white/5" style={{ background: '#1F2937' }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/10">
                                {settings.sound_enabled ? (
                                    <Volume2 size={20} className="text-purple-400" />
                                ) : (
                                    <VolumeX size={20} className="text-purple-400" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-white font-medium">Som das Notificações</h3>
                                <p className="text-sm text-gray-400">Reproduzir som ao receber notificações</p>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleSetting('sound_enabled')}
                            disabled={!settings.push_notifications_enabled}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${settings.sound_enabled ? 'bg-purple-500' : 'bg-white/10'
                                } ${!settings.push_notifications_enabled ? 'opacity-30' : ''}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${settings.sound_enabled ? 'translate-x-6' : 'translate-x-0'
                                }`} />
                        </button>
                    </div>
                </div>

                {/* Info Note */}
                <div className="rounded-xl p-4 border border-white/5" style={{ background: '#1F2937' }}>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        💡 <strong className="text-white">Nota:</strong> As notificações podem ajudar você a manter a consistência e não perder seus treinos. Você pode ajustar essas configurações a qualquer momento.
                    </p>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-4 rounded-xl font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{
                        background: '#3b82f6',
                        boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
                    }}
                >
                    {saving ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Save size={20} />
                            Salvar Preferências
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
