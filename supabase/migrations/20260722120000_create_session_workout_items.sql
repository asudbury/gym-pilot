-- Create a dedicated table for workout rows associated with user sessions.
-- Each row stores a single workout item so the data can be queried independently
-- from the legacy JSON metadata payload.
CREATE TABLE IF NOT EXISTS public.gym_pilot_user_session_workout_item (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid NOT NULL,
  item_index int NOT NULL,
  category text NOT NULL CHECK (category IN ('exercise','warm_up','stretch','cool_down','run','spin')),
  exercise_name text NULL,
  exercise_id text NULL,
  reps text NULL,
  sets text NULL,
  weight text NULL,
  duration_minutes text NULL,
  distance_km text NULL,
  speed_kph text NULL,
  notes text NULL,
  plan_item_id text NULL,
  sort_order int NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gym_pilot_user_session_workout_item_session_id ON public.gym_pilot_user_session_workout_item (session_id);
CREATE INDEX IF NOT EXISTS idx_gym_pilot_user_session_workout_item_user_id ON public.gym_pilot_user_session_workout_item (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_gym_pilot_user_session_workout_item_unique_position ON public.gym_pilot_user_session_workout_item (session_id, user_id, item_index);

ALTER TABLE IF EXISTS public.gym_pilot_user_session_workout_item ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gym_pilot_user_session_workout_item TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gym_pilot_user_session_workout_item TO anon;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy p
    JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE p.polname = 'select_session_workout_items_authenticated'
      AND n.nspname = 'public'
      AND c.relname = 'gym_pilot_user_session_workout_item'
  ) THEN
    CREATE POLICY select_session_workout_items_authenticated ON public.gym_pilot_user_session_workout_item
      FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'anon');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy p
    JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE p.polname = 'insert_session_workout_items_authenticated'
      AND n.nspname = 'public'
      AND c.relname = 'gym_pilot_user_session_workout_item'
  ) THEN
    CREATE POLICY insert_session_workout_items_authenticated ON public.gym_pilot_user_session_workout_item
      FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'anon');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy p
    JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE p.polname = 'update_session_workout_items_authenticated'
      AND n.nspname = 'public'
      AND c.relname = 'gym_pilot_user_session_workout_item'
  ) THEN
    CREATE POLICY update_session_workout_items_authenticated ON public.gym_pilot_user_session_workout_item
      FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'anon') WITH CHECK (auth.uid() = user_id OR auth.role() = 'anon');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy p
    JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE p.polname = 'delete_session_workout_items_authenticated'
      AND n.nspname = 'public'
      AND c.relname = 'gym_pilot_user_session_workout_item'
  ) THEN
    CREATE POLICY delete_session_workout_items_authenticated ON public.gym_pilot_user_session_workout_item
      FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'anon');
  END IF;
END$$;
