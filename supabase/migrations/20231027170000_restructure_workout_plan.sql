-- Up Migration
-- Create the workout plan session and exercise tables in an idempotent way.
-- This avoids failures when the table already exists or when the updated_at trigger
-- function has not been created yet by an earlier migration.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'workout_plan'
  ) THEN
    ALTER TABLE public.workout_plan DROP COLUMN IF EXISTS plan_sessions;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'workout_plan_session'
  ) THEN
    CREATE TABLE public.workout_plan_session (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      plan_id uuid NOT NULL,
      name text NOT NULL,
      position integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT workout_plan_session_plan_id_fkey
        FOREIGN KEY (plan_id) REFERENCES public.workout_plan(id) ON DELETE CASCADE
    );
  END IF;
END
$$;

ALTER TABLE public.workout_plan_session
  ADD COLUMN IF NOT EXISTS plan_id uuid;
ALTER TABLE public.workout_plan_session
  ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.workout_plan_session
  ADD COLUMN IF NOT EXISTS position integer;
ALTER TABLE public.workout_plan_session
  ADD COLUMN IF NOT EXISTS created_at timestamptz;
ALTER TABLE public.workout_plan_session
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

CREATE INDEX IF NOT EXISTS workout_plan_session_plan_id_idx
ON public.workout_plan_session (plan_id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    DROP TRIGGER IF EXISTS set_updated_at ON public.workout_plan_session;
    CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.workout_plan_session
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  ELSE
    RAISE NOTICE 'set_updated_at function not found; skipping trigger creation for workout_plan_session';
  END IF;
END
$$;

ALTER TABLE public.workout_plan_session ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'workout_plan_session'
      AND policyname = 'Users can manage their own plan sessions'
  ) THEN
    CREATE POLICY "Users can manage their own plan sessions"
      ON public.workout_plan_session
      FOR ALL
      USING (EXISTS (SELECT 1 FROM public.workout_plan wp WHERE wp.id = plan_id AND auth.uid() = wp.user_id))
      WITH CHECK (EXISTS (SELECT 1 FROM public.workout_plan wp WHERE wp.id = plan_id AND auth.uid() = wp.user_id));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'workout_plan_exercise'
  ) THEN
    CREATE TABLE public.workout_plan_exercise (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      plan_id uuid NOT NULL,
      session_id uuid NOT NULL,
      exercise_id text NOT NULL,
      exercise_name text,
      position integer NOT NULL DEFAULT 0,
      details jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT workout_plan_exercise_plan_id_fkey
        FOREIGN KEY (plan_id) REFERENCES public.workout_plan(id) ON DELETE CASCADE,
      CONSTRAINT workout_plan_exercise_session_id_fkey
        FOREIGN KEY (session_id) REFERENCES public.workout_plan_session(id) ON DELETE CASCADE
    );
  END IF;
END
$$;

ALTER TABLE public.workout_plan_exercise
  ADD COLUMN IF NOT EXISTS plan_id uuid;
ALTER TABLE public.workout_plan_exercise
  ADD COLUMN IF NOT EXISTS session_id uuid;
ALTER TABLE public.workout_plan_exercise
  ADD COLUMN IF NOT EXISTS exercise_id text;
ALTER TABLE public.workout_plan_exercise
  ADD COLUMN IF NOT EXISTS exercise_name text;
ALTER TABLE public.workout_plan_exercise
  ADD COLUMN IF NOT EXISTS position integer;
ALTER TABLE public.workout_plan_exercise
  ADD COLUMN IF NOT EXISTS created_at timestamptz;
ALTER TABLE public.workout_plan_exercise
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

CREATE INDEX IF NOT EXISTS workout_plan_exercise_plan_id_idx
ON public.workout_plan_exercise (plan_id);

CREATE INDEX IF NOT EXISTS workout_plan_exercise_session_id_idx
ON public.workout_plan_exercise (session_id);

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

ALTER TABLE public.workout_plan_exercise ENABLE ROW LEVEL SECURITY;

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
          WHERE wp.id = plan_id AND auth.uid() = wp.user_id
        )
      );
  END IF;
END
$$;

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
          WHERE wp.id = plan_id AND auth.uid() = wp.user_id
        )
      );
  END IF;
END
$$;

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
          WHERE wp.id = plan_id AND auth.uid() = wp.user_id
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.workout_plan wp
          WHERE wp.id = plan_id AND auth.uid() = wp.user_id
        )
      );
  END IF;
END
$$;

-- Down Migration
ALTER TABLE public.workout_plan
ADD COLUMN IF NOT EXISTS plan_sessions jsonb NOT NULL DEFAULT '[]'::jsonb;
DROP TABLE IF EXISTS public.workout_plan_session CASCADE;
DROP TABLE IF EXISTS public.workout_plan_exercise CASCADE;