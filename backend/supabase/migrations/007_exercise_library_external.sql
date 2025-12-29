-- ============================================
-- YOUMOVE - Exercise Library for ExerciseDB Integration
-- Migration: 007_exercise_library_external
-- Date: 2024-12-22
-- Purpose: Store cached exercises from ExerciseDB API
-- ============================================

-- Tabela para exercícios importados do ExerciseDB
CREATE TABLE IF NOT EXISTS exercise_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id TEXT UNIQUE NOT NULL,  -- ID original do ExerciseDB
    name TEXT NOT NULL,
    name_pt TEXT,  -- Nome traduzido para português
    body_part TEXT NOT NULL,  -- 'back', 'cardio', 'chest', 'lower arms', etc.
    target_muscle TEXT NOT NULL,  -- 'lats', 'cardiovascular system', 'pectorals', etc.
    secondary_muscles TEXT[] DEFAULT ARRAY[]::TEXT[],
    equipment TEXT NOT NULL,  -- 'cable', 'barbell', 'body weight', etc.
    gif_url TEXT NOT NULL,  -- URL do GIF animado
    instructions TEXT[] DEFAULT ARRAY[]::TEXT[],  -- Array de instruções passo a passo
    difficulty TEXT DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    
    -- Metadata
    cached_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Índices para busca eficiente
CREATE INDEX IF NOT EXISTS idx_exercise_library_body_part ON exercise_library(body_part);
CREATE INDEX IF NOT EXISTS idx_exercise_library_target ON exercise_library(target_muscle);
CREATE INDEX IF NOT EXISTS idx_exercise_library_equipment ON exercise_library(equipment);
CREATE INDEX IF NOT EXISTS idx_exercise_library_name ON exercise_library USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_exercise_library_external_id ON exercise_library(external_id);

-- RLS: Exercícios são públicos para leitura
ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read exercise library"
    ON exercise_library FOR SELECT
    USING (true);

-- Apenas admins podem modificar (via service role)
CREATE POLICY "Service role can manage exercise library"
    ON exercise_library FOR ALL
    USING (auth.role() = 'service_role');

-- Trigger para atualizar updated_at
CREATE TRIGGER update_exercise_library_updated_at
    BEFORE UPDATE ON exercise_library
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Tabela para sessões de treino em execução
-- (Complementa a tabela workout_sessions existente)
-- ============================================

-- Adicionar coluna gif_url à tabela exercises existente se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exercises' AND column_name = 'gif_url'
    ) THEN
        ALTER TABLE exercises ADD COLUMN gif_url TEXT;
    END IF;
END $$;

-- Tabela para log de dicas da IA durante execução
CREATE TABLE IF NOT EXISTS workout_ai_tips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL, -- Referência à sessão ativa
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    tip_text TEXT NOT NULL,
    tip_type TEXT DEFAULT 'technique' CHECK (tip_type IN ('technique', 'motivation', 'rest', 'safety', 'progress')),
    shown_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Feedback do usuário
    was_helpful BOOLEAN,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_ai_tips_session ON workout_ai_tips(session_id);
CREATE INDEX IF NOT EXISTS idx_workout_ai_tips_user ON workout_ai_tips(user_id);

-- RLS para tips
ALTER TABLE workout_ai_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tips"
    ON workout_ai_tips FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tips"
    ON workout_ai_tips FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tips"
    ON workout_ai_tips FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- Tabela para cache offline de exercícios do treino
-- ============================================

CREATE TABLE IF NOT EXISTS workout_exercise_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_data JSONB NOT NULL,  -- Dados do exercício em cache
    gif_cached BOOLEAN DEFAULT FALSE,  -- Se o GIF foi baixado para PWA
    cached_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_workout_exercise_cache_workout ON workout_exercise_cache(workout_id);

-- RLS
ALTER TABLE workout_exercise_cache ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver cache de seus próprios treinos
CREATE POLICY "Users can view their workout cache"
    ON workout_exercise_cache FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM workouts 
            WHERE workouts.id = workout_exercise_cache.workout_id 
            AND workouts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their workout cache"
    ON workout_exercise_cache FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM workouts 
            WHERE workouts.id = workout_exercise_cache.workout_id 
            AND workouts.user_id = auth.uid()
        )
    );
