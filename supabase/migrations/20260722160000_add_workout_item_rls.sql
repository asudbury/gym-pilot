-- Ensure workout-item rows are writable only by the owning authenticated user.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'gym_pilot_user_session_workout_item'
      AND policyname = 'workout_items_manage_own'
  ) THEN
    CREATE POLICY workout_items_manage_own
      ON public.gym_pilot_user_session_workout_item
      FOR ALL
      USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
      WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
  END IF;
END
$$;
