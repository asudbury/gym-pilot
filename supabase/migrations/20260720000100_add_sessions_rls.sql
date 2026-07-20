-- Enable row level security and basic policies for session and booking tables

-- Enable RLS
ALTER TABLE IF EXISTS public.gym_pilot_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gym_pilot_session_booking ENABLE ROW LEVEL SECURITY;

-- Sessions: allow authenticated users to select sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy p
    JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE p.polname = 'select_sessions_authenticated'
      AND n.nspname = 'public'
      AND c.relname = 'gym_pilot_session'
  ) THEN
    CREATE POLICY select_sessions_authenticated ON public.gym_pilot_session
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END$$;

-- Sessions: allow insert for authenticated users (trainers/managers may later be restricted)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy p
    JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE p.polname = 'insert_sessions_authenticated'
      AND n.nspname = 'public'
      AND c.relname = 'gym_pilot_session'
  ) THEN
    CREATE POLICY insert_sessions_authenticated ON public.gym_pilot_session
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END$$;

-- Sessions: allow trainers to update/delete their own sessions
-- Create policy for UPDATE by trainer on their own sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy p
    JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE p.polname = 'update_sessions_trainer'
      AND n.nspname = 'public'
      AND c.relname = 'gym_pilot_session'
  ) THEN
    CREATE POLICY update_sessions_trainer ON public.gym_pilot_session
      FOR UPDATE USING (trainer_id::text = auth.uid()::text) WITH CHECK (trainer_id::text = auth.uid()::text);
  END IF;
END$$;

-- Create policy for DELETE by trainer on their own sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy p
    JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE p.polname = 'delete_sessions_trainer'
      AND n.nspname = 'public'
      AND c.relname = 'gym_pilot_session'
  ) THEN
    CREATE POLICY delete_sessions_trainer ON public.gym_pilot_session
      FOR DELETE USING (trainer_id::text = auth.uid()::text);
  END IF;
END$$;

-- Bookings: allow users to insert bookings for themselves
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy p
    JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE p.polname = 'insert_booking_own'
      AND n.nspname = 'public'
      AND c.relname = 'gym_pilot_session_booking'
  ) THEN
    CREATE POLICY insert_booking_own ON public.gym_pilot_session_booking
      FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);
  END IF;
END$$;

-- Bookings: allow users to select their own bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy p
    JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE p.polname = 'select_booking_own'
      AND n.nspname = 'public'
      AND c.relname = 'gym_pilot_session_booking'
  ) THEN
    CREATE POLICY select_booking_own ON public.gym_pilot_session_booking
      FOR SELECT USING (user_id::text = auth.uid()::text);
  END IF;
END$$;

-- Bookings: allow trainers to select bookings for sessions they own
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy p
    JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE p.polname = 'select_booking_trainer'
      AND n.nspname = 'public'
      AND c.relname = 'gym_pilot_session_booking'
  ) THEN
    CREATE POLICY select_booking_trainer ON public.gym_pilot_session_booking
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.gym_pilot_session s WHERE s.id = session_id AND s.trainer_id::text = auth.uid()::text
        )
      );
  END IF;
END$$;

-- Bookings: allow users to update status of their own bookings (cancel)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy p
    JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE p.polname = 'update_booking_own'
      AND n.nspname = 'public'
      AND c.relname = 'gym_pilot_session_booking'
  ) THEN
    CREATE POLICY update_booking_own ON public.gym_pilot_session_booking
      FOR UPDATE USING (user_id::text = auth.uid()::text) WITH CHECK (user_id::text = auth.uid()::text);
  END IF;
END$$;

-- Bookings: allow trainers to update bookings for their sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy p
    JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE p.polname = 'update_booking_trainer'
      AND n.nspname = 'public'
      AND c.relname = 'gym_pilot_session_booking'
  ) THEN
    CREATE POLICY update_booking_trainer ON public.gym_pilot_session_booking
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.gym_pilot_session s WHERE s.id = session_id AND s.trainer_id::text = auth.uid()::text
        )
      ) WITH CHECK (EXISTS (SELECT 1 FROM public.gym_pilot_session s WHERE s.id = session_id AND s.trainer_id::text = auth.uid()::text));
  END IF;
END$$;
