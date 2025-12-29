'use client';

/**
 * YOUMOVE - Muscle Heatmap Component
 * 
 * Visualização de Frequência/Volume de Treino por Grupo Muscular.
 * A intensidade do brilho e a cor indicam o volume relativo de treino.
 */

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Info, BarChart3 } from 'lucide-react';

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
    // Vista FRONTAL
    shoulders: { top: '20%', left: '25%', label: 'Ombros' },
    chest: { top: '28%', left: '25%', label: 'Peito' },
    biceps: { top: '35%', left: '17%', label: 'Bíceps' },
    core: { top: '42%', left: '25%', label: 'Abdômen' },
    forearms: { top: '50%', left: '13%', label: 'Antebraços' },
    quadriceps: { top: '63%', left: '24%', label: 'Quadríceps' },
    calves: { top: '85%', left: '24%', label: 'Panturrilhas' },

    // Vista POSTERIOR
    back: { top: '27%', left: '75%', label: 'Costas' },
    triceps: { top: '35%', left: '83%', label: 'Tríceps' },
    glutes: { top: '52%', left: '75%', label: 'Glúteos' },
    hamstrings: { top: '68%', left: '75%', label: 'Posteriores' },
};

// Mapeamento de cores por intensidade (Volume)
const getVolumeColor = (intensity: number): string => {
    if (intensity === 0) return '#4B5563'; // Gray
    if (intensity < 0.3) return '#3B82F6'; // Blue (Low)
    if (intensity < 0.6) return '#10B981'; // Emerald (Medium)
    if (intensity < 0.8) return '#F59E0B'; // Orange (High)
    return '#EF4444'; // Red (Extreme)
};

const getVolumeLabel = (intensity: number): string => {
    if (intensity === 0) return 'Sem Treino';
    if (intensity < 0.3) return 'Volume Baixo';
    if (intensity < 0.6) return 'Volume Médio';
    if (intensity < 0.8) return 'Volume Alto';
    return 'Volume Intenso';
};

export function MuscleHeatmap({ data, className = '' }: MuscleHeatmapProps) {
    const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);

    const muscleIntensities = useMemo(() => {
        if (!data || data.length === 0) return {};

        const maxVolume = Math.max(...data.map(d => d.volume), 1);
        const intensities: Record<string, number> = {};

        data.forEach(d => {
            let normalized = d.muscle.toLowerCase();
            // Mapeamentos normalizados
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
        <div className={`w-full flex flex-col items-center ${className}`}>

            {/* Legend / Header Info */}
            <div className="w-full flex justify-between items-center mb-4 px-2">
                <div className="flex gap-4 text-[10px] uppercase font-bold tracking-wider text-gray-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Baixo</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Médio</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Alto</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Intenso</span>
                </div>
            </div>

            {/* Container Map */}
            <div className="relative w-full max-w-[500px] aspect-[4/3]">
                {/* Imagem Base */}
                <Image
                    src="/images/muscle-anatomy-3d.png"
                    alt="Mapa de Calor Muscular"
                    fill
                    className="object-contain opacity-40 grayscale"
                />

                {/* Markers */}
                {Object.entries(MUSCLE_POSITIONS).map(([muscle, position]) => {
                    const intensity = muscleIntensities[muscle] || 0;
                    const color = getVolumeColor(intensity);
                    const label = getVolumeLabel(intensity);
                    const isWorked = intensity > 0;
                    const isHovered = hoveredMuscle === muscle;

                    return (
                        <div
                            key={muscle}
                            className="absolute"
                            style={{ top: position.top, left: position.left }}
                            onMouseEnter={() => setHoveredMuscle(muscle)}
                            onMouseLeave={() => setHoveredMuscle(null)}
                        >
                            {/* Glow Effect for Worked Muscles */}
                            {isWorked && (
                                <>
                                    <div
                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl animate-pulse"
                                        style={{
                                            backgroundColor: color,
                                            width: isHovered ? '60px' : '40px',
                                            height: isHovered ? '60px' : '40px',
                                            opacity: 0.3
                                        }}
                                    />
                                    <div
                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-md transition-all duration-300"
                                        style={{
                                            backgroundColor: color,
                                            width: isHovered ? '30px' : '20px',
                                            height: isHovered ? '30px' : '20px',
                                            opacity: 0.5
                                        }}
                                    />
                                </>
                            )}

                            {/* Center Dot (Interactive Target) */}
                            <div
                                className={`
                                    relative top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                                    w-3 h-3 rounded-full border border-black/50 shadow-sm cursor-help transition-all duration-300
                                    ${isWorked ? 'scale-100' : 'scale-75 opacity-30 bg-gray-600'}
                                    ${isHovered ? 'scale-150 border-white' : ''}
                                `}
                                style={{ backgroundColor: isWorked ? color : '#374151' }}
                            />

                            {/* Tooltip */}
                            <div className={`
                                absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50
                                transition-all duration-200 origin-bottom
                                ${isHovered ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-90 invisible'}
                            `}>
                                <div className="bg-[#111318] border border-white/10 rounded-xl p-3 shadow-2xl min-w-[140px]">
                                    <h4 className="font-bold text-white text-sm mb-1">{position.label}</h4>
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-400 flex justify-between">
                                            <span>Volume:</span>
                                            <span className="font-mono text-white ml-2">
                                                {isWorked ? Math.round(intensity * 100) : 0}%
                                            </span>
                                        </p>
                                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>
                                            {label}
                                        </p>
                                    </div>
                                    {/* Arrow */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#111318]" />
                                </div>
                            </div>
                        </div>
                    );
                })}

                {!hasData && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/80 backdrop-blur rounded-2xl p-6 text-center border border-white/10 max-w-[200px]">
                            <BarChart3 className="mx-auto text-gray-500 mb-2" size={24} />
                            <p className="text-gray-400 text-xs">Sem dados de treino recente.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Summary */}
            {hasData && (
                <div className="w-full mt-4 grid grid-cols-2 gap-2">
                    {workedMuscles
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 4)
                        .map(([muscle, intensity]) => (
                            <div key={muscle} className="bg-[#111318] rounded-lg p-2 border border-white/5 flex items-center gap-3">
                                <div className="w-1 h-8 rounded-full" style={{ backgroundColor: getVolumeColor(intensity) }} />
                                <div>
                                    <span className="block text-xs text-white font-medium">{MUSCLE_POSITIONS[muscle]?.label || muscle}</span>
                                    <span className="block text-[10px] text-gray-500">{getVolumeLabel(intensity)}</span>
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}
