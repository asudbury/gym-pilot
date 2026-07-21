-- Allow authenticated users to update their own user-session history rows.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy p
    JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE p.polname = 'update_user_sessions_own'
      AND n.nspname = 'public'
      AND c.relname = 'gym_pilot_user_session'
  ) THEN
    CREATE POLICY update_user_sessions_own ON public.gym_pilot_user_session
      FOR UPDATE
      USING (
        auth.role() = 'authenticated'
        AND auth.uid() IS NOT NULL
        AND user_id IS NOT DISTINCT FROM auth.uid()
      )
      WITH CHECK (
        auth.role() = 'authenticated'
        AND auth.uid() IS NOT NULL
        AND user_id IS NOT DISTINCT FROM auth.uid()
      );
  END IF;
END$$;
