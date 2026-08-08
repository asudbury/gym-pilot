-- Create workout_plan_exercise table (idempotent)
-- Adds indexes, trigger, enables RLS and creates policies

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'workout_plan_exercise'
  ) THEN
    CREATE TABLE public.workout_plan_exercise ( 
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      plan_id uuid REFERENCES public.workout_plan(id) ON DELETE CASCADE NOT NULL,
      exercise_id text NOT NULL,
      exercise_name text,
      position integer NOT NULL DEFAULT 0,
      details jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END
$$;

-- Add indexes
CREATE INDEX IF NOT EXISTS workout_plan_exercise_plan_id_idx ON public.workout_plan_exercise (plan_id);

-- Add trigger for updated_at if function exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    DROP TRIGGER IF EXISTS set_updated_at ON public.workout_plan_exercise;
    CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.workout_plan_exercise
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  ELSE
    RAISE NOTICE 'set_updated_at function not found; skipping trigger creation for workout_plan_exercise';
  END IF;
END
$$;

-- Enable RLS
ALTER TABLE public.workout_plan_exercise ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can see exercises for their plans
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'workout_plan_exercise' AND policyname = 'Users can see exercises for their plans'
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
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'workout_plan_exercise' AND policyname = 'Users can insert exercises for their plans'
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
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'workout_plan_exercise' AND policyname = 'Users can update exercises for their plans'
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
