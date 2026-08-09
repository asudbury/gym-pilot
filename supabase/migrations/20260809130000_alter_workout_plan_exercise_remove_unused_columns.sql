-- Drop legacy workout_plan_exercise columns that are no longer part of the schema
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'workout_plan_exercise'
      AND column_name = 'session_id'
  ) THEN
    ALTER TABLE public.workout_plan_exercise DROP CONSTRAINT IF EXISTS workout_plan_exercise_session_id_fkey;
    DROP INDEX IF EXISTS workout_plan_exercise_session_id_idx;
    ALTER TABLE public.workout_plan_exercise DROP COLUMN IF EXISTS session_id;
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
