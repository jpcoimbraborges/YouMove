-- Fix invalid muscle values in workout_templates
-- Run this in Supabase SQL Editor

UPDATE workout_templates
SET target_muscles = ARRAY(
    SELECT CASE 
        WHEN muscle = 'legs' THEN 'quadriceps'
        WHEN muscle = 'full-body' THEN 'full_body'
        WHEN muscle = 'arms' THEN 'biceps'
        WHEN muscle = 'abs' THEN 'core'
        ELSE muscle
    END
    FROM unnest(target_muscles) AS muscle
)
WHERE 'legs' = ANY(target_muscles) 
   OR 'full-body' = ANY(target_muscles)
   OR 'arms' = ANY(target_muscles)
   OR 'abs' = ANY(target_muscles);
