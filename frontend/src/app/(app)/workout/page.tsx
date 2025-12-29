'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { LoadingScreen } from '@/components/ui/Loading';
import {
    Sparkles,
    Dumbbell,
    Plus,
    Clock,
    Target,
    ChevronRight,
    Search,
    Filter,
    Brain,
    LayoutGrid,
    TrendingUp,
    Users,
    Utensils,
    Calendar,
    Eye,
    Zap,
    Flame,
    Heart,
    X,
    User,
    Activity,
    Home,
    Building,
    HeartPulse,
    Flower,
    Library
} from 'lucide-react';

// Navigation items
const navItems = [
    { icon: LayoutGrid, label: 'Dashboard', href: '/dashboard', active: false },
    { icon: Calendar, label: 'Histórico', href: '/history', active: false },
    { icon: Dumbbell, label: 'Treinos', href: '/workout', active: true },
    { icon: TrendingUp, label: 'Progresso', href: '/progress', active: false },
    { icon: Users, label: 'Comunidade', href: '/community', active: false },
];

// Muscle tag colors
const getMuscleColor = (muscle: string) => {
    const colors: Record<string, string> = {
        chest: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        peito: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        back: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        costas: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        shoulders: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
        ombros: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
        legs: 'bg-green-500/20 text-green-400 border-green-500/30',
        pernas: 'bg-green-500/20 text-green-400 border-green-500/30',
        arms: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        braços: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        core: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        full_body: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    };
    return colors[muscle.toLowerCase()] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
};

// Reusable Selection Card Component for Standardization
const SelectionCard = ({
    selected,
    onClick,
    icon: Icon,
    title,
    description,
    color = 'blue',
    layout = 'vertical', // vertical or compact
}: {
    selected: boolean;
    onClick: () => void;
    icon?: any;
    title: string;
    description?: string;
    color?: 'blue' | 'cyan' | 'purple' | 'orange' | 'green';
    layout?: 'vertical' | 'compact';
}) => {
    const activeColors = {
        blue: 'border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.3)]',
        cyan: 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.3)]',
        purple: 'border-purple-500 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.3)]',
        orange: 'border-orange-500 bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.3)]',
        green: 'border-green-500 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.3)]',
    };

    const textColors = {
        blue: 'text-blue-400',
        cyan: 'text-cyan-400',
        purple: 'text-purple-400',
        orange: 'text-orange-400',
        green: 'text-green-400',
    };

    return (
        <button
            onClick={onClick}
            className={`
                relative group overflow-hidden rounded-2xl border transition-all duration-300 ease-out
                ${layout === 'vertical' ? 'flex flex-col items-center justify-center p-6 gap-3 text-center' : 'flex items-center p-4 gap-4 text-left'}
                ${selected
                    ? `${activeColors[color]} scale-[1.02] z-10`
                    : 'bg-[#252a33] border-transparent hover:bg-[#2d333b] hover:border-white/10 hover:shadow-xl hover:shadow-black/20 hover:scale-[1.02]'
                }
            `}
        >
            {/* Icon Active Indicator */}
            {selected && (
                <div className={`absolute top-3 right-3 w-1.5 h-1.5 rounded-full ${textColors[color].replace('text-', 'bg-')} shadow-[0_0_8px_currentColor] animate-pulse`} />
            )}

            {/* Icon */}
            {Icon && (
                <div className={`
                    rounded-xl flex items-center justify-center transition-colors duration-300
                    ${layout === 'vertical' ? 'w-12 h-12 mb-1' : 'w-10 h-10'}
                    ${selected ? 'bg-transparent' : 'bg-black/20 group-hover:bg-black/30'}
                `}>
                    <Icon
                        size={layout === 'vertical' ? 28 : 22}
                        className={`transition-colors duration-300 ${selected ? textColors[color] : 'text-gray-400 group-hover:text-gray-200'}`}
                        strokeWidth={1.5}
                    />
                </div>
            )}

            {/* Content */}
            <div className={layout === 'compact' ? 'flex-1' : ''}>
                <span className={`block font-bold transition-colors ${selected ? 'text-white' : 'text-gray-300 group-hover:text-white'} ${layout === 'vertical' ? 'text-base' : 'text-sm'}`}>
                    {title}
                </span>
                {description && (
                    <span className={`block text-xs mt-1 transition-colors ${selected ? 'text-gray-300' : 'text-gray-500 group-hover:text-gray-400'}`}>
                        {description}
                    </span>
                )}
            </div>

            {/* Hover Glow Gradient (Subtle) */}
            {!selected && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            )}
        </button>
    );
};

function WorkoutPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const mode = searchParams.get('mode') || 'ai';

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [selectedMode, setSelectedMode] = useState<'ai' | 'manual'>(mode as 'ai' | 'manual');
    const [aiFocus, setAiFocus] = useState<string>('full_body');
    const [aiDuration, setAiDuration] = useState<number>(45);
    const [aiIntensity, setAiIntensity] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
    const [equipmentType, setEquipmentType] = useState<'gym' | 'home_dumbbells' | 'bodyweight'>('gym');
    const [durationType, setDurationType] = useState<'single' | 'weekly'>('single');
    const [workouts, setWorkouts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedWorkout, setSelectedWorkout] = useState<any | null>(null);
    const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);

    const userName = user?.user_metadata?.full_name?.split(' ')[0]
        || user?.email?.split('@')[0]
        || 'Atleta';

    useEffect(() => {
        const fetchWorkouts = async () => {
            if (!user) {
                setFetching(false);
                return;
            }

            setFetching(true);
            const { data } = await supabase
                .from('workouts')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (data) {
                setWorkouts(data);
                setRecentWorkouts(data.slice(0, 4));
            }
            setFetching(false);
        };

        fetchWorkouts();
    }, [user]);

    const handleGenerateAI = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/workout/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    muscles: [aiFocus],
                    duration: aiDuration,
                    intensity: aiIntensity,
                    equipment: equipmentType,
                    duration_type: durationType,
                })
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Falha ao gerar treino');
            }

            localStorage.setItem('generated_workout', JSON.stringify(data));
            router.push('/workout/ai-generated');
        } catch (error) {
            console.error('Erro na geração de treino:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            alert(`Erro ao gerar treino: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const filteredWorkouts = workouts.filter(w =>
        w.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const focusOptions = [
        { id: 'full_body', label: 'Corpo Todo', icon: User },
        { id: 'upper', label: 'Superiores', icon: Activity },
        { id: 'lower', label: 'Inferiores', icon: Zap },
    ];

    const equipmentOptions = [
        { id: 'gym', label: 'Academia Completa', icon: Building, desc: 'Acesso a todos equipamentos' },
        { id: 'home_dumbbells', label: 'Casa (Halteres)', icon: Home, desc: 'Halteres e peso livre' },
        { id: 'bodyweight', label: 'Sem Equipamento', icon: User, desc: 'Apenas peso corporal' },
    ];

    const intensityOptions = [
        { id: 'beginner', label: 'Iniciante' },
        { id: 'intermediate', label: 'Intermediário' },
        { id: 'advanced', label: 'Beast Mode 🔥' },
    ];

    // Get appropriate icon and color based on workout category
    const getWorkoutIcon = (workout: any) => {
        const category = workout.category?.toLowerCase() || '';
        const name = workout.name?.toLowerCase() || '';
        const muscles = workout.target_muscles || [];

        // Check for cardio keywords
        if (category.includes('cardio') ||
            name.includes('cardio') ||
            name.includes('hiit') ||
            name.includes('corrida') ||
            name.includes('bike')) {
            return {
                icon: HeartPulse,
                bgColor: 'bg-red-500/20',
                iconColor: 'text-red-400'
            };
        }

        // Check for flexibility/yoga keywords
        if (category.includes('flexibility') ||
            category.includes('yoga') ||
            name.includes('yoga') ||
            name.includes('alongamento') ||
            name.includes('stretch')) {
            return {
                icon: Flower,
                bgColor: 'bg-purple-500/20',
                iconColor: 'text-purple-400'
            };
        }

        // Default to strength/dumbbell
        return {
            icon: Dumbbell,
            bgColor: 'bg-blue-500/20',
            iconColor: 'text-blue-400'
        };
    };

    return (
        <div className="min-h-screen flex" style={{ background: '#0B0E14' }}>
            {/* Sidebar - Desktop Only */}
            <aside className="hidden lg:flex flex-col w-56 p-5 border-r border-white/5" style={{ background: '#111318' }}>
                <div className="flex items-center gap-2 mb-10">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#3b82f6' }}>
                        <span className="text-white font-bold text-lg">Y</span>
                    </div>
                    <span className="text-white font-semibold text-lg">YouMove</span>
                </div>

                <nav className="flex flex-col gap-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.active
                                ? 'text-white shadow-lg shadow-blue-500/20'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                            style={item.active ? { background: '#3b82f6' } : {}}
                        >
                            <item.icon size={20} strokeWidth={1.5} />
                            <span className="font-medium text-sm">{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 lg:p-8 pb-28 lg:pb-8 overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl lg:text-3xl font-bold text-white">Central de Treinos</h1>
                    <Link
                        href="/workout/new"
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <Plus size={24} />
                    </Link>
                </div>

                {/* Mode Toggle - Segmented Control */}
                <div className="p-1.5 rounded-2xl mb-8 max-w-md mx-auto lg:mx-0" style={{ background: '#1F2937' }}>
                    <div className="flex">
                        <button
                            onClick={() => setSelectedMode('ai')}
                            className={`flex-1 py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all min-h-[48px] ${selectedMode === 'ai'
                                ? 'text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                                }`}
                            style={selectedMode === 'ai' ? {
                                background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                                boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)'
                            } : {}}
                        >
                            <Brain size={18} />
                            Modo IA
                        </button>
                        <button
                            onClick={() => setSelectedMode('manual')}
                            className={`flex-1 py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all min-h-[48px] ${selectedMode === 'manual'
                                ? 'bg-[#374151] text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <Dumbbell size={18} />
                            Biblioteca Manual
                        </button>
                    </div>
                </div>

                {/* ==================== AI MODE ==================== */}
                {selectedMode === 'ai' && (
                    <div className="animate-fade-in">
                        {/* Hero Section */}
                        <div className="flex flex-col items-center text-center mb-10 relative py-6">
                            {/* Glow Effects */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#06b6d4]/10 rounded-full blur-[80px] pointer-events-none" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#3b82f6]/20 rounded-full blur-[40px] pointer-events-none animate-pulse" />

                            <div className="mb-6 relative z-10">
                                <div className="relative">
                                    <Brain
                                        size={100}
                                        strokeWidth={1}
                                        className="text-[#06b6d4] animate-pulse"
                                        style={{ filter: 'drop-shadow(0 0 25px rgba(6, 182, 212, 0.6))' }}
                                    />
                                    <Sparkles
                                        size={24}
                                        className="absolute -top-2 -right-2 text-[#06b6d4] animate-bounce"
                                        fill="#06b6d4"
                                    />
                                    <Sparkles
                                        size={18}
                                        className="absolute bottom-0 -left-2 text-[#3b82f6] animate-bounce delay-100"
                                        fill="#3b82f6"
                                    />
                                </div>
                            </div>

                            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                                Vamos criar seu treino perfeito, {userName}.
                            </h2>
                            <p className="text-gray-400 max-w-md mx-auto text-sm lg:text-base">
                                Configure as opções abaixo e deixe a IA montar um treino personalizado para você.
                            </p>
                        </div>

                        {/* AI Controls Grid */}
                        <div className="space-y-6 max-w-4xl mx-auto mb-10">
                            {/* Equipment Selection - NEW STEP */}
                            <div className="rounded-2xl p-6 border border-white/5" style={{ background: '#1F2937' }}>
                                <h3 className="text-lg font-bold text-white mb-2">Onde você vai treinar?</h3>
                                <p className="text-sm text-gray-400 mb-6">Isso ajudará a IA a escolher os exercícios certos</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {equipmentOptions.map((equipment) => (
                                        <SelectionCard
                                            key={equipment.id}
                                            selected={equipmentType === equipment.id}
                                            onClick={() => setEquipmentType(equipment.id as any)}
                                            icon={equipment.icon}
                                            title={equipment.label}
                                            description={equipment.desc}
                                            color="cyan"
                                            layout="vertical"
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Plan Type Selection - NEW */}
                            <div className="rounded-2xl p-6 border border-white/5" style={{ background: '#1F2937' }}>
                                <h3 className="text-lg font-bold text-white mb-2">Tipo de Planejamento</h3>
                                <p className="text-sm text-gray-400 mb-6">Você quer um treino rápido ou uma rotina completa?</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <SelectionCard
                                        selected={durationType === 'single'}
                                        onClick={() => setDurationType('single')}
                                        icon={Zap}
                                        title="Treino Único"
                                        description="Sessão avulsa focada no hoje."
                                        color="blue"
                                        layout="compact"
                                    />
                                    <SelectionCard
                                        selected={durationType === 'weekly'}
                                        onClick={() => setDurationType('weekly')}
                                        icon={Calendar}
                                        title="Semanal (7 dias)"
                                        description="Cronograma completo para a semana."
                                        color="purple"
                                        layout="compact"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Focus Selection */}
                                <div className="rounded-2xl p-5 border border-white/5" style={{ background: '#1F2937' }}>
                                    <p className="text-sm text-gray-400 mb-4 font-medium">Foco Muscular</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        {focusOptions.map((focus) => (
                                            <SelectionCard
                                                key={focus.id}
                                                selected={aiFocus === focus.id}
                                                onClick={() => setAiFocus(focus.id)}
                                                icon={focus.icon}
                                                title={focus.label}
                                                color="cyan"
                                                layout="vertical"
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Duration Slider */}
                                <div className="rounded-2xl p-5" style={{ background: '#1F2937' }}>
                                    <p className="text-sm text-gray-400 mb-4 font-medium">Tempo Disponível</p>
                                    <div className="flex flex-col items-center">
                                        <span className="text-4xl font-bold text-white mb-4">{aiDuration}<span className="text-lg text-gray-500">min</span></span>
                                        <input
                                            type="range"
                                            min="15"
                                            max="90"
                                            step="5"
                                            value={aiDuration}
                                            onChange={(e) => setAiDuration(Number(e.target.value))}
                                            className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer accent-[#3b82f6]"
                                            style={{
                                                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((aiDuration - 15) / 75) * 100}%, #374151 ${((aiDuration - 15) / 75) * 100}%, #374151 100%)`
                                            }}
                                        />
                                        <div className="flex justify-between w-full mt-2 text-xs text-gray-500">
                                            <span>15min</span>
                                            <span>90min</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Intensity Selection */}
                                <div className="rounded-2xl p-5 border border-white/5" style={{ background: '#1F2937' }}>
                                    <p className="text-sm text-gray-400 mb-4 font-medium">Nível de Intensidade</p>
                                    <div className="flex flex-col gap-3">
                                        {intensityOptions.map((intensity) => (
                                            <SelectionCard
                                                key={intensity.id}
                                                selected={aiIntensity === intensity.id}
                                                onClick={() => setAiIntensity(intensity.id as any)}
                                                title={intensity.id === 'advanced' ? 'Beast Mode' : intensity.label}
                                                icon={
                                                    intensity.id === 'beginner' ? Sparkles :
                                                        intensity.id === 'intermediate' ? Activity :
                                                            Flame
                                                }
                                                color={
                                                    intensity.id === 'beginner' ? 'green' :
                                                        intensity.id === 'intermediate' ? 'blue' :
                                                            'orange'
                                                }
                                                layout="compact"
                                                description={
                                                    intensity.id === 'beginner' ? 'Para quem está começando' :
                                                        intensity.id === 'intermediate' ? 'Desafio equilibrado' :
                                                            'Prepare-se para suar!'
                                                }
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <div className="max-w-md mx-auto">
                            <button
                                onClick={handleGenerateAI}
                                disabled={loading}
                                className="w-full py-5 rounded-2xl font-bold text-lg text-white flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 min-h-[60px]"
                                style={{
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                                    boxShadow: '0 0 40px rgba(6, 182, 212, 0.4)'
                                }}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Gerando seu treino...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={22} />
                                        Gerar Treino com IA ✨
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* ==================== MANUAL MODE ==================== */}
                {selectedMode === 'manual' && (
                    <div className="animate-fade-in">
                        {/* Recent/Favorites Carousel */}
                        {recentWorkouts.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Acesso Rápido</h3>
                                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
                                    {recentWorkouts.map((workout) => {
                                        const iconConfig = getWorkoutIcon(workout);
                                        const WorkoutIcon = iconConfig.icon;

                                        return (
                                            <Link
                                                key={workout.id}
                                                href={`/workout/${workout.id}`}
                                                className="flex-shrink-0 w-32 h-32 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all hover:scale-105 hover:shadow-lg"
                                                style={{ background: '#1F2937' }}
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${iconConfig.bgColor}`}>
                                                    <WorkoutIcon size={20} className={iconConfig.iconColor} />
                                                </div>
                                                <span className="text-white text-xs font-medium line-clamp-2">{workout.name}</span>
                                            </Link>
                                        );
                                    })}
                                    <Link
                                        href="/workout/new"
                                        className="flex-shrink-0 w-32 h-32 rounded-2xl p-4 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-600 text-gray-500 hover:border-gray-500 hover:text-gray-400 transition-all"
                                    >
                                        <Plus size={28} className="mb-2" />
                                        <span className="text-xs font-medium">Novo Treino</span>
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Templates Banner */}
                        <Link
                            href="/workout/templates"
                            className="block mb-8 rounded-2xl p-1 relative overflow-hidden group transition-all duration-300 hover:scale-[1.01]"
                        >
                            {/* Gradient Border Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-cyan-500/30 to-blue-600/30 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />

                            {/* Content Container */}
                            <div className="relative bg-[#1F2937] hover:bg-[#1F2937]/90 rounded-xl p-5 flex items-center gap-5 transition-colors">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                                    <Library size={28} className="text-white" strokeWidth={1.5} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-white font-bold text-lg group-hover:text-blue-400 transition-colors">Templates Prontos</h3>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">PRO</span>
                                    </div>
                                    <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">Treinos prontos criados por especialistas.</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                                    <ChevronRight size={20} />
                                </div>
                            </div>
                        </Link>
                        {/* Search & Filter */}
                        <div className="flex gap-3 mb-6">
                            <div className="flex-1 relative">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Buscar treino..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl text-white placeholder-gray-500 border border-gray-700 focus:border-blue-500 focus:outline-none transition-all min-h-[48px]"
                                    style={{ background: '#1F2937' }}
                                />
                            </div>
                            <button
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 border border-gray-700 transition-all"
                            >
                                <Filter size={20} />
                            </button>
                        </div>

                        {/* Workouts List */}
                        {fetching ? (
                            <div className="text-center py-12">
                                <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-gray-500">Carregando treinos...</p>
                            </div>
                        ) : filteredWorkouts.length === 0 ? (
                            <div className="text-center py-16 rounded-2xl" style={{ background: '#1F2937' }}>
                                <Dumbbell size={56} className="text-gray-600 mx-auto mb-4" strokeWidth={1} />
                                <p className="text-gray-300 font-medium mb-2">Nenhum treino encontrado</p>
                                <p className="text-gray-500 text-sm mb-6">Crie um novo treino ou use a IA!</p>
                                <Link
                                    href="/workout/new"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white"
                                    style={{ background: '#3b82f6' }}
                                >
                                    <Plus size={18} />
                                    Criar Treino
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {filteredWorkouts.map((workout) => (
                                    <div
                                        key={workout.id}
                                        className="rounded-2xl p-5 transition-all hover:shadow-lg group"
                                        style={{ background: '#1F2937' }}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Icon */}
                                            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                                                <Dumbbell size={26} className="text-blue-400" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="font-semibold text-white truncate">{workout.name}</h3>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedWorkout(workout);
                                                        }}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                                                        title="Quick Look"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                </div>

                                                {/* Tags */}
                                                <div className="flex gap-1.5 mt-2 flex-wrap">
                                                    {workout.target_muscles?.slice(0, 3).map((muscle: string) => (
                                                        <span
                                                            key={muscle}
                                                            className={`px-2 py-0.5 rounded-md text-xs border ${getMuscleColor(muscle)}`}
                                                        >
                                                            {muscle}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Metrics */}
                                                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={14} />
                                                        {workout.avg_duration_minutes || 45} min
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Zap size={14} />
                                                        ~{Math.round((workout.avg_duration_minutes || 45) * 8)} kcal
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Target size={14} />
                                                        {Array.isArray(workout.exercises) ? workout.exercises.length : 0} ex
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Arrow */}
                                            <Link
                                                href={`/workout/${workout.id}`}
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                                            >
                                                <ChevronRight size={20} />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Create New Button */}
                        <Link href="/workout/new" className="block mt-6">
                            <button
                                className="w-full py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 min-h-[56px]"
                                style={{ background: '#374151' }}
                            >
                                <Plus size={20} />
                                Criar Novo Treino
                            </button>
                        </Link>
                    </div>
                )}
            </main>

            {/* Quick Look Modal/Drawer */}
            {selectedWorkout && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center"
                    onClick={() => setSelectedWorkout(null)}
                >
                    <div
                        className="bg-[#1F2937] w-full lg:w-[500px] lg:max-h-[80vh] max-h-[70vh] rounded-t-3xl lg:rounded-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-white/5">
                            <h3 className="font-bold text-white text-lg">{selectedWorkout.name}</h3>
                            <button
                                onClick={() => setSelectedWorkout(null)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Exercise List */}
                        <div className="p-5 overflow-y-auto max-h-[50vh]">
                            <p className="text-sm text-gray-400 mb-4">
                                {Array.isArray(selectedWorkout.exercises) ? selectedWorkout.exercises.length : 0} exercícios
                            </p>
                            <div className="space-y-3">
                                {Array.isArray(selectedWorkout.exercises) && selectedWorkout.exercises.map((exercise: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-bold">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white text-sm font-medium">{exercise.name || exercise.exercise_name}</p>
                                            <p className="text-gray-500 text-xs">
                                                {exercise.sets || 3} séries × {exercise.reps || 12} reps
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action */}
                        <div className="p-5 border-t border-white/5">
                            <Link
                                href={`/active-session/${selectedWorkout.id}`}
                                className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                                style={{ background: '#3b82f6' }}
                            >
                                <Zap size={18} />
                                Iniciar Treino
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Navigation */}
            <nav
                className="lg:hidden fixed bottom-0 left-0 right-0 flex justify-around items-center py-4 border-t border-white/5 backdrop-blur-xl z-40"
                style={{ background: 'rgba(17, 19, 24, 0.95)' }}
            >
                {navItems.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={`flex flex-col items-center gap-1 px-3 py-1 min-w-[44px] min-h-[44px] justify-center ${item.active ? 'text-blue-500' : 'text-gray-500'
                            }`}
                    >
                        <item.icon size={22} strokeWidth={item.active ? 2 : 1.5} />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </Link>
                ))}
            </nav>
        </div>
    );
}

export default function WorkoutPage() {
    return (
        <Suspense fallback={<LoadingScreen message="Carregando treinos..." />}>
            <WorkoutPageContent />
        </Suspense>
    );
}
