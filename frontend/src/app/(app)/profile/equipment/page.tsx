'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
    Dumbbell,
    CheckCircle,
    Save,
    Home,
    Building2,
    Zap,
    CircleDot,
    Grip,
    StretchHorizontal,
    Square,
    Move,
    Settings2,
    MonitorSmartphone,
    Footprints,
    Armchair,
    Circle,
    Target,
    Timer,
    Layers,
    Anchor,
    Sparkles,
    Search,
    X
} from 'lucide-react';

interface Equipment {
    id: string;
    name: string;
    icon: any;
    category: 'basic' | 'gym' | 'home' | 'cardio';
}

const equipmentList: Equipment[] = [
    // Básicos
    { id: 'bodyweight', name: 'Peso Corporal', icon: Footprints, category: 'basic' },
    { id: 'dumbbells', name: 'Halteres', icon: Dumbbell, category: 'basic' },
    { id: 'barbell', name: 'Barra', icon: StretchHorizontal, category: 'basic' },
    { id: 'resistance_bands', name: 'Elásticos', icon: Layers, category: 'basic' },
    { id: 'pull_up_bar', name: 'Barra Fixa', icon: Move, category: 'basic' },
    { id: 'kettlebell', name: 'Kettlebell', icon: CircleDot, category: 'basic' },

    // Máquinas
    { id: 'cable_machine', name: 'Máquina de Cabo', icon: Settings2, category: 'gym' },
    { id: 'smith_machine', name: 'Smith Machine', icon: Grip, category: 'gym' },
    { id: 'leg_press', name: 'Leg Press', icon: Square, category: 'gym' },
    { id: 'lat_pulldown', name: 'Puxador', icon: Anchor, category: 'gym' },
    { id: 'chest_press', name: 'Supino Máquina', icon: MonitorSmartphone, category: 'gym' },
    { id: 'leg_extension', name: 'Cadeira Extensora', icon: Armchair, category: 'gym' },
    { id: 'leg_curl', name: 'Mesa Flexora', icon: Target, category: 'gym' },

    // Cardio
    { id: 'treadmill', name: 'Esteira', icon: Timer, category: 'cardio' },
    { id: 'bike', name: 'Bicicleta', icon: Circle, category: 'cardio' },
    { id: 'rowing_machine', name: 'Remadora', icon: Timer, category: 'cardio' },
    { id: 'jump_rope', name: 'Corda de Pular', icon: Zap, category: 'cardio' },

    // Casa/Acessórios
    { id: 'bench', name: 'Banco', icon: Square, category: 'home' },
    { id: 'yoga_mat', name: 'Tapete de Yoga', icon: Layers, category: 'home' },
    { id: 'foam_roller', name: 'Rolo de Espuma', icon: Circle, category: 'home' },
    { id: 'medicine_ball', name: 'Medicine Ball', icon: Circle, category: 'home' },
    { id: 'trx', name: 'TRX / Suspensão', icon: Anchor, category: 'home' },
];

const categories = [
    { id: 'all', label: 'Todos', icon: Dumbbell },
    { id: 'basic', label: 'Básicos', icon: Dumbbell },
    { id: 'gym', label: 'Máquinas', icon: Building2 },
    { id: 'cardio', label: 'Cardio', icon: Zap },
    { id: 'home', label: 'Acessórios', icon: Home },
] as const;

