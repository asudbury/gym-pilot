-- Migration: drop foreign key constraint on gym_pilot_profile.user_id
-- Reason: admin UI needs to create profile rows without FK race during auth propagation.
-- WARNING: dropping this FK removes DB-enforced referential integrity for profile -> auth.users.

ALTER TABLE public.gym_pilot_profile
  DROP CONSTRAINT IF EXISTS gym_pilot_profile_user_id_fkey;
