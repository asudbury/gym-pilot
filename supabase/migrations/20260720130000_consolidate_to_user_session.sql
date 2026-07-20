-- Rebuild the session schema around a single consolidated user-session table.
-- This drops the legacy session/attendance tables and creates the new table from scratch.
CREATE TABLE IF NOT EXISTS public.gym_pilot_user_session (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_club_id bigint NULL,
  session_type text NOT NULL CHECK (session_type IN ('class','personal_training','solo')),
  class_id text NULL,
  class_name text NULL,
  trainer_id uuid NULL,
  trainer_name text NULL,
  start_at timestamptz NOT NULL,
  duration_minutes int NULL,
  location text NULL,
  capacity int NULL,
  price int NULL,
  metadata jsonb NULL,
  user_id uuid NULL,
  session_id text NULL,
  role text NULL CHECK (role IS NULL OR role IN ('client','trainer')),
  status text NULL CHECK (status IS NULL OR status IN ('booked','cancelled','attended','no_show','declined')),
  notes text NULL,
  rating smallint NULL CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  attendance_type text NULL CHECK (attendance_type IS NULL OR attendance_type IN ('attended','taught')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gym_pilot_user_session_trainer_id ON public.gym_pilot_user_session (trainer_id);
CREATE INDEX IF NOT EXISTS idx_gym_pilot_user_session_start_at ON public.gym_pilot_user_session (start_at);
CREATE INDEX IF NOT EXISTS idx_gym_pilot_user_session_user_id ON public.gym_pilot_user_session (user_id);

ALTER TABLE IF EXISTS public.gym_pilot_user_session ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy p
    JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE p.polname = 'select_user_sessions_authenticated'
      AND n.nspname = 'public'
      AND c.relname = 'gym_pilot_user_session'
  ) THEN
    CREATE POLICY select_user_sessions_authenticated ON public.gym_pilot_user_session
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy p
    JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE p.polname = 'insert_user_sessions_authenticated'
      AND n.nspname = 'public'
      AND c.relname = 'gym_pilot_user_session'
  ) THEN
    CREATE POLICY insert_user_sessions_authenticated ON public.gym_pilot_user_session
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy p
    JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE p.polname = 'update_user_sessions_trainer'
      AND n.nspname = 'public'
      AND c.relname = 'gym_pilot_user_session'
  ) THEN
    CREATE POLICY update_user_sessions_trainer ON public.gym_pilot_user_session
      FOR UPDATE USING (trainer_id::text = auth.uid()::text) WITH CHECK (trainer_id::text = auth.uid()::text);
  END IF;
END$$;
