-- Add the session relationship back to workout_plan_exercise and remove the old unused columns.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'workout_plan_exercise'
      AND column_name = 'session_id'
  ) THEN
    ALTER TABLE public.workout_plan_exercise
      ADD COLUMN session_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'workout_plan_exercise_session_id_fkey'
  ) THEN
    ALTER TABLE public.workout_plan_exercise
      ADD CONSTRAINT workout_plan_exercise_session_id_fkey
      FOREIGN KEY (session_id) REFERENCES public.workout_plan_session(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'workout_plan_exercise'
      AND indexname = 'workout_plan_exercise_session_id_idx'
  ) THEN
    CREATE INDEX workout_plan_exercise_session_id_idx
      ON public.workout_plan_exercise (session_id);
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'workout_plan_exercise'
      AND column_name = 'session_name'
  ) THEN
    ALTER TABLE public.workout_plan_exercise DROP COLUMN IF EXISTS session_name;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'workout_plan_exercise'
      AND column_name = 'details'
  ) THEN
    ALTER TABLE public.workout_plan_exercise DROP COLUMN IF EXISTS details;
  END IF;
END
$$;
