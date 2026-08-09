-- Remove the obsolete plan_slug column and its unique constraint/index from workout_plan.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'workout_plan'
      AND column_name = 'plan_slug'
  ) THEN
    ALTER TABLE public.workout_plan DROP COLUMN IF EXISTS plan_slug;
  END IF;
END
$$;

DROP INDEX IF EXISTS public.workout_plan_user_id_plan_slug_key;
