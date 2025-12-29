-- Tabela para registrar sessões de treino completadas
CREATE TABLE IF NOT EXISTS workout_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    workout_id UUID REFERENCES workouts(id) ON DELETE SET NULL,
    workout_name TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    duration_seconds INTEGER NOT NULL,
    total_sets INTEGER DEFAULT 0,
    total_reps INTEGER DEFAULT 0,
    total_volume DECIMAL(10,2) DEFAULT 0, -- peso total levantado (kg)
    exercises_log JSONB DEFAULT '[]'::JSONB, -- log detalhado por exercício
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- avaliação do treino
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para buscar sessões por usuário
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_completed_at ON workout_sessions(completed_at DESC);

-- RLS Policy
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
    ON workout_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
    ON workout_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
    ON workout_sessions FOR UPDATE
    USING (auth.uid() = user_id);
