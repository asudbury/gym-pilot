-- Add an optional exercise_id column to the workout-item table so a workout row can
-- reference a canonical exercise record when one is selected.
ALTER TABLE IF EXISTS public.gym_pilot_user_session_workout_item
  ADD COLUMN IF NOT EXISTS exercise_id text NULL;
