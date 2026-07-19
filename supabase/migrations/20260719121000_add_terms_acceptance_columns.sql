alter table public.gym_pilot_profile
  add column if not exists terms_accepted boolean not null default false;

alter table public.gym_pilot_profile
  add column if not exists terms_accepted_at timestamptz;
