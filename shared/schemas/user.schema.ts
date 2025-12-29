/**
 * YOUMOVE - User Schema Definitions
 * Shared between frontend and backend
 */

import { z } from 'zod';

// ============================================
// User Profile Schema
// ============================================
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().min(2).max(100),
  avatar_url: z.string().url().nullable(),
  
  // Physical Data
  birth_date: z.string().datetime().nullable(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_say']).nullable(),
  height_cm: z.number().min(100).max(250).nullable(),
  weight_kg: z.number().min(30).max(300).nullable(),
  
  // Fitness Goals
  fitness_level: z.enum(['beginner', 'intermediate', 'advanced', 'elite']).default('beginner'),
  primary_goal: z.enum([
    'lose_weight',
    'build_muscle',
    'improve_endurance',
    'increase_strength',
    'general_fitness',
    'flexibility',
    'sport_specific'
  ]).nullable(),
  
  // Preferences
  preferred_workout_duration: z.number().min(15).max(180).default(45), // minutes
  preferred_workout_days: z.array(z.number().min(0).max(6)).default([1, 3, 5]), // 0=Sun, 6=Sat
  equipment_available: z.array(z.string()).default([]),
  injuries_or_limitations: z.array(z.string()).default([]),
  
  // Subscription
  subscription_tier: z.enum(['free', 'pro', 'elite']).default('free'),
  subscription_expires_at: z.string().datetime().nullable(),
  
  // Metadata
  onboarding_completed: z.boolean().default(false),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// ============================================
// User Preferences Schema
// ============================================
export const UserPreferencesSchema = z.object({
  user_id: z.string().uuid(),
  
  // Notifications
  push_notifications_enabled: z.boolean().default(true),
  workout_reminders: z.boolean().default(true),
  reminder_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default('08:00'),
  weekly_summary_enabled: z.boolean().default(true),
  
  // AI Coach
  ai_coach_personality: z.enum(['motivational', 'strict', 'friendly', 'analytical']).default('motivational'),
  ai_suggestions_enabled: z.boolean().default(true),
  
  // Display
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  unit_system: z.enum(['metric', 'imperial']).default('metric'),
  language: z.string().default('pt-BR'),
  
  // Privacy
  profile_public: z.boolean().default(false),
  share_workouts: z.boolean().default(false),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

// ============================================
// Create/Update DTOs
// ============================================
export const CreateUserProfileDTO = UserProfileSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).partial().required({ email: true, full_name: true });

export const UpdateUserProfileDTO = UserProfileSchema.omit({
  id: true,
  email: true,
  created_at: true,
  updated_at: true,
}).partial();

export type CreateUserProfileInput = z.infer<typeof CreateUserProfileDTO>;
export type UpdateUserProfileInput = z.infer<typeof UpdateUserProfileDTO>;
