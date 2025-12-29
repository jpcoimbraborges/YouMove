'use client';

/**
 * YOUMOVE - Muscle Heatmap Component (3D Realistic Version)
 * 
 * Visualização 3D realista do corpo humano com indicadores de status muscular
 * posicionados sobre cada grupo muscular específico.
 */

import Image from 'next/image';
import { useMemo } from 'react';

interface MuscleData {
    muscle: string;
    volume: number;
    sessions: number;
}

interface MuscleHeatmapProps {
    data: MuscleData[];
    className?: string;
}

// Coordenadas dos músculos na imagem (% da largura/altura)
interface MusclePosition {
    top: string;
    left: string;
    label: string;
}

const MUSCLE_POSITIONS: Record<string, MusclePosition> = {
    // Vista FRONTAL (lado esquerdo da imagem - 0% a 50%)
    shoulders: { top: '20%', left: '25%', label: 'Ombros' },
    chest: { top: '28%', left: '25%', label: 'Peito' },
    biceps: { top: '35%', left: '17%', label: 'Bíceps' },
    core: { top: '42%', left: '25%', label: 'Abdômen' },
    forearms: { top: '50%', left: '13%', label: 'Antebraços' },
    quadriceps: { top: '63%', left: '24%', label: 'Quadríceps' },
    calves: { top: '85%', left: '24%', label: 'Panturrilhas' },

    // Vista POSTERIOR (lado direito da imagem - 50% a 100%)
    back: { top: '27%', left: '75%', label: 'Costas' },
    triceps: { top: '35%', left: '83%', label: 'Tríceps' },
    glutes: { top: '52%', left: '75%', label: 'Glúteos' },
    hamstrings: { top: '68%', left: '75%', label: 'Posteriores' },
};

// Mapeamento de cores por intensidade
const getStatusColor = (intensity: number): string => {
    if (intensity === 0) return '#4B5563'; // Gray (não trabalhado)
    if (intensity < 0.3) return '#10B981'; // Verde (Enfraquecido)
    if (intensity < 0.6) return '#3B82F6'; // Azul (Recuperado)
    if (intensity < 0.8) return '#F59E0B'; // Laranja (Em recuperação)
    return '#EF4444'; // Vermelho (Fadigado)
};

const getStatusLabel = (intensity: number): string => {
    if (intensity === 0) return 'Não Trabalhado';
    if (intensity < 0.3) return 'Enfraquecido';
    if (intensity < 0.6) return 'Recuperado';
    if (intensity < 0.8) return 'Em Recuperação';
    return 'Fadigado';
};

