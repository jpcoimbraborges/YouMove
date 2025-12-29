'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutGrid,
    Dumbbell,
    Calendar,
    BarChart3,
    User,
    Search,
    Loader2,
    Library,
    Filter,
    X,
    TrendingUp,
    Flame,
    Zap,
    Activity,
    Move
} from 'lucide-react';
import { TemplateCard } from '@/components/workout/TemplateCard';
import { TemplateDetailModal } from '@/components/workout/TemplateDetailModal';
import type { WorkoutTemplate, TemplateFilters } from '@/types/template.types';
import { TEMPLATE_CATEGORIES, DIFFICULTY_LEVELS } from '@/types/template.types';
import { useAuth } from '@/contexts/AuthContext';

const CATEGORY_ICONS: Record<string, any> = {
    strength: Dumbbell,
    hypertrophy: TrendingUp,
    endurance: Activity,
    weight_loss: Flame,
    functional: Zap,
    flexibility: Move
};

export default function TemplatesPage() {
    const router = useRouter();
    const { user } = useAuth();

    // State
    const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
    const [filters, setFilters] = useState<TemplateFilters>({});
    const [showFilters, setShowFilters] = useState(false);

    // Fetch templates
    useEffect(() => {
        const fetchTemplates = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (filters.searchQuery) params.append('search', filters.searchQuery);
                if (filters.category) params.append('category', filters.category);
                if (filters.difficulty) params.append('difficulty', filters.difficulty);
                if (filters.maxDuration) params.append('maxDuration', filters.maxDuration.toString());

                const res = await fetch(`/api/templates?${params.toString()}`);
                const data = await res.json();

                if (data.success) {
                    setTemplates(data.templates);
                }
            } catch (error) {
                console.error('Error fetching templates:', error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchTemplates, 300);
        return () => clearTimeout(timeoutId);
    }, [filters]);

    // Use template handler
    const handleUseTemplate = async (template: WorkoutTemplate) => {
        if (!user) {
            router.push('/login');
            return;
        }

        try {
            const res = await fetch(`/api/templates/${template.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id })
            });

            const data = await res.json();

            if (data.success && data.workout) {
                // Close modal and redirect to the new workout
                setSelectedTemplate(null);
                router.push(`/workout/${data.workout.id}`);
            } else {
                console.error('Error using template:', data.error);
                alert(`Erro ao usar template: ${data.error || 'Erro desconhecido'}`);
            }
        } catch (error) {
            console.error('Error using template:', error);
            alert('Erro ao usar template. Tente novamente.');
        }
    };

    const clearFilters = () => {
        setFilters({});
    };

    const hasActiveFilters = filters.category || filters.difficulty || filters.maxDuration;

    return (
        <div className="min-h-screen bg-[#0B0E14]">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-[#0B0E14]/95 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4">
                    {/* Title Row */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
                                <Library size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Templates de Treino</h1>
                                <p className="text-sm text-gray-400">Treinos prontos para você começar agora</p>
                            </div>
                        </div>
                        <Link
                            href="/workout"
                            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium transition-colors"
                        >
                            ← Voltar
                        </Link>
                    </div>

                    {/* Search + Filter Row */}
                    <div className="flex gap-3">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar templates..."
                                value={filters.searchQuery || ''}
                                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                                className="w-full bg-[#1c2128] border border-white/5 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>

                        {/* Filter Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-4 py-3 rounded-xl border transition-all flex items-center gap-2
                                ${showFilters || hasActiveFilters
                                    ? 'bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border-blue-500/50 text-blue-400 shadow-lg shadow-blue-500/10'
                                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            <Filter size={20} />
                            <span className="hidden sm:inline">Filtros</span>
                            {hasActiveFilters && (
                                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                            )}
                        </button>
                    </div>

                    {/* Expanded Filters */}
                    {showFilters && (
                        <div className="mt-4 p-4 rounded-xl bg-[#1c2128] border border-white/5">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-medium text-white">Filtrar por:</span>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                    >
                                        <X size={14} /> Limpar filtros
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Category */}
                                <div>
                                    <label className="text-xs text-gray-400 mb-2 block">Categoria</label>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(TEMPLATE_CATEGORIES).map(([key, val]) => {
                                            const Icon = CATEGORY_ICONS[key] || Dumbbell;
                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => setFilters({
                                                        ...filters,
                                                        category: filters.category === key ? undefined : key
                                                    })}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                                                        ${filters.category === key
                                                            ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25 border border-transparent'
                                                            : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent hover:border-white/10'
                                                        }`}
                                                >
                                                    <Icon size={14} /> {val.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Difficulty */}
                                <div>
                                    <label className="text-xs text-gray-400 mb-2 block">Nível</label>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(DIFFICULTY_LEVELS).map(([key, val]) => (
                                            <button
                                                key={key}
                                                onClick={() => setFilters({
                                                    ...filters,
                                                    difficulty: filters.difficulty === key ? undefined : key as any
                                                })}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                                                    ${filters.difficulty === key
                                                        ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                    }`}
                                            >
                                                {val.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Duration */}
                                <div>
                                    <label className="text-xs text-gray-400 mb-2 block">Duração máxima</label>
                                    <div className="flex flex-wrap gap-2">
                                        {[30, 45, 60].map((mins) => (
                                            <button
                                                key={mins}
                                                onClick={() => setFilters({
                                                    ...filters,
                                                    maxDuration: filters.maxDuration === mins ? undefined : mins
                                                })}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                                                    ${filters.maxDuration === mins
                                                        ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                    }`}
                                            >
                                                ≤ {mins}min
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                        <p className="text-gray-400">Carregando templates...</p>
                    </div>
                ) : templates.length > 0 ? (
                    <>
                        {/* Results Count */}
                        <p className="text-sm text-gray-500 mb-6">
                            {templates.length} template{templates.length !== 1 ? 's' : ''} encontrado{templates.length !== 1 ? 's' : ''}
                        </p>

                        {/* Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {templates.map(template => (
                                <TemplateCard
                                    key={template.id}
                                    template={template}
                                    onClick={() => setSelectedTemplate(template)}
                                />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Library size={48} className="text-gray-600 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Nenhum template encontrado</h3>
                        <p className="text-gray-400 max-w-md mb-4">
                            Tente ajustar seus filtros de busca.
                        </p>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors"
                            >
                                Limpar filtros
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Modal */}
            {selectedTemplate && (
                <TemplateDetailModal
                    template={selectedTemplate}
                    onClose={() => setSelectedTemplate(null)}
                    onUseTemplate={handleUseTemplate}
                />
            )}
        </div>
    );
}
