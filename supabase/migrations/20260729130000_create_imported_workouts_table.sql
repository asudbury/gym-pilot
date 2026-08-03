create table if not exists public.gym_pilot_imported_workout (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  display_name text not null,
  start_date timestamptz not null,
  duration integer not null,
  energy float not null,
  energy_unit text not null,
  original_id text,
  created_at timestamptz not null default now()
);

alter table public.gym_pilot_imported_workout enable row level security;

create index if not exists gym_pilot_imported_workout_user_id_idx
on public.gym_pilot_imported_workout (user_id);
