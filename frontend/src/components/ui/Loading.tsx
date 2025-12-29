'use client';

import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
    const sizeMap = {
        sm: 'width: 16px; height: 16px;',
        md: 'width: 24px; height: 24px;',
        lg: 'width: 40px; height: 40px;',
    };

    return (
        <div
            className={`spinner ${className}`}
            style={{ width: size === 'sm' ? 16 : size === 'lg' ? 40 : 24, height: size === 'sm' ? 16 : size === 'lg' ? 40 : 24 }}
        />
    );
}

interface LoadingScreenProps {
    message?: string;
}

export function LoadingScreen({ message = 'Carregando...' }: LoadingScreenProps) {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
            <LoadingSpinner size="lg" />
            <p className="text-secondary">{message}</p>
        </div>
    );
}

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    className?: string;
}

export function Skeleton({ width = '100%', height = 20, className = '' }: SkeletonProps) {
    return (
        <div
            className={`skeleton ${className}`}
            style={{ width, height }}
        />
    );
}

export function CardSkeleton() {
    return (
        <div className="card">
            <div className="flex gap-3 mb-4">
                <Skeleton width={48} height={48} className="rounded-md" />
                <div className="flex-1">
                    <Skeleton height={20} className="mb-2" />
                    <Skeleton width="60%" height={14} />
                </div>
            </div>
            <Skeleton height={40} />
        </div>
    );
}

export function WorkoutCardSkeleton() {
    return (
        <div className="workout-card">
            <div className="workout-card-header">
                <div className="flex-1">
                    <Skeleton height={24} className="mb-2" width="70%" />
                    <Skeleton height={16} width="40%" />
                </div>
                <Skeleton width={48} height={48} className="rounded-full" />
            </div>
            <div className="flex gap-2 mb-4">
                <Skeleton width={80} height={28} className="rounded-full" />
                <Skeleton width={60} height={28} className="rounded-full" />
            </div>
            <Skeleton height={52} className="rounded-md" />
        </div>
    );
}
