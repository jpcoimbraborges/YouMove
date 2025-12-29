'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Dumbbell } from 'lucide-react';
import { getCachedExerciseImage } from '@/lib/wger';

interface ExerciseImageProps {
    exerciseName: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showFallback?: boolean;
}

const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
};

export function ExerciseImage({
    exerciseName,
    className = '',
    size = 'md',
    showFallback = true
}: ExerciseImageProps) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let mounted = true;

        const loadImage = async () => {
            setLoading(true);
            setError(false);

            try {
                const url = await getCachedExerciseImage(exerciseName);

                if (mounted) {
                    setImageUrl(url);
                    setLoading(false);
                }
            } catch (err) {
                console.error(`Error loading image for "${exerciseName}":`, err);
                if (mounted) {
                    setError(true);
                    setLoading(false);
                }
            }
        };

        loadImage();

        return () => {
            mounted = false;
        };
    }, [exerciseName]);

    const containerClass = `${sizeClasses[size]} ${className} rounded-xl overflow-hidden relative flex items-center justify-center border border-zinc-800/50`;

    // Loading state with improved animation
    if (loading) {
        return (
            <div className={containerClass} style={{ background: '#1F2937' }}>
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent animate-pulse" />
            </div>
        );
    }

    // Error state or no image found - show fallback
    if (error || !imageUrl) {
        if (!showFallback) return null;

        return (
            <div
                className={containerClass}
                style={{
                    background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                }}
            >
                <FallbackIcon name={exerciseName} size={size} />
            </div>
        );
    }

    // Success - render image with improved styling
    return (
        <div
            className={containerClass}
            style={{
                background: '#FFFFFF', // Fundo branco para garantir contraste com desenhos pretos
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.1)'
            }}
        >
            <Image
                src={imageUrl}
                alt={exerciseName}
                fill
                className="object-contain p-2" // Contain e padding para não cortar
                onError={() => setError(true)}
                unoptimized={imageUrl.startsWith('http')} // External images
                sizes="(max-width: 768px) 100vw, 50vw"
            />
        </div>
    );
}

import {
    Footprints,
    Zap,
    Bike,
    Waves,
    Flame,
    Activity,
    User,
    ArrowDown
} from 'lucide-react';

function FallbackIcon({ name, size }: { name: string, size: string }) {
    const iconSize = size === 'sm' ? 24 : size === 'md' ? 32 : size === 'lg' ? 40 : 48;
    const lowerName = name.toLowerCase();

    // Cardio
    if (lowerName.includes('corrida') || lowerName.includes('esteira') || lowerName.includes('running'))
        return <Zap size={iconSize} className="text-orange-500/40" />;

    if (lowerName.includes('caminhada') || lowerName.includes('walking'))
        return <Footprints size={iconSize} className="text-emerald-500/40" />;

    if (lowerName.includes('bike') || lowerName.includes('bicicleta') || lowerName.includes('cycling'))
        return <Bike size={iconSize} className="text-blue-500/40" />;

    if (lowerName.includes('natação') || lowerName.includes('swimming'))
        return <Waves size={iconSize} className="text-cyan-500/40" />;

    if (lowerName.includes('hiit') || lowerName.includes('cardio'))
        return <Flame size={iconSize} className="text-red-500/40" />;

    // Yoga / Stretching
    if (lowerName.includes('yoga') || lowerName.includes('alongamento'))
        return <Activity size={iconSize} className="text-purple-500/40" />;

    // Bodyweight / Calisthenics
    if (lowerName.includes('flexão') || lowerName.includes('push-up'))
        return <User size={iconSize} className="text-pink-500/40" />;

    if (lowerName.includes('agachamento') || lowerName.includes('squat'))
        return <ArrowDown size={iconSize} className="text-orange-500/40" />;

    // Default Strength
    return <Dumbbell size={iconSize} className="text-blue-500/40" />;
}
