-- Add email column to gym_pilot_profile
-- Adds an optional text column to store the user's email on their profile row.
-- This is safe to run multiple times: the column is created only if missing.

BEGIN;

ALTER TABLE public.gym_pilot_profile
  ADD COLUMN IF NOT EXISTS email text;

COMMIT;
