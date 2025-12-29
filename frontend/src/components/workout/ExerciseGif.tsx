'use client';

/**
 * YOUMOVE - Exercise GIF Display Component
 * 
 * Componente para exibir GIF animado do exercício com preload e fallback
 */

import React, { useState, useEffect, useRef } from 'react';
import { Dumbbell, AlertCircle, Loader2 } from 'lucide-react';

interface ExerciseGifProps {
    gifUrl?: string;
    exerciseName: string;
    className?: string;
    preloadNext?: string; // URL do próximo GIF para preload
}

export function ExerciseGif({ gifUrl, exerciseName, className = '', preloadNext }: ExerciseGifProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const preloadRef = useRef<HTMLImageElement | null>(null);

    useEffect(() => {
        if (!gifUrl) {
            setIsLoading(false);
            setHasError(true);
            return;
        }

        setIsLoading(true);
        setHasError(false);

        const img = new Image();
        img.src = gifUrl;

        img.onload = () => {
            setImageSrc(gifUrl);
            setIsLoading(false);
            setHasError(false);
        };

        img.onerror = () => {
            setIsLoading(false);
            setHasError(true);
        };

        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [gifUrl]);

    // Preload do próximo GIF
    useEffect(() => {
        if (preloadNext && preloadNext !== gifUrl) {
            preloadRef.current = new Image();
            preloadRef.current.src = preloadNext;
        }

        return () => {
            if (preloadRef.current) {
                preloadRef.current.src = '';
                preloadRef.current = null;
            }
        };
    }, [preloadNext, gifUrl]);

    if (isLoading) {
        return (
            <div className={`exercise-gif exercise-gif-loading ${className}`}>
                <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 size={40} className="text-primary animate-spin" />
                    <span className="text-sm text-gray-400">Carregando...</span>
                </div>
            </div>
        );
    }

    if (hasError || !imageSrc) {
        return (
            <div className={`exercise-gif exercise-gif-error ${className}`}>
                <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                        <Dumbbell size={40} className="text-primary" />
                    </div>
                    <p className="text-lg font-bold text-center line-clamp-2 px-4">{exerciseName}</p>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                        <AlertCircle size={12} />
                        Demonstração indisponível
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className={`exercise-gif ${className}`}>
            <img
                src={imageSrc}
                alt={`Demonstração: ${exerciseName}`}
                className="w-full h-full object-contain"
                loading="eager"
            />
        </div>
    );
}
