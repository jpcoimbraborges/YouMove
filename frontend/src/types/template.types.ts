/**
 * YOUMOVE - Workout Template Types
 * TypeScript interfaces for workout templates
 */

export interface TemplateExercise {
    name: string;
    sets: number;
    reps: string;
    rest_seconds: number;
    notes?: string;
}

export interface WorkoutTemplate {
    id: string;
    name: string;
    slug: string;
    description: string | null;

    // Classification
    category: 'strength' | 'hypertrophy' | 'endurance' | 'weight_loss' | 'functional' | 'flexibility';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    target_muscles: string[];

    // Structure
    duration_minutes: number;
    exercises: TemplateExercise[];

    // Metadata
    equipment_needed: string[];
    tags: string[];
    image_url: string | null;

    // Stats
    uses_count: number;
    favorites_count: number;
    rating_avg: number;

    // System
    is_featured: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface TemplateFilters {
    searchQuery?: string;
    category?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    maxDuration?: number;
    targetMuscle?: string;
    equipment?: string;
    featured?: boolean;
}

// Category display info
export const TEMPLATE_CATEGORIES = {
    strength: { label: 'Força', icon: '💪', color: 'red' },
    hypertrophy: { label: 'Hipertrofia', icon: '🏋️', color: 'purple' },
    endurance: { label: 'Resistência', icon: '🏃', color: 'blue' },
    weight_loss: { label: 'Emagrecimento', icon: '🔥', color: 'orange' },
    functional: { label: 'Funcional', icon: '⚡', color: 'yellow' },
    flexibility: { label: 'Flexibilidade', icon: '🧘', color: 'green' }
} as const;

// Difficulty display info
export const DIFFICULTY_LEVELS = {
    beginner: { label: 'Iniciante', color: 'green' },
    intermediate: { label: 'Intermediário', color: 'yellow' },
    advanced: { label: 'Avançado', color: 'red' }
} as const;
