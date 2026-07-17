alter table public.gym_pilot_profiles
add column if not exists roles jsonb not null default '[]'::jsonb;