export function MuscleHeatmap({ data, className = '' }: MuscleHeatmapProps) {
    const muscleIntensities = useMemo(() => {
        if (!data || data.length === 0) return {};

        const maxVolume = Math.max(...data.map(d => d.volume), 1);
        const intensities: Record<string, number> = {};

        data.forEach(d => {
            let normalized = d.muscle.toLowerCase();

            // Mapeamentos
            if (normalized.includes('peito')) normalized = 'chest';
            else if (normalized.includes('costas')) normalized = 'back';
            else if (normalized.includes('ombro')) normalized = 'shoulders';
            else if (normalized.includes('bíceps') || normalized.includes('biceps')) normalized = 'biceps';
            else if (normalized.includes('tríceps') || normalized.includes('triceps')) normalized = 'triceps';
            else if (normalized.includes('perna') || normalized.includes('agachamento') || normalized.includes('leg')) normalized = 'quadriceps';
            else if (normalized.includes('quadríceps')) normalized = 'quadriceps';
            else if (normalized.includes('posterior') || normalized.includes('flexora')) normalized = 'hamstrings';
            else if (normalized.includes('glúteo')) normalized = 'glutes';
            else if (normalized.includes('panturrilha')) normalized = 'calves';
            else if (normalized.includes('abd') || normalized.includes('core')) normalized = 'core';
            else if (normalized.includes('antebraço')) normalized = 'forearms';

            const current = intensities[normalized] || 0;
            intensities[normalized] = Math.min((current + (d.volume / maxVolume)), 1);
        });

        return intensities;
    }, [data]);

    const hasData = Object.keys(muscleIntensities).length > 0;
    const workedMuscles = Object.entries(muscleIntensities).filter(([_, intensity]) => intensity > 0);

    return (
        <div className={`w-full ${className}`}>
            {/* Container com overlays de status */}
            <div className="relative w-full max-w-2xl mx-auto">
                {/* Imagem 3D Realista */}
                <div className="relative w-full h-auto">
                    <Image
                        src="/images/muscle-anatomy-3d.png"
                        alt="Anatomia Muscular 3D - Vista Frontal e Posterior"
                        width={800}
                        height={600}
                        className="w-full h-auto object-contain"
                        priority
                    />

                    {/* Indicadores de Status Muscular - TODOS OS MÚSCULOS */}
                    {Object.entries(MUSCLE_POSITIONS).map(([muscle, position]) => {
                        const intensity = muscleIntensities[muscle] || 0;
                        const color = getStatusColor(intensity);
                        const statusLabel = getStatusLabel(intensity);
                        const isWorked = intensity > 0;

                        return (
                            <div
                                key={muscle}
                                className="absolute group"
                                style={{
                                    top: position.top,
                                    left: position.left,
                                    transform: 'translate(-50%, -50%)',
                                }}
                            >
                                {/* Pulso animado (apenas para músculos trabalhados) */}
                                {isWorked && (
                                    <div
                                        className="absolute inset-0 rounded-full animate-ping opacity-30"
                                        style={{
                                            backgroundColor: color,
                                            width: '24px',
                                            height: '24px',
                                            left: '-4px',
                                            top: '-4px'
                                        }}
                                    />
                                )}

                                {/* Indicador principal */}
                                <div
                                    className={`relative w-4 h-4 rounded-full border-2 shadow-lg cursor-pointer transition-all duration-300 group-hover:scale-125 group-hover:shadow-xl ${isWorked ? 'border-white' : 'border-gray-600'
                                        }`}
                                    style={{
                                        backgroundColor: color,
                                        opacity: isWorked ? 1 : 0.5
                                    }}
                                />

                                {/* Tooltip no hover */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900/95 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10 border border-white/10">
                                    <div className="text-center">
                                        <div className="font-bold">{position.label}</div>
                                        <div className="text-[10px] text-gray-300">{statusLabel}</div>
                                        {isWorked && (
                                            <div className="text-[10px] text-gray-400">
                                                Vol: {Math.round(intensity * 100)}%
                                            </div>
                                        )}
                                    </div>
                                    {/* Seta do tooltip */}
                                    <div
                                        className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900/95"
                                        style={{ marginTop: '-1px' }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Mensagem quando não há dados */}
                {!hasData && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl">
                        <p className="text-gray-300 font-medium text-sm px-6 py-3 bg-gray-800/80 rounded-xl border border-white/10">
                            Complete treinos para ver seu mapa muscular!
                        </p>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: '#10B981' }} />
                    <span className="text-xs text-gray-400">Enfraquecido</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: '#3B82F6' }} />
                    <span className="text-xs text-gray-400">Recuperado</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: '#F59E0B' }} />
                    <span className="text-xs text-gray-400">Em Recuperação</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: '#EF4444' }} />
                    <span className="text-xs text-gray-400">Fadigado</span>
                </div>
            </div>

            {/* Estatísticas e Lista de Músculos Trabalhados */}
            {hasData && (
                <div className="mt-4">
                    <p className="text-xs text-gray-500 text-center mb-3">
                        {workedMuscles.length} grupo(s) muscular(es) trabalhado(s) esta semana
                    </p>

                    {/* Lista de músculos trabalhados */}
                    <div className="flex flex-wrap justify-center gap-2">
                        {workedMuscles
                            .sort((a, b) => b[1] - a[1]) // Ordenar por intensidade (maior primeiro)
                            .map(([muscle, intensity]) => {
                                const position = MUSCLE_POSITIONS[muscle];
                                const color = getStatusColor(intensity);

                                return (
                                    <div
                                        key={muscle}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                                    >
                                        <div
                                            className="w-2 h-2 rounded-full border border-white/50"
                                            style={{ backgroundColor: color }}
                                        />
                                        <span className="text-xs text-gray-300 font-medium">
                                            {position?.label || muscle}
                                        </span>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}
        </div>
    );
}
