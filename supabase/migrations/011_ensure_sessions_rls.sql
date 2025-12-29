-- Ensure RLS is enabled for workout_sessions
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts/duplicates and ensure clean state
DROP POLICY IF EXISTS "Users can view their own sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Enable read access for own sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Enable insert access for own sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Enable update access for own sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Enable delete access for own sessions" ON workout_sessions;

-- Create Comprehensive Policies for workout_sessions
CREATE POLICY "Users can view their own sessions"
ON workout_sessions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
ON workout_sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
ON workout_sessions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
ON workout_sessions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Ensure RLS is enabled for workout_logs (Double check)
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own logs" ON workout_logs;
DROP POLICY IF EXISTS "Users can insert their own logs" ON workout_logs;
DROP POLICY IF EXISTS "Users can update their own logs" ON workout_logs;
DROP POLICY IF EXISTS "Users can delete their own logs" ON workout_logs;

-- Create Comprehensive Policies for workout_logs
CREATE POLICY "Users can view their own logs"
ON workout_logs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logs"
ON workout_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own logs"
ON workout_logs FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own logs"
ON workout_logs FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
