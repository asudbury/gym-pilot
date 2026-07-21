-- Add a sort order column for session workout items so rows can be reordered.
ALTER TABLE IF EXISTS public.gym_pilot_user_session_workout_item
  ADD COLUMN IF NOT EXISTS sort_order int NULL;

UPDATE public.gym_pilot_user_session_workout_item
SET sort_order = item_index
WHERE sort_order IS NULL;

CREATE INDEX IF NOT EXISTS idx_gym_pilot_user_session_workout_item_sort_order
  ON public.gym_pilot_user_session_workout_item (session_id, user_id, sort_order);
