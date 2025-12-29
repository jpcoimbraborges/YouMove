-- ============================================
-- YOUMOVE - Initial Database Schema
-- Migration: 001_initial_schema
-- Date: 2024-12-20
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================
-- CUSTOM TYPES / ENUMS
-- ============================================

-- Gender options
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'prefer_not_say');

-- Fitness levels
CREATE TYPE fitness_level_type AS ENUM ('beginner', 'intermediate', 'advanced', 'elite');

-- User goals
CREATE TYPE goal_type AS ENUM (
    'lose_weight',
    'build_muscle',
    'improve_endurance',
    'increase_strength',
    'general_fitness',
    'flexibility',
    'sport_specific'
);

-- Subscription tiers
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'elite');

-- Muscle groups
CREATE TYPE muscle_group AS ENUM (
    'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
    'core', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'hip_flexors', 'full_body'
);

-- Movement types
CREATE TYPE movement_type AS ENUM ('compound', 'isolation');

-- Workout types
CREATE TYPE workout_type AS ENUM (
    'strength', 'hypertrophy', 'endurance', 'hiit', 'cardio',
    'flexibility', 'sport_specific', 'rehabilitation', 'custom'
);

-- Workout status
CREATE TYPE workout_status AS ENUM ('scheduled', 'in_progress', 'completed', 'skipped', 'partial');

-- Set types
CREATE TYPE set_type AS ENUM ('warmup', 'working', 'dropset', 'failure', 'rest_pause');

-- Session status
CREATE TYPE session_status AS ENUM ('active', 'paused', 'completed', 'abandoned');

-- Recommendation categories
CREATE TYPE recommendation_category AS ENUM (
    'workout_adjustment', 'exercise_swap', 'volume_change', 'rest_day',
    'deload_week', 'progressive_overload', 'new_exercise', 'technique_focus',
    'recovery', 'nutrition'
);

-- Recommendation status
CREATE TYPE recommendation_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');

-- Alert types
CREATE TYPE alert_type AS ENUM (
    'injury_risk', 'overtraining', 'undertraining', 'muscle_imbalance',
    'plateau_detected', 'goal_progress', 'streak_milestone', 'personal_record',
    'recovery_needed', 'form_reminder', 'hydration_reminder', 'nutrition_tip'
);

-- Alert severity
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical', 'celebration');

-- User roles
CREATE TYPE user_role AS ENUM ('user', 'trainer', 'admin');

-- ============================================
-- TABLE: profiles
-- Extended user profile linked to auth.users
-- ============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    
    -- Physical Data
    birth_date DATE,
    gender gender_type,
    height_cm DECIMAL(5,2) CHECK (height_cm >= 100 AND height_cm <= 250),
    weight_kg DECIMAL(5,2) CHECK (weight_kg >= 30 AND weight_kg <= 300),
    
    -- Fitness Profile
    fitness_level fitness_level_type DEFAULT 'beginner',
    primary_goal goal_type,
    
    -- Preferences
    preferred_workout_duration INTEGER DEFAULT 45 CHECK (preferred_workout_duration >= 15 AND preferred_workout_duration <= 180),
    preferred_workout_days INTEGER[] DEFAULT ARRAY[1, 3, 5], -- 0=Sun, 6=Sat
    equipment_available TEXT[] DEFAULT ARRAY[]::TEXT[],
    injuries_or_limitations TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Settings
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    unit_system TEXT DEFAULT 'metric' CHECK (unit_system IN ('metric', 'imperial')),
    language TEXT DEFAULT 'pt-BR',
    push_notifications_enabled BOOLEAN DEFAULT TRUE,
    workout_reminders BOOLEAN DEFAULT TRUE,
    reminder_time TIME DEFAULT '08:00',
    
    -- AI Preferences
    ai_coach_personality TEXT DEFAULT 'motivational' CHECK (ai_coach_personality IN ('motivational', 'strict', 'friendly', 'analytical')),
    ai_suggestions_enabled BOOLEAN DEFAULT TRUE,
    
    -- Role & Status
    role user_role DEFAULT 'user',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: subscriptions
-- User subscription management
-- ============================================
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Subscription Details
    tier subscription_tier DEFAULT 'free',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
    
    -- Dates
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    
    -- Payment (prepared for integration)
    payment_provider TEXT, -- 'stripe', 'apple', 'google'
    payment_provider_id TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- ============================================
