-- Migration: Add cardio_activities column to workouts table
-- This enables storing cardio activities like walking, running, cycling, etc.

-- Add cardio_activities column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workouts' AND column_name = 'cardio_activities'
    ) THEN
        ALTER TABLE workouts ADD COLUMN cardio_activities JSONB DEFAULT '[]'::JSONB;
        COMMENT ON COLUMN workouts.cardio_activities IS 'JSON array of cardio activities: [{type, duration_minutes, distance_km, intensity, notes}]';
    END IF;
END $$;

-- Add type column if it needs to support 'cardio' as a value
-- Note: workout_type enum already exists, we may need to add values
-- DO $$ 
-- BEGIN
--     ALTER TYPE workout_type ADD VALUE IF NOT EXISTS 'cardio';
--     ALTER TYPE workout_type ADD VALUE IF NOT EXISTS 'mixed';
--     ALTER TYPE workout_type ADD VALUE IF NOT EXISTS 'flexibility';
-- EXCEPTION
--     WHEN duplicate_object THEN null;
-- END $$;

-- Create index for cardio activities
CREATE INDEX IF NOT EXISTS idx_workouts_cardio_activities ON workouts USING gin (cardio_activities);

-- Add comment
COMMENT ON COLUMN workouts.cardio_activities IS 'Cardio activities stored as JSONB array: [{type: "walking"|"running"|"cycling"|"swimming"|"hiit"|"jump_rope", duration_minutes: number, distance_km?: number, intensity: "low"|"moderate"|"high", notes?: string}]';
