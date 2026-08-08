-- Up Migration
-- Create the new workout_plan_exercise table
-- Ensure workout_plan exists: rename existing gym_pilot_plan or create an empty workout_plan
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'gym_pilot_plan'
  ) THEN
    -- Create workout_plan with the same structure but no data, then drop the old table
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'workout_plan'
    ) THEN
      CREATE TABLE public.workout_plan (LIKE public.gym_pilot_plan INCLUDING ALL);
    END IF;
    DROP TABLE IF EXISTS public.gym_pilot_plan CASCADE;
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'workout_plan'
  ) THEN
    -- Create a minimal workout_plan if neither table exists
    CREATE TABLE public.workout_plan (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid()
    );
  END IF;
END
$$;

-- Ensure workout_plan has expected columns and indexes (compatible with gym_pilot_plan)
DO $$
BEGIN
  -- Add columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workout_plan' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.workout_plan
    ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workout_plan' AND column_name = 'plan_name'
  ) THEN
    ALTER TABLE public.workout_plan
    ADD COLUMN plan_name text NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workout_plan' AND column_name = 'plan_slug'
  ) THEN
    ALTER TABLE public.workout_plan
    ADD COLUMN plan_slug text NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workout_plan' AND column_name = 'plan_sessions'
  ) THEN
    ALTER TABLE public.workout_plan
    ADD COLUMN plan_sessions jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workout_plan' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.workout_plan
    ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workout_plan' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.workout_plan
    ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;

  -- Ensure unique index on (user_id, plan_slug)
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'workout_plan' AND indexname = 'workout_plan_user_id_plan_slug_key'
  ) THEN
    CREATE UNIQUE INDEX workout_plan_user_id_plan_slug_key ON public.workout_plan (user_id, plan_slug);
  END IF;

  -- Ensure user_id index
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'workout_plan' AND indexname = 'workout_plan_user_id_idx'
  ) THEN
    CREATE INDEX workout_plan_user_id_idx ON public.workout_plan (user_id);
  END IF;

  -- Trigger for updated_at
  PERFORM 1; -- no-op to allow DDL above
END
$$;

-- Create/refresh trigger for set_updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.workout_plan;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.workout_plan
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable Row Level Security for workout_plan
ALTER TABLE public.workout_plan ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own plans
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


CREATE TABLE public.workout_plan_exercise ( 
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES public.workout_plan(id) ON DELETE CASCADE NOT NULL,
  exercise_id text NOT NULL, -- Changed to text as per workout_template_exercise
  exercise_name text, -- Added as per workout_template_exercise
  position integer NOT NULL DEFAULT 0,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now() -- Added updated_at for consistency
);

-- Add indexes for performance 
CREATE INDEX IF NOT EXISTS workout_plan_exercise_plan_id_idx
ON public.workout_plan_exercise (plan_id);

-- Add trigger for updated_at
-- Ensure the set_updated_at function exists (it should from consolidated_current_schema.sql)
DROP TRIGGER IF EXISTS set_updated_at ON public.workout_plan_exercise;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.workout_plan_exercise
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at(); 

-- Enable Row Level Security for workout_plan_exercise
ALTER TABLE public.workout_plan_exercise ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can see exercises for their plans
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'workout_plan_exercise'
      AND policyname = 'Users can see exercises for their plans'
  ) THEN
    CREATE POLICY "Users can see exercises for their plans"
      ON public.workout_plan_exercise
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.workout_plan wp
          WHERE wp.id = plan_id AND (auth.uid() = wp.user_id OR public.user_has_role(auth.uid(), 'admin'))
        )
      );
  END IF;
END
$$;

-- RLS Policy: Users can insert exercises for their plans
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'workout_plan_exercise'
      AND policyname = 'Users can insert exercises for their plans'
  ) THEN
    CREATE POLICY "Users can insert exercises for their plans"
      ON public.workout_plan_exercise
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.workout_plan wp
          WHERE wp.id = plan_id AND (auth.uid() = wp.user_id OR public.user_has_role(auth.uid(), 'admin'))
        )
      );
  END IF;
END
$$;

-- RLS Policy: Users can update exercises for their plans
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'workout_plan_exercise'
      AND policyname = 'Users can update exercises for their plans'
  ) THEN
    CREATE POLICY "Users can update exercises for their plans"
      ON public.workout_plan_exercise
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.workout_plan wp
          WHERE wp.id = plan_id AND (auth.uid() = wp.user_id OR public.user_has_role(auth.uid(), 'admin'))
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.workout_plan wp
          WHERE wp.id = plan_id AND (auth.uid() = wp.user_id OR public.user_has_role(auth.uid(), 'admin'))
        )
      );
  END IF;
END
$$;

-- Remove the plan_sessions column from workout_plan 
ALTER TABLE public.workout_plan
DROP COLUMN plan_sessions;


-- Down Migration
-- Re-add the plan_sessions column to workout_plan 
ALTER TABLE public.workout_plan
ADD COLUMN plan_sessions jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Drop the workout_plan_exercise table
DROP TABLE IF EXISTS public.workout_plan_exercise CASCADE;