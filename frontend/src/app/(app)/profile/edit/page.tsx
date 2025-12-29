'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
    User,
    Mail,
    Scale,
    Ruler,
    Target,
    Dumbbell,
    Camera,
    Save,
    CheckCircle,
    Calendar,
    X,
    Lock,
    Flame,
    TrendingUp,
    Heart,
    Zap,
    Activity,
    Shield
} from 'lucide-react';

interface ProfileData {
    full_name: string;
    weight_kg: number | null;
    height_cm: number | null;
    fitness_goal: string;
    fitness_level: string;
    birth_date: string;
}

const fitnessGoals = [
    { id: 'muscle', label: 'Ganhar massa muscular', icon: Dumbbell },
    { id: 'fat', label: 'Perder gordura', icon: Flame },
    { id: 'maintain', label: 'Manter forma', icon: Heart },
    { id: 'strength', label: 'Aumentar força', icon: Zap },
    { id: 'conditioning', label: 'Melhorar condicionamento', icon: Activity },
    { id: 'rehab', label: 'Reabilitação', icon: Shield }
];

const fitnessLevels = ['Iniciante', 'Intermediário', 'Avançado', 'Atleta'];

// Translation maps for database enum values
const levelToDb: Record<string, string> = {
    'Iniciante': 'beginner',
    'Intermediário': 'intermediate',
    'Avançado': 'advanced',
    'Atleta': 'elite'
};

const dbToLevel: Record<string, string> = {
    'beginner': 'Iniciante',
    'intermediate': 'Intermediário',
    'advanced': 'Avançado',
    'elite': 'Atleta'
};

