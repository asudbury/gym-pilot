-- Add login-history timestamps to the profile table.

alter table public.gym_pilot_profiles
add column if not exists last_logged_in_at timestamptz,
add column if not exists previous_last_logged_in_at timestamptz;

create index if not exists gym_pilot_profiles_last_logged_in_at_idx
on public.gym_pilot_profiles (last_logged_in_at desc);
