-- Consolidated Supabase schema for the current Gym Pilot application.
-- This migration is intentionally idempotent and can be applied to existing
-- environments without dropping the app's existing tables.

create extension if not exists pgcrypto schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.user_has_role(p_user_id uuid, p_role text)
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.gym_pilot_user_role as role_rows
    where role_rows.user_id = p_user_id
      and role_rows.role = p_role
  );
$$;

grant execute on function public.user_has_role(uuid, text) to authenticated;

create table if not exists public.gym_pilot_app_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  unique(user_id, key)
);

create table if not exists public.gym_pilot_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  friendly_name text,
  must_change_password boolean not null default false,
  terms_accepted boolean not null default false,
  terms_accepted_at timestamptz,
  trainer_id uuid,
  application_name text,
  gym_brand text,
  gym_name text,
  gym_club_id bigint,
  account_tier text not null default 'free' constraint gym_pilot_profile_account_tier_check check (account_tier in ('free', 'bronze', 'silver', 'gold')),
  access_ends_at timestamptz,
  is_frozen boolean not null default false,
  last_logged_in_at timestamptz,
  previous_last_logged_in_at timestamptz,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gym_pilot_user_role (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null constraint gym_pilot_user_role_role_check check (role in ('admin', 'trainer', 'client', 'guest')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, role)
);

create table if not exists public.gym_pilot_favourite_folder (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, name)
);

create table if not exists public.gym_pilot_favourite (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  path text not null,
  label text not null,
  folder text,
  folder_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gym_pilot_plan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  plan_name text not null,
  plan_slug text not null,
  plan_sessions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, plan_slug)
);

create table if not exists public.gym_pilot_assignment (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  plan_id uuid not null,
  assignment_name text not null,
  assigned_user_id uuid,
  assigned_user_name text,
  completed_exercises jsonb not null default '{}'::jsonb,
  plan_items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gym_pilot_user_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.gym_pilot_class_attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  session_id text,
  class_id text,
  class_name text,
  instructor_name text,
  started_at timestamptz,
  attendance_type text not null check (attendance_type in ('attended', 'taught')),
  notes text,
  rating smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gym_pilot_user_session (
  id uuid primary key default gen_random_uuid(),
  gym_club_id bigint,
  session_type text not null check (session_type in ('class', 'personal_training', 'solo')),
  class_id text,
  class_name text,
  trainer_id uuid,
  trainer_name text,
  start_at timestamptz not null,
  duration_minutes int,
  location text,
  capacity int,
  price int,
  metadata jsonb,
  user_id uuid,
  session_id text,
  role text check (role is null or role in ('client', 'trainer')),
  status text check (status is null or status in ('booked', 'cancelled', 'attended', 'no_show', 'declined')),
  notes text,
  rating smallint check (rating is null or (rating >= 1 and rating <= 5)),
  attendance_type text check (attendance_type is null or attendance_type in ('attended', 'taught')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.gym_pilot_user_session_workout_item (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  user_id uuid not null,
  item_index int not null,
  category text not null check (category in ('exercise', 'warm_up', 'stretch', 'cool_down', 'run', 'spin')),
  exercise_name text,
  exercise_id text,
  reps text,
  sets text,
  weight text,
  duration_minutes text,
  distance_km text,
  speed_kph text,
  notes text,
  plan_item_id text,
  sort_order int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.gym_pilot_app_setting (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value jsonb not null default 'null'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gym_pilot_error_log (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.gym_pilot_audit_log (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table public.gym_pilot_app_state enable row level security;
alter table public.gym_pilot_profile enable row level security;
alter table public.gym_pilot_user_role enable row level security;
alter table public.gym_pilot_favourite_folder enable row level security;
alter table public.gym_pilot_favourite enable row level security;
alter table public.gym_pilot_plan enable row level security;
alter table public.gym_pilot_assignment enable row level security;
alter table public.gym_pilot_user_activity enable row level security;
alter table public.gym_pilot_class_attendance enable row level security;
alter table public.gym_pilot_user_session enable row level security;
alter table public.gym_pilot_user_session_workout_item enable row level security;
alter table public.gym_pilot_app_setting enable row level security;
alter table public.gym_pilot_error_log enable row level security;
alter table public.gym_pilot_audit_log enable row level security;

create unique index if not exists gym_pilot_app_state_user_id_key_idx
on public.gym_pilot_app_state (user_id, key);

create index if not exists gym_pilot_user_role_user_id_idx
on public.gym_pilot_user_role (user_id);
create index if not exists gym_pilot_user_role_role_idx
on public.gym_pilot_user_role (role);
create index if not exists gym_pilot_profile_user_id_idx
on public.gym_pilot_profile (user_id);
create index if not exists gym_pilot_profile_trainer_id_idx
on public.gym_pilot_profile (trainer_id);
create index if not exists gym_pilot_profile_last_logged_in_at_idx
on public.gym_pilot_profile (last_logged_in_at desc);
create index if not exists gym_pilot_favourite_folder_user_id_idx
on public.gym_pilot_favourite_folder (user_id);
create index if not exists gym_pilot_user_session_trainer_id_idx
on public.gym_pilot_user_session (trainer_id);
create index if not exists gym_pilot_user_session_start_at_idx
on public.gym_pilot_user_session (start_at);
create index if not exists gym_pilot_user_session_user_id_idx
on public.gym_pilot_user_session (user_id);
create index if not exists gym_pilot_user_session_workout_item_session_id_idx
on public.gym_pilot_user_session_workout_item (session_id);
create index if not exists gym_pilot_user_session_workout_item_user_id_idx
on public.gym_pilot_user_session_workout_item (user_id);
create unique index if not exists gym_pilot_user_session_workout_item_unique_position_idx
on public.gym_pilot_user_session_workout_item (session_id, user_id, item_index);
create index if not exists gym_pilot_user_session_workout_item_sort_order_idx
on public.gym_pilot_user_session_workout_item (session_id, user_id, sort_order);

create trigger if not exists gym_pilot_app_state_set_updated_at
before update on public.gym_pilot_app_state
for each row execute function public.set_updated_at();

create trigger if not exists gym_pilot_user_role_set_updated_at
before update on public.gym_pilot_user_role
for each row execute function public.set_updated_at();

create trigger if not exists gym_pilot_profile_set_updated_at
before update on public.gym_pilot_profile
for each row execute function public.set_updated_at();

create trigger if not exists gym_pilot_favourite_folder_set_updated_at
before update on public.gym_pilot_favourite_folder
for each row execute function public.set_updated_at();

create trigger if not exists gym_pilot_favourite_set_updated_at
before update on public.gym_pilot_favourite
for each row execute function public.set_updated_at();

create trigger if not exists gym_pilot_plan_set_updated_at
before update on public.gym_pilot_plan
for each row execute function public.set_updated_at();

create trigger if not exists gym_pilot_assignment_set_updated_at
before update on public.gym_pilot_assignment
for each row execute function public.set_updated_at();

create trigger if not exists gym_pilot_class_attendance_set_updated_at
before update on public.gym_pilot_class_attendance
for each row execute function public.set_updated_at();

create trigger if not exists gym_pilot_user_session_set_updated_at
before update on public.gym_pilot_user_session
for each row execute function public.set_updated_at();

create trigger if not exists gym_pilot_user_session_workout_item_set_updated_at
before update on public.gym_pilot_user_session_workout_item
for each row execute function public.set_updated_at();

create trigger if not exists gym_pilot_app_setting_set_updated_at
before update on public.gym_pilot_app_setting
for each row execute function public.set_updated_at();