-- TABLE: exercises
-- Exercise library (shared, admin-managed)
-- ============================================
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Info
    name TEXT NOT NULL,
    name_pt TEXT, -- Portuguese translation
    description TEXT,
    
    -- Classification
    primary_muscle muscle_group NOT NULL,
    secondary_muscles muscle_group[] DEFAULT ARRAY[]::muscle_group[],
    movement_type movement_type NOT NULL,
    equipment_required TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Difficulty & Metrics
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 10),
    calories_per_minute DECIMAL(5,2),
    
    -- Media
    video_url TEXT,
    thumbnail_url TEXT,
    instructions TEXT[] DEFAULT ARRAY[]::TEXT[],
    tips TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Search
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Admin
    created_by UUID REFERENCES profiles(id),
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: workouts (Workout Plans)
-- User workout plans
-- ============================================
CREATE TABLE workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Basic Info
    name TEXT NOT NULL,
    description TEXT,
    
    -- Classification
    workout_type workout_type NOT NULL,
    difficulty fitness_level_type DEFAULT 'intermediate',
    target_muscles muscle_group[] DEFAULT ARRAY[]::muscle_group[],
    
    -- Structure
    duration_weeks INTEGER DEFAULT 1 CHECK (duration_weeks >= 1 AND duration_weeks <= 52),
    days_per_week INTEGER DEFAULT 3 CHECK (days_per_week >= 1 AND days_per_week <= 7),
    avg_duration_minutes INTEGER DEFAULT 45 CHECK (avg_duration_minutes >= 15 AND avg_duration_minutes <= 180),
    
    -- Exercises (JSONB for flexibility)
    exercises JSONB DEFAULT '[]'::JSONB,
    /*
    Structure:
    [
        {
            "exercise_id": "uuid",
            "order": 1,
            "sets": [
                {
                    "set_number": 1,
                    "set_type": "working",
                    "target_reps": 12,
                    "target_weight_kg": 40,
                    "target_rpe": 7,
                    "rest_seconds": 60
                }
            ],
            "superset_group": null,
            "notes": ""
        }
    ]
    */
    
    -- AI Generated
    is_ai_generated BOOLEAN DEFAULT FALSE,
    ai_generation_prompt TEXT,
    
    -- Status & Visibility
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT FALSE,
    is_template BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: workout_sessions
-- Scheduled workouts (daily instances)
-- ============================================
CREATE TABLE workout_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    workout_id UUID REFERENCES workouts(id) ON DELETE SET NULL,
    
    -- Schedule
    scheduled_date DATE NOT NULL,
    day_number INTEGER DEFAULT 1,
    week_number INTEGER DEFAULT 1,
    
    -- Details
    name TEXT NOT NULL,
    focus muscle_group[] DEFAULT ARRAY[]::muscle_group[],
    estimated_duration_minutes INTEGER DEFAULT 45,
    
    -- Exercises snapshot (copied from workout at creation)
    exercises JSONB DEFAULT '[]'::JSONB,
    
    -- Execution
    status workout_status DEFAULT 'scheduled',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    actual_duration_minutes INTEGER,
    
    -- Calculated Metrics
    total_volume_kg DECIMAL(10,2) DEFAULT 0,
    total_sets_completed INTEGER DEFAULT 0,
    total_reps_completed INTEGER DEFAULT 0,
    avg_rpe DECIMAL(3,1),
    calories_burned INTEGER,
    
    -- User Feedback
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    user_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: workout_logs
-- Detailed exercise logs per session
-- ============================================
CREATE TABLE workout_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
    
    -- Order
    exercise_order INTEGER NOT NULL,
    
    -- Sets (JSONB for flexibility)
    sets JSONB NOT NULL DEFAULT '[]'::JSONB,
    /*
    Structure:
    [
        {
            "set_number": 1,
            "set_type": "working",
            "target_reps": 12,
            "target_weight_kg": 40,
            "target_rpe": 7,
            "actual_reps": 12,
            "actual_weight_kg": 40,
            "actual_rpe": 7,
            "completed": true,
            "skipped": false,
            "rest_seconds": 60,
            "notes": ""
        }
    ]
    */
    
    -- Calculated
    total_volume_kg DECIMAL(10,2) DEFAULT 0,
    total_reps INTEGER DEFAULT 0,
    max_weight_kg DECIMAL(6,2),
    avg_rpe DECIMAL(3,1),
    
    -- Notes
    notes TEXT,
    form_rating INTEGER CHECK (form_rating >= 1 AND form_rating <= 5),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: progress_metrics
-- Aggregated progress data
-- ============================================
CREATE TABLE progress_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Period
    metric_date DATE NOT NULL,
    week_number INTEGER,
    year INTEGER,
    
    -- Body Metrics
    weight_kg DECIMAL(5,2),
    body_fat_percent DECIMAL(4,1),
    
    -- Volume Metrics
    weekly_volume_kg DECIMAL(12,2) DEFAULT 0,
    volume_by_muscle JSONB DEFAULT '{}'::JSONB,
    
    -- Session Metrics
    total_workouts INTEGER DEFAULT 0,
    total_duration_minutes INTEGER DEFAULT 0,
    total_sets INTEGER DEFAULT 0,
    total_reps INTEGER DEFAULT 0,
    
    -- Intensity
    avg_rpe DECIMAL(3,1),
    max_rpe DECIMAL(3,1),
    
    -- Consistency
    planned_workouts INTEGER DEFAULT 0,
    completed_workouts INTEGER DEFAULT 0,
    consistency_score DECIMAL(5,2) DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, metric_date)
);

