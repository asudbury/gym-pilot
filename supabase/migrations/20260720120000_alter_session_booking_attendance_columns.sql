-- Align gym_pilot_session_booking with the attendance payload used by the app.

ALTER TABLE IF EXISTS public.gym_pilot_session_booking
  ADD COLUMN IF NOT EXISTS class_id text,
  ADD COLUMN IF NOT EXISTS class_name text,
  ADD COLUMN IF NOT EXISTS instructor_name text,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS attendance_type text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS rating smallint;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'gym_pilot_session_booking_attendance_type_check'
      AND conrelid = 'public.gym_pilot_session_booking'::regclass
  ) THEN
    ALTER TABLE public.gym_pilot_session_booking
      ADD CONSTRAINT gym_pilot_session_booking_attendance_type_check
      CHECK (attendance_type IS NULL OR attendance_type IN ('attended', 'taught'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'gym_pilot_session_booking_rating_check'
      AND conrelid = 'public.gym_pilot_session_booking'::regclass
  ) THEN
    ALTER TABLE public.gym_pilot_session_booking
      ADD CONSTRAINT gym_pilot_session_booking_rating_check
      CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));
  END IF;
END $$;
