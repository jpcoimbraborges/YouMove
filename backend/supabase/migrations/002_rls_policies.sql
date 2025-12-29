-- ============================================
-- YOUMOVE - Row Level Security Policies
-- Migration: 002_rls_policies
-- Date: 2024-12-20
-- ============================================

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is trainer
CREATE OR REPLACE FUNCTION is_trainer()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('trainer', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (is_admin());

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
    ON profiles FOR UPDATE
    USING (is_admin());

-- Trainers can view assigned users (future)
CREATE POLICY "Trainers can view profiles"
    ON profiles FOR SELECT
    USING (is_trainer());

-- ============================================
-- SUBSCRIPTIONS POLICIES
-- ============================================

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Only system can modify subscriptions (via service role)
CREATE POLICY "Admins can manage subscriptions"
    ON subscriptions FOR ALL
    USING (is_admin());

-- ============================================
-- EXERCISES POLICIES
-- ============================================

-- Everyone authenticated can view public exercises
CREATE POLICY "Authenticated users can view public exercises"
    ON exercises FOR SELECT
    USING (
        auth.role() = 'authenticated' 
        AND is_active = TRUE 
        AND is_public = TRUE
    );

-- Users can view their own custom exercises
CREATE POLICY "Users can view own exercises"
    ON exercises FOR SELECT
    USING (auth.uid() = created_by);

-- Users can create exercises
CREATE POLICY "Users can create exercises"
    ON exercises FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Users can update their own exercises
CREATE POLICY "Users can update own exercises"
    ON exercises FOR UPDATE
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Users can delete their own exercises
CREATE POLICY "Users can delete own exercises"
    ON exercises FOR DELETE
    USING (auth.uid() = created_by);

-- Admins can manage all exercises
CREATE POLICY "Admins can manage all exercises"
    ON exercises FOR ALL
    USING (is_admin());

-- ============================================
-- WORKOUTS POLICIES
-- ============================================

-- Users can view their own workouts
CREATE POLICY "Users can view own workouts"
    ON workouts FOR SELECT
    USING (auth.uid() = user_id);

-- Users can view public workouts
CREATE POLICY "Users can view public workouts"
    ON workouts FOR SELECT
    USING (is_public = TRUE AND is_active = TRUE);

-- Users can create workouts
CREATE POLICY "Users can create workouts"
    ON workouts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own workouts
CREATE POLICY "Users can update own workouts"
    ON workouts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own workouts
CREATE POLICY "Users can delete own workouts"
    ON workouts FOR DELETE
    USING (auth.uid() = user_id);

-- Admins can manage all workouts
CREATE POLICY "Admins can manage all workouts"
    ON workouts FOR ALL
    USING (is_admin());

-- ============================================
-- WORKOUT SESSIONS POLICIES
-- ============================================

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
    ON workout_sessions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create sessions
CREATE POLICY "Users can create sessions"
    ON workout_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
    ON workout_sessions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete own sessions"
    ON workout_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- Admins can manage all sessions
CREATE POLICY "Admins can manage all sessions"
    ON workout_sessions FOR ALL
    USING (is_admin());

-- ============================================
-- WORKOUT LOGS POLICIES
-- ============================================

-- Users can view their own logs
CREATE POLICY "Users can view own logs"
    ON workout_logs FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create logs
CREATE POLICY "Users can create logs"
    ON workout_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own logs
CREATE POLICY "Users can update own logs"
    ON workout_logs FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own logs
CREATE POLICY "Users can delete own logs"
    ON workout_logs FOR DELETE
    USING (auth.uid() = user_id);

-- Admins can manage all logs
CREATE POLICY "Admins can manage all logs"
    ON workout_logs FOR ALL
    USING (is_admin());

-- ============================================
-- PROGRESS METRICS POLICIES
-- ============================================

-- Users can view their own metrics
CREATE POLICY "Users can view own metrics"
    ON progress_metrics FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create/update their metrics
CREATE POLICY "Users can create metrics"
    ON progress_metrics FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own metrics"
    ON progress_metrics FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins can manage all metrics
CREATE POLICY "Admins can manage all metrics"
    ON progress_metrics FOR ALL
    USING (is_admin());

-- ============================================
-- AI RECOMMENDATIONS POLICIES
-- ============================================

-- Users can view their own recommendations
CREATE POLICY "Users can view own recommendations"
    ON ai_recommendations FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their recommendations (mark as read, respond)
CREATE POLICY "Users can update own recommendations"
    ON ai_recommendations FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- System creates recommendations via service role
-- Admins can manage all recommendations
CREATE POLICY "Admins can manage all recommendations"
    ON ai_recommendations FOR ALL
    USING (is_admin());

-- ============================================
-- PERSONAL RECORDS POLICIES
-- ============================================

-- Users can view their own records
CREATE POLICY "Users can view own records"
    ON personal_records FOR SELECT
    USING (auth.uid() = user_id);

-- System creates records via service role or user
CREATE POLICY "Users can create records"
    ON personal_records FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records"
    ON personal_records FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins can manage all records
CREATE POLICY "Admins can manage all records"
    ON personal_records FOR ALL
    USING (is_admin());

-- ============================================
-- GRANT PERMISSIONS TO SERVICE ROLE
-- ============================================
-- Service role bypasses RLS, used for:
-- - Background jobs
-- - AI recommendation generation
-- - Admin operations
-- - Webhook processing

-- No explicit grants needed as service_role bypasses RLS
