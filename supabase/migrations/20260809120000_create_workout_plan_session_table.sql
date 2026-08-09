-- Create workout_plan_session table idempotently.
-- This migration is meant to work even if an earlier migration partially applied.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'workout_plan_session'
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.workout_plan_session'::regclass
      AND conname = 'workout_plan_session_plan_id_fkey'
  ) THEN
    ALTER TABLE public.workout_plan_session
      ADD CONSTRAINT workout_plan_session_plan_id_fkey
      FOREIGN KEY (plan_id) REFERENCES public.workout_plan(id) ON DELETE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS workout_plan_session_plan_id_idx
ON public.workout_plan_session (plan_id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    DROP TRIGGER IF EXISTS set_updated_at ON public.workout_plan_session;
    CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.workout_plan_session
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
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
