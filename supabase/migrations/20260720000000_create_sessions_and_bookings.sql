-- Create sessions and session bookings for classes, personal training, and solo sessions

CREATE TABLE IF NOT EXISTS public.gym_pilot_session (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_club_id bigint NULL,
  session_type text NOT NULL CHECK (session_type IN ('class','personal_training','solo')),
  class_id text NULL,
  class_name text NULL,
  trainer_id uuid NULL,
  trainer_name text NULL,
  start_at timestamptz NOT NULL,
  duration_minutes int NULL,
  location text NULL,
  capacity int NULL,
  price int NULL,
  metadata jsonb NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gym_pilot_session_trainer_id ON public.gym_pilot_session (trainer_id);
CREATE INDEX IF NOT EXISTS idx_gym_pilot_session_start_at ON public.gym_pilot_session (start_at);

CREATE TABLE IF NOT EXISTS public.gym_pilot_session_booking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.gym_pilot_session(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('client','trainer')),
  status text NOT NULL CHECK (status IN ('booked','cancelled','attended','no_show','declined')),
  notes text NULL,
  rating smallint NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gym_pilot_session_booking_session_id ON public.gym_pilot_session_booking (session_id);
CREATE INDEX IF NOT EXISTS idx_gym_pilot_session_booking_user_id ON public.gym_pilot_session_booking (user_id);

-- Optional: lightweight RLS policies can be added later to match existing app patterns

-- Backfill from existing gym_pilot_class_attendance is intentionally left to a separate migration script if required.