-- ============================================
-- TABLE: ai_recommendations
-- AI-generated recommendations and alerts
-- ============================================
CREATE TABLE ai_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Type
    category recommendation_category NOT NULL,
    alert_type alert_type,
    severity alert_severity DEFAULT 'info',
    
    -- Content
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    rationale TEXT,
    
    -- Actions (JSONB for flexibility)
    primary_action JSONB,
    secondary_action JSONB,
    /*
    Structure:
    {
        "label": "Apply",
        "type": "apply",
        "payload": { ... }
    }
    */
    
    -- AI Metadata
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    supporting_data JSONB,
    model_version TEXT,
    
    -- Status
    status recommendation_status DEFAULT 'pending',
    user_feedback TEXT,
    
    -- Timing
    expires_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    
    -- Flags
    read BOOLEAN DEFAULT FALSE,
    dismissed BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: personal_records
-- Track user personal bests
-- ============================================
CREATE TABLE personal_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    
    -- Record Type
    record_type TEXT NOT NULL CHECK (record_type IN ('max_weight', 'max_reps', 'max_volume', 'max_1rm')),
    
    -- Values
    weight_kg DECIMAL(6,2),
    reps INTEGER,
    volume_kg DECIMAL(10,2),
    estimated_1rm DECIMAL(6,2),
    
    -- Context
    session_id UUID REFERENCES workout_sessions(id) ON DELETE SET NULL,
    achieved_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Previous Record
    previous_value DECIMAL(10,2),
    improvement_percent DECIMAL(5,2),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, exercise_id, record_type)
);

-- ============================================
-- INDEXES
-- ============================================

-- Profiles
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_active ON profiles(is_active) WHERE is_active = TRUE;

-- Subscriptions
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_expires ON subscriptions(expires_at);

-- Exercises
CREATE INDEX idx_exercises_muscle ON exercises(primary_muscle);
CREATE INDEX idx_exercises_type ON exercises(movement_type);
CREATE INDEX idx_exercises_active ON exercises(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_exercises_name_trgm ON exercises USING gin(name gin_trgm_ops);
CREATE INDEX idx_exercises_tags ON exercises USING gin(tags);

-- Workouts
CREATE INDEX idx_workouts_user ON workouts(user_id);
CREATE INDEX idx_workouts_type ON workouts(workout_type);
CREATE INDEX idx_workouts_active ON workouts(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_workouts_public ON workouts(is_public) WHERE is_public = TRUE;

-- Workout Sessions
CREATE INDEX idx_sessions_user ON workout_sessions(user_id);
CREATE INDEX idx_sessions_workout ON workout_sessions(workout_id);
CREATE INDEX idx_sessions_date ON workout_sessions(scheduled_date);
CREATE INDEX idx_sessions_status ON workout_sessions(status);
CREATE INDEX idx_sessions_user_date ON workout_sessions(user_id, scheduled_date);

-- Workout Logs
CREATE INDEX idx_logs_user ON workout_logs(user_id);
CREATE INDEX idx_logs_session ON workout_logs(session_id);
CREATE INDEX idx_logs_exercise ON workout_logs(exercise_id);

-- Progress Metrics
CREATE INDEX idx_progress_user ON progress_metrics(user_id);
CREATE INDEX idx_progress_date ON progress_metrics(metric_date);
CREATE INDEX idx_progress_user_date ON progress_metrics(user_id, metric_date);

-- AI Recommendations
CREATE INDEX idx_recommendations_user ON ai_recommendations(user_id);
CREATE INDEX idx_recommendations_status ON ai_recommendations(status);
CREATE INDEX idx_recommendations_category ON ai_recommendations(category);
CREATE INDEX idx_recommendations_unread ON ai_recommendations(user_id, read) WHERE read = FALSE;

-- Personal Records
CREATE INDEX idx_records_user ON personal_records(user_id);
CREATE INDEX idx_records_exercise ON personal_records(exercise_id);
CREATE INDEX idx_records_user_exercise ON personal_records(user_id, exercise_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Calculate workout volume
CREATE OR REPLACE FUNCTION calculate_session_volume(p_session_id UUID)
RETURNS TABLE(total_volume DECIMAL, total_sets INTEGER, total_reps INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(wl.total_volume_kg), 0)::DECIMAL,
        COALESCE(COUNT(*)::INTEGER, 0),
        COALESCE(SUM(wl.total_reps), 0)::INTEGER
    FROM workout_logs wl
    WHERE wl.session_id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at
    BEFORE UPDATE ON exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workouts_updated_at
    BEFORE UPDATE ON workouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON workout_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_logs_updated_at
    BEFORE UPDATE ON workout_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_updated_at
    BEFORE UPDATE ON progress_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recommendations_updated_at
    BEFORE UPDATE ON ai_recommendations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    
    -- Create free subscription
    INSERT INTO subscriptions (user_id, tier, status)
    VALUES (NEW.id, 'free', 'active');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
