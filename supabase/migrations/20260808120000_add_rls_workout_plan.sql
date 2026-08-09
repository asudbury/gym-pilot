-- Ensure workout_plan has expected columns, indexes, trigger, RLS and policy
-- This migration is idempotent and safe to run against an already-updated database.

DO $$
BEGIN
  -- Add columns if they don't exist
  ALTER TABLE public.workout_plan ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL;
  ALTER TABLE public.workout_plan ADD COLUMN IF NOT EXISTS plan_name text NOT NULL DEFAULT '';
  ALTER TABLE public.workout_plan ADD COLUMN IF NOT EXISTS plan_sessions jsonb NOT NULL DEFAULT '[]'::jsonb;
  ALTER TABLE public.workout_plan ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
  ALTER TABLE public.workout_plan ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'workout_plan table does not exist, skipping column additions';
END
$$;

-- Ensure indexes
CREATE INDEX IF NOT EXISTS workout_plan_user_id_idx ON public.workout_plan (user_id);

-- Ensure updated_at trigger exists
DROP TRIGGER IF EXISTS set_updated_at ON public.workout_plan;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON public.workout_plan
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  ELSE
    RAISE NOTICE 'set_updated_at function not found; skipping trigger creation';
  END IF;
END
$$;

-- Enable Row Level Security
ALTER TABLE public.workout_plan ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can manage their own plans
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'workout_plan'
      AND policyname = 'Users can manage their own plans'
  ) THEN
    CREATE POLICY "Users can manage their own plans"
      ON public.workout_plan
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;
