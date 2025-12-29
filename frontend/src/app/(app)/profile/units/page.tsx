'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Globe, Check, Ruler, Scale, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type UnitSystem = 'metric' | 'imperial';

export default function UnitsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [selectedSystem, setSelectedSystem] = useState<UnitSystem>('metric');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadPreferences = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('unit_system')
                    .eq('id', user.id)
                    .single();

                if (profile?.unit_system) {
                    setSelectedSystem(profile.unit_system as UnitSystem);
                }
            } catch (error) {
                console.error('Error loading preferences:', error);
            } finally {
                setLoading(false);
            }
        };

        loadPreferences();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ unit_system: selectedSystem })
                .eq('id', user.id);

            if (error) throw error;

            alert('✅ Preferências salvas com sucesso!');
            router.push('/profile');
        } catch (error: any) {
            console.error('Error saving:', error);
            alert('❌ Erro ao salvar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const metricExamples = {
        weight: { value: 75, unit: 'kg' },
        height: { value: 178, unit: 'cm' },
        distance: { value: 5, unit: 'km' }
    };

    const imperialExamples = {
        weight: { value: 165, unit: 'lb' },
        height: { value: `5'10"`, unit: '' },
        distance: { value: 3.1, unit: 'mi' }
    };

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
                    <h1 className="text-xl lg:text-2xl font-bold text-white">Unidades</h1>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 lg:p-8 pb-28 max-w-3xl mx-auto">
                {/* Description Card */}
                <div className="rounded-2xl p-4 border border-blue-500/20 mb-6" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/20 flex-shrink-0">
                            <Globe size={20} className="text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-white font-semibold mb-1">Sistema de Medidas</h2>
                            <p className="text-sm text-gray-400">
                                Escolha como deseja visualizar pesos, alturas e distâncias.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sistema Métrico */}
                <div className="space-y-4">
                    <button
                        onClick={() => setSelectedSystem('metric')}
                        className={`w-full rounded-2xl p-5 border-2 transition-all text-left ${selectedSystem === 'metric'
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                            }`}
                        style={{ background: selectedSystem === 'metric' ? 'rgba(59, 130, 246, 0.1)' : '#1F2937' }}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="text-2xl">🌍</div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Sistema Métrico</h3>
                                    <p className="text-sm text-gray-400">Padrão Internacional</p>
                                </div>
                            </div>
                            {selectedSystem === 'metric' && (
                                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                    <Check size={14} className="text-white" />
                                </div>
                            )}
                        </div>

                        {/* Examples */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-black/20 rounded-xl p-3 text-center">
                                <Scale size={16} className="text-gray-400 mx-auto mb-1" />
                                <p className="text-xs text-gray-500 mb-1">Peso</p>
                                <p className="text-lg font-bold text-white">
                                    {metricExamples.weight.value}
                                    <span className="text-xs text-gray-400 font-normal ml-1">{metricExamples.weight.unit}</span>
                                </p>
                            </div>
                            <div className="bg-black/20 rounded-xl p-3 text-center">
                                <Ruler size={16} className="text-gray-400 mx-auto mb-1" />
                                <p className="text-xs text-gray-500 mb-1">Altura</p>
                                <p className="text-lg font-bold text-white">
                                    {metricExamples.height.value}
                                    <span className="text-xs text-gray-400 font-normal ml-1">{metricExamples.height.unit}</span>
                                </p>
                            </div>
                            <div className="bg-black/20 rounded-xl p-3 text-center">
                                <Globe size={16} className="text-gray-400 mx-auto mb-1" />
                                <p className="text-xs text-gray-500 mb-1">Distância</p>
                                <p className="text-lg font-bold text-white">
                                    {metricExamples.distance.value}
                                    <span className="text-xs text-gray-400 font-normal ml-1">{metricExamples.distance.unit}</span>
                                </p>
                            </div>
                        </div>
                    </button>

                    {/* Sistema Imperial */}
                    <button
                        onClick={() => setSelectedSystem('imperial')}
                        className={`w-full rounded-2xl p-5 border-2 transition-all text-left ${selectedSystem === 'imperial'
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                            }`}
                        style={{ background: selectedSystem === 'imperial' ? 'rgba(59, 130, 246, 0.1)' : '#1F2937' }}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="text-2xl">🇺🇸</div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Sistema Imperial</h3>
                                    <p className="text-sm text-gray-400">Padrão Americano</p>
                                </div>
                            </div>
                            {selectedSystem === 'imperial' && (
                                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                    <Check size={14} className="text-white" />
                                </div>
                            )}
                        </div>

                        {/* Examples */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-black/20 rounded-xl p-3 text-center">
                                <Scale size={16} className="text-gray-400 mx-auto mb-1" />
                                <p className="text-xs text-gray-500 mb-1">Peso</p>
                                <p className="text-lg font-bold text-white">
                                    {imperialExamples.weight.value}
                                    <span className="text-xs text-gray-400 font-normal ml-1">{imperialExamples.weight.unit}</span>
                                </p>
                            </div>
                            <div className="bg-black/20 rounded-xl p-3 text-center">
                                <Ruler size={16} className="text-gray-400 mx-auto mb-1" />
                                <p className="text-xs text-gray-500 mb-1">Altura</p>
                                <p className="text-lg font-bold text-white">
                                    {imperialExamples.height.value}
                                </p>
                            </div>
                            <div className="bg-black/20 rounded-xl p-3 text-center">
                                <Globe size={16} className="text-gray-400 mx-auto mb-1" />
                                <p className="text-xs text-gray-500 mb-1">Distância</p>
                                <p className="text-lg font-bold text-white">
                                    {imperialExamples.distance.value}
                                    <span className="text-xs text-gray-400 font-normal ml-1">{imperialExamples.distance.unit}</span>
                                </p>
                            </div>
                        </div>
                    </button>
                </div>

                {/* Info Note */}
                <div className="mt-6 rounded-xl p-4 border border-white/5" style={{ background: '#1F2937' }}>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        💡 <strong className="text-white">Dica:</strong> Esta configuração afetará como os dados são exibidos em todo o aplicativo, incluindo gráficos e estatísticas.
                    </p>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full mt-6 py-4 rounded-xl font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
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
