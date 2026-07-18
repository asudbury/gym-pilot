alter table public.gym_pilot_profiles
add column if not exists gym_brand text,
add column if not exists gym_name text,
add column if not exists gym_club_id bigint;
