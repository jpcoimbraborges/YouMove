-- Add exercises_log column to workout_sessions if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'workout_sessions'
        AND column_name = 'exercises_log'
    ) THEN
        ALTER TABLE workout_sessions ADD COLUMN exercises_log JSONB DEFAULT '[]'::JSONB;
    END IF;
END $$;
