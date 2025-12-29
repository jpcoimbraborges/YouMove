-- ============================================
-- YOUMOVE - Fix RLS Policies
-- Migration: 010_fix_rls
-- Purpose: Ensure all tables have proper Row Level Security policies
-- ============================================

-- 1. Workout Logs (Crucial for Sync)
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own logs" ON workout_logs;
CREATE POLICY "Users can view own logs" ON workout_logs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own logs" ON workout_logs;
CREATE POLICY "Users can insert own logs" ON workout_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own logs" ON workout_logs;
CREATE POLICY "Users can update own logs" ON workout_logs FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own logs" ON workout_logs;
CREATE POLICY "Users can delete own logs" ON workout_logs FOR DELETE USING (auth.uid() = user_id);

-- 2. Workouts
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own workouts" ON workouts;
CREATE POLICY "Users can view own workouts" ON workouts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own workouts" ON workouts;
CREATE POLICY "Users can insert own workouts" ON workouts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own workouts" ON workouts;
CREATE POLICY "Users can update own workouts" ON workouts FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own workouts" ON workouts;
CREATE POLICY "Users can delete own workouts" ON workouts FOR DELETE USING (auth.uid() = user_id);

-- 3. Progress Metrics
ALTER TABLE progress_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own metrics" ON progress_metrics;
CREATE POLICY "Users can view own metrics" ON progress_metrics FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own metrics" ON progress_metrics;
CREATE POLICY "Users can insert own metrics" ON progress_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own metrics" ON progress_metrics;
CREATE POLICY "Users can update own metrics" ON progress_metrics FOR UPDATE USING (auth.uid() = user_id);

-- 4. Personal Records
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own records" ON personal_records;
CREATE POLICY "Users can view own records" ON personal_records FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own records" ON personal_records;
CREATE POLICY "Users can insert own records" ON personal_records FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own records" ON personal_records;
CREATE POLICY "Users can update own records" ON personal_records FOR UPDATE USING (auth.uid() = user_id);

-- 5. AI Recommendations
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own recommendations" ON ai_recommendations;
CREATE POLICY "Users can view own recommendations" ON ai_recommendations FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own recommendations" ON ai_recommendations;
CREATE POLICY "Users can update own recommendations" ON ai_recommendations FOR UPDATE USING (auth.uid() = user_id);