export default function EditProfilePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [errors, setErrors] = useState<Record<string, boolean>>({});
    const [profile, setProfile] = useState<ProfileData>({
        full_name: '',
        weight_kg: null,
        height_cm: null,
        fitness_goal: 'Ganhar massa muscular',
        fitness_level: 'Intermediário',
        birth_date: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) {
                setProfile({
                    full_name: data.full_name || user.user_metadata?.full_name || '',
                    weight_kg: data.weight_kg || null,
                    height_cm: data.height_cm || null,
                    fitness_goal: data.fitness_goal || 'Ganhar massa muscular',
                    fitness_level: dbToLevel[data.fitness_level] || 'Intermediário',
                    birth_date: data.birth_date || ''
                });
            } else {
                setProfile(prev => ({
                    ...prev,
                    full_name: user.user_metadata?.full_name || ''
                }));
            }
            setLoading(false);
        };

        fetchProfile();
    }, [user]);

    const validateForm = () => {
        const newErrors: Record<string, boolean> = {};
        if (!profile.full_name.trim()) newErrors.full_name = true;
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!user || !validateForm()) return;

        setSaving(true);
        setSaved(false);

        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    email: user.email,
                    full_name: profile.full_name,
                    weight_kg: profile.weight_kg,
                    height_cm: profile.height_cm,
                    fitness_goal: profile.fitness_goal,
                    fitness_level: levelToDb[profile.fitness_level] || 'intermediate',
                    birth_date: profile.birth_date || null,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            await supabase.auth.updateUser({
                data: { full_name: profile.full_name }
            });

            setSaved(true);
            setTimeout(() => {
                setSaved(false);
                router.push('/profile');
            }, 1500);
        } catch (err: any) {
            console.error('Error saving profile:', err);
            alert('Erro ao salvar: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const getInitials = () => {
        if (!profile.full_name) return user?.email?.[0].toUpperCase() || 'U';
        const names = profile.full_name.split(' ');
        return names.length > 1
            ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
            : names[0][0].toUpperCase();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0E14' }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-gray-400 text-sm">Carregando perfil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-48 lg:pb-32" style={{ background: '#0B0E14' }}>
            {/* Header com botão fechar */}
            <div className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between backdrop-blur-xl border-b border-white/5" style={{ background: 'rgba(11, 14, 20, 0.95)' }}>
                <h1 className="text-lg font-semibold text-white">Editar Informações</h1>
                <button
                    onClick={() => router.back()}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Avatar Section */}
            <div className="px-6 py-8 flex flex-col items-center gap-4">
                <div className="relative">
                    <div
                        className="w-28 h-28 rounded-full flex items-center justify-center text-3xl font-bold text-white border-4"
                        style={{ background: '#1F2937', borderColor: '#3B82F6' }}
                    >
                        {getInitials()}
                    </div>
                    <button
                        className="absolute bottom-0 right-0 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110"
                        style={{ background: '#3B82F6' }}
                    >
                        <Camera size={18} />
                    </button>
                </div>
            </div>

            {/* Main Content - Desktop Grid */}
            <div className="px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* LEFT COLUMN - Informações Pessoais */}
                    <div className="space-y-6">
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Informações Pessoais
                        </h2>

                        {/* Nome - Floating Label Style */}
                        <div className="relative">
                            <label className="absolute left-4 top-2 text-xs text-gray-500 font-medium">
                                Nome Completo
                            </label>
                            <input
                                type="text"
                                value={profile.full_name}
                                onChange={(e) => {
                                    setProfile({ ...profile, full_name: e.target.value });
                                    setErrors({ ...errors, full_name: false });
                                }}
                                className={`w-full pt-7 pb-3 px-4 rounded-xl text-white text-lg focus:outline-none transition-all ${errors.full_name
                                    ? 'ring-2 ring-red-500'
                                    : 'focus:ring-2 focus:ring-blue-500'
                                    }`}
                                style={{ background: '#1F2937' }}
                                placeholder="Digite seu nome"
                            />
                            {errors.full_name && (
                                <p className="text-red-400 text-xs mt-1.5 ml-1">Nome é obrigatório</p>
                            )}
                        </div>

                        {/* Email - Locked */}
                        <div className="relative opacity-60">
                            <label className="absolute left-4 top-2 text-xs text-gray-500 font-medium flex items-center gap-1.5">
                                <Lock size={12} />
                                Email (não editável)
                            </label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="w-full pt-7 pb-3 px-4 rounded-xl text-gray-400 text-lg cursor-not-allowed"
                                style={{ background: '#1F2937' }}
                            />
                        </div>

                        {/* Data de Nascimento */}
                        <div className="relative">
                            <label className="absolute left-4 top-2 text-xs text-gray-500 font-medium flex items-center gap-1.5">
                                <Calendar size={12} />
                                Data de Nascimento
                            </label>
                            <input
                                type="date"
                                value={profile.birth_date}
                                onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })}
                                className="w-full pt-7 pb-3 px-4 rounded-xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                style={{ background: '#1F2937' }}
                            />
                        </div>

                        {/* Medidas Físicas */}
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-4">
                            Medidas Físicas
                        </h2>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Peso */}
                            <div
                                className="relative rounded-2xl p-6 flex flex-col items-center justify-center overflow-hidden"
                                style={{ background: '#1F2937' }}
                            >
                                <Scale size={40} className="absolute top-4 right-4 text-white/5" strokeWidth={1.5} />
                                <label className="text-xs text-gray-500 font-medium mb-2">Peso</label>
                                <div className="flex items-baseline gap-1">
                                    <input
                                        type="number"
                                        value={profile.weight_kg || ''}
                                        onChange={(e) => setProfile({ ...profile, weight_kg: e.target.value ? parseFloat(e.target.value) : null })}
                                        className="w-20 text-4xl font-bold text-white bg-transparent text-center focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
                                        placeholder="--"
                                        step="0.1"
                                    />
                                    <span className="text-lg text-gray-400 font-medium">kg</span>
                                </div>
                            </div>

                            {/* Altura */}
                            <div
                                className="relative rounded-2xl p-6 flex flex-col items-center justify-center overflow-hidden"
                                style={{ background: '#1F2937' }}
                            >
                                <Ruler size={40} className="absolute top-4 right-4 text-white/5" strokeWidth={1.5} />
                                <label className="text-xs text-gray-500 font-medium mb-2">Altura</label>
                                <div className="flex items-baseline gap-1">
                                    <input
                                        type="number"
                                        value={profile.height_cm || ''}
                                        onChange={(e) => setProfile({ ...profile, height_cm: e.target.value ? parseInt(e.target.value) : null })}
                                        className="w-20 text-4xl font-bold text-white bg-transparent text-center focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
                                        placeholder="--"
                                    />
                                    <span className="text-lg text-gray-400 font-medium">cm</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Configurações de Treino */}
                    <div className="space-y-6">
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Configurações de Treino
                        </h2>

                        {/* Objetivo Principal - Grid 2x3 com Cards */}
                        <div>
                            <label className="flex items-center gap-2 mb-4 text-sm text-gray-400">
                                <Target size={16} className="text-blue-400" />
                                Objetivo Principal
                            </label>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                {fitnessGoals.map((goal) => {
                                    const Icon = goal.icon;
                                    const isSelected = profile.fitness_goal === goal.label;
                                    return (
                                        <button
                                            key={goal.id}
                                            onClick={() => setProfile({ ...profile, fitness_goal: goal.label })}
                                            className={`relative rounded-xl p-5 flex flex-col items-center gap-3 transition-all ${isSelected
                                                ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20'
                                                : 'hover:bg-white/5'
                                                }`}
                                            style={{
                                                background: isSelected ? '#1E3A8A' : '#1F2937'
                                            }}
                                        >
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                                    <CheckCircle size={14} className="text-white" fill="white" />
                                                </div>
                                            )}
                                            <Icon
                                                size={28}
                                                className={isSelected ? 'text-blue-300' : 'text-gray-400'}
                                                strokeWidth={1.5}
                                            />
                                            <span className={`text-xs font-medium text-center leading-tight ${isSelected ? 'text-white' : 'text-gray-300'
                                                }`}>
                                                {goal.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Nível de Experiência - Segmented Control */}
                        <div>
                            <label className="flex items-center gap-2 mb-4 text-sm text-gray-400">
                                <Dumbbell size={16} className="text-blue-400" />
                                Nível de Experiência
                            </label>
                            <div className="relative rounded-xl p-1.5" style={{ background: '#1F2937' }}>
                                <div className="grid grid-cols-4 gap-1">
                                    {fitnessLevels.map((level, index) => {
                                        const isSelected = profile.fitness_level === level;
                                        return (
                                            <button
                                                key={level}
                                                onClick={() => setProfile({ ...profile, fitness_level: level })}
                                                className={`relative px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${isSelected
                                                    ? 'text-white shadow-lg'
                                                    : 'text-gray-400 hover:text-gray-300'
                                                    }`}
                                                style={{
                                                    background: isSelected ? '#3B82F6' : 'transparent'
                                                }}
                                            >
                                                {level}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Footer - Save Button */}
            <div
                className="fixed bottom-20 lg:bottom-0 left-0 right-0 px-6 py-5 z-[100] border-t border-white/5 backdrop-blur-xl"
                style={{ background: 'rgba(11, 14, 20, 0.95)' }}
            >
                <div className="max-w-7xl mx-auto">
                    <button
                        onClick={handleSave}
                        disabled={saving || saved}
                        className={`w-full py-4 rounded-xl font-bold text-white text-lg flex items-center justify-center gap-3 transition-all ${saved
                            ? 'bg-green-500'
                            : 'hover:brightness-110 active:scale-[0.98]'
                            }`}
                        style={{
                            background: saved ? '#10B981' : '#3B82F6',
                            boxShadow: saved
                                ? '0 0 30px rgba(16, 185, 129, 0.4)'
                                : '0 0 30px rgba(59, 130, 246, 0.4)'
                        }}
                    >
                        {saving ? (
                            <>
                                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                Salvando...
                            </>
                        ) : saved ? (
                            <>
                                <CheckCircle size={24} fill="white" />
                                Salvo com Sucesso!
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                Salvar Alterações
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
