-- Ensure the previous-login timestamp exists for any environments that only applied the earlier migration.

alter table public.gym_pilot_profiles
add column if not exists previous_last_logged_in_at timestamptz;
