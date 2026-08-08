-- Drop plan_sessions column from workout_plan (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workout_plan' AND column_name = 'plan_sessions'
  ) THEN
    ALTER TABLE public.workout_plan DROP COLUMN plan_sessions;
  ELSE
    RAISE NOTICE 'Column plan_sessions not present on public.workout_plan; skipping';
  END IF;
END
$$;