export default function EquipmentPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            const { data } = await supabase
                .from('profiles')
                .select('equipment_available')
                .eq('id', user.id)
                .single();

            if (data?.equipment_available) {
                setSelectedEquipment(data.equipment_available);
            }
            setLoading(false);
        };

        fetchProfile();
    }, [user]);

    const toggleEquipment = (equipmentId: string) => {
        setSelectedEquipment(prev =>
            prev.includes(equipmentId)
                ? prev.filter(id => id !== equipmentId)
                : [...prev, equipmentId]
        );
        setSaved(false);
    };

    const selectAllCategory = (category: string) => {
        const categoryItems = equipmentList
            .filter(e => category === 'all' || e.category === category)
            .map(e => e.id);

        const allSelected = categoryItems.every(id => selectedEquipment.includes(id));

        if (allSelected) {
            setSelectedEquipment(prev => prev.filter(id => !categoryItems.includes(id)));
        } else {
            setSelectedEquipment(prev => [...new Set([...prev, ...categoryItems])]);
        }
        setSaved(false);
    };

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    equipment_available: selectedEquipment,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;
            setSaved(true);
            setTimeout(() => {
                setSaved(false);
                router.push('/profile');
            }, 1500);
        } catch (err: any) {
            console.error('Error saving equipment:', err);
            alert('Erro ao salvar: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const filteredEquipment = equipmentList.filter(item => {
        const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const getCategoryCount = (category: string) => {
        const items = equipmentList.filter(e => category === 'all' || e.category === category);
        const selected = items.filter(e => selectedEquipment.includes(e.id));
        return { selected: selected.length, total: items.length };
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0E14' }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-gray-400 text-sm">Carregando equipamentos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-48 lg:pb-32" style={{ background: '#0B0E14' }}>
            {/* Header */}
            <div className="sticky top-0 z-50 px-6 py-4 backdrop-blur-xl border-b border-white/5" style={{ background: 'rgba(11, 14, 20, 0.95)' }}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Seus Equipamentos</h1>
                        <p className="text-sm text-gray-400 mt-0.5">{selectedEquipment.length} selecionados</p>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar equipamento..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        style={{ background: '#1F2937' }}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Hero Card - Subtle */}
            <div className="px-6 pt-6">
                <div className="rounded-xl p-4 border border-gray-700/50 flex items-start gap-3" style={{ background: 'rgba(31, 41, 55, 0.3)' }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(6, 182, 212, 0.15)' }}>
                        <Sparkles size={20} className="text-cyan-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-gray-300 leading-relaxed">
                            Selecione o que você tem disponível. A IA adaptará os exercícios automaticamente.
                        </p>
                    </div>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="px-6 pt-6">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map(cat => {
                        const Icon = cat.icon;
                        const isActive = activeCategory === cat.id;
                        const count = getCategoryCount(cat.id);

                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${isActive
                                        ? 'text-white shadow-lg'
                                        : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                                    }`}
                                style={{
                                    background: isActive ? '#3B82F6' : '#1F2937'
                                }}
                            >
                                <Icon size={16} strokeWidth={2.5} />
                                {cat.label}
                                <span className={`text-xs px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-500'
                                    }`}>
                                    {count.selected}/{count.total}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Equipment Grid */}
            <div className="px-6 pt-6 pb-6">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                        {filteredEquipment.length} {filteredEquipment.length === 1 ? 'item' : 'itens'}
                    </p>
                    <button
                        onClick={() => selectAllCategory(activeCategory)}
                        className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        {activeCategory === 'all' && selectedEquipment.length === equipmentList.length
                            ? 'Desmarcar todos'
                            : 'Selecionar todos'}
                    </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {filteredEquipment.map(equipment => {
                        const Icon = equipment.icon;
                        const isSelected = selectedEquipment.includes(equipment.id);

                        return (
                            <button
                                key={equipment.id}
                                onClick={() => toggleEquipment(equipment.id)}
                                className={`relative rounded-xl p-5 flex flex-col items-center gap-3 transition-all duration-200 group ${isSelected
                                        ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20'
                                        : 'hover:bg-white/5 active:scale-95'
                                    }`}
                                style={{
                                    background: isSelected ? 'rgba(59, 130, 246, 0.15)' : '#1F2937'
                                }}
                            >
                                {/* Check Indicator */}
                                {isSelected && (
                                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center animate-in zoom-in duration-200">
                                        <CheckCircle size={16} className="text-white" fill="white" />
                                    </div>
                                )}

                                {/* Icon */}
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${isSelected
                                        ? 'bg-blue-500 text-white scale-105'
                                        : 'bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-gray-300'
                                    }`}>
                                    <Icon size={32} strokeWidth={1.5} />
                                </div>

                                {/* Name */}
                                <span className={`text-sm font-medium text-center leading-tight transition-colors ${isSelected ? 'text-white font-semibold' : 'text-gray-300'
                                    }`}>
                                    {equipment.name}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {filteredEquipment.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                            <Search size={32} className="text-gray-600" />
                        </div>
                        <p className="text-gray-400 text-sm">Nenhum equipamento encontrado</p>
                        <p className="text-gray-600 text-xs mt-1">Tente outra busca ou categoria</p>
                    </div>
                )}
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
                                Salvar Equipamentos ({selectedEquipment.length})
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
