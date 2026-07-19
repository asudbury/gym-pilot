-- Rebuild the app-owned public schema for the new role-based layout.
-- This migration is intentionally destructive for the public schema objects only.
-- Auth tables under auth.* are preserved.

create extension if not exists pgcrypto schema extensions;

set lock_timeout = '5s';
set deadlock_timeout = '5s';

do $$
declare
  backend_pid integer;
begin
  for backend_pid in
    select pid
    from pg_stat_activity
    where datname = current_database()
      and pid <> pg_backend_pid()
      and state <> 'idle'
  loop
    perform pg_terminate_backend(backend_pid);
  end loop;
end
$$;

drop table if exists public.gym_pilot_class_attendance cascade;
drop table if exists public.gym_pilot_user_activity cascade;
drop table if exists public.gym_pilot_assignment cascade;
drop table if exists public.gym_pilot_plan cascade;
drop table if exists public.gym_pilot_favourite cascade;
drop table if exists public.gym_pilot_favourite_folder cascade;
drop table if exists public.gym_pilot_profile cascade;
drop table if exists public.gym_pilot_user_role cascade;
drop table if exists public.gym_pilot_app_state cascade;

drop table if exists public.class_attendance cascade;
drop table if exists public.favorite cascade;
drop table if exists public.favorite_folder cascade;

do $$
begin
  if to_regclass('public.gym_pilot_app_state') is not null then
    drop policy if exists "Users can manage their own app state" on public.gym_pilot_app_state;
  end if;
  if to_regclass('public.gym_pilot_profile') is not null then
    drop policy if exists "Users can manage their own profile" on public.gym_pilot_profile;
    drop policy if exists "Admins can read all profiles" on public.gym_pilot_profile;
  end if;
  if to_regclass('public.gym_pilot_user_role') is not null then
    drop policy if exists "Users can manage their own roles" on public.gym_pilot_user_role;
    drop policy if exists "Admins can read all roles" on public.gym_pilot_user_role;
  end if;
  if to_regclass('public.gym_pilot_favourite_folder') is not null then
    drop policy if exists "Users can manage their own favourite folders" on public.gym_pilot_favourite_folder;
  end if;
  if to_regclass('public.gym_pilot_favourite') is not null then
    drop policy if exists "Users can manage their own favourites" on public.gym_pilot_favourite;
  end if;
  if to_regclass('public.gym_pilot_plan') is not null then
    drop policy if exists "Users can manage their own plans" on public.gym_pilot_plan;
  end if;
  if to_regclass('public.gym_pilot_assignment') is not null then
    drop policy if exists "Users can manage their own assignments" on public.gym_pilot_assignment;
    drop policy if exists "Assigned users can access their assignments" on public.gym_pilot_assignment;
    drop policy if exists "Assigned users can update their assignments" on public.gym_pilot_assignment;
    drop policy if exists "Admins and trainers can read all assignments" on public.gym_pilot_assignment;
  end if;
  if to_regclass('public.gym_pilot_user_activity') is not null then
    drop policy if exists "Users can manage their own activity" on public.gym_pilot_user_activity;
    drop policy if exists "Admins and trainers can read related activity" on public.gym_pilot_user_activity;
  end if;
  if to_regclass('public.gym_pilot_class_attendance') is not null then
    drop policy if exists class_attendance_select_own on public.gym_pilot_class_attendance;
    drop policy if exists class_attendance_insert_own on public.gym_pilot_class_attendance;
    drop policy if exists class_attendance_update_own on public.gym_pilot_class_attendance;
  end if;
end
$$;

drop function if exists public.set_updated_at() cascade;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

create table public.gym_pilot_app_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  unique(user_id, key)
);

alter table public.gym_pilot_app_state enable row level security;

create policy "Users can manage their own app state"
  on public.gym_pilot_app_state
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create unique index if not exists gym_pilot_app_state_user_id_key_idx
on public.gym_pilot_app_state (user_id, key);

create trigger set_updated_at
before update on public.gym_pilot_app_state
for each row execute function public.set_updated_at();

create table public.gym_pilot_profile (
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gym_pilot_user_role (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null constraint gym_pilot_user_role_role_check check (role in ('admin', 'trainer', 'client', 'guest')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, role)
);

create index if not exists gym_pilot_user_role_user_id_idx
on public.gym_pilot_user_role (user_id);

create index if not exists gym_pilot_user_role_role_idx
on public.gym_pilot_user_role (role);

create trigger set_updated_at
before update on public.gym_pilot_user_role
for each row execute function public.set_updated_at();

create index if not exists gym_pilot_profile_user_id_idx
on public.gym_pilot_profile (user_id);
create index if not exists gym_pilot_profile_trainer_id_idx
on public.gym_pilot_profile (trainer_id);
create index if not exists gym_pilot_profile_last_logged_in_at_idx
on public.gym_pilot_profile (last_logged_in_at desc);

create trigger set_updated_at
before update on public.gym_pilot_profile
for each row execute function public.set_updated_at();

alter table public.gym_pilot_profile enable row level security;

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

drop policy if exists "Users can manage their own profile" on public.gym_pilot_profile;
drop policy if exists "Admins can read all profiles" on public.gym_pilot_profile;

create policy "Users can manage their own profile"
  on public.gym_pilot_profile
  for all
  using (
    auth.uid() = user_id
    or public.user_has_role(auth.uid(), 'admin')
  )
  with check (
    auth.uid() = user_id
    or public.user_has_role(auth.uid(), 'admin')
  );

create policy "Admins can read all profiles"
  on public.gym_pilot_profile
  for select
  using (
    auth.uid() = user_id
    or public.user_has_role(auth.uid(), 'admin')
  );

alter table public.gym_pilot_user_role enable row level security;

drop policy if exists "Users can manage their own roles" on public.gym_pilot_user_role;
drop policy if exists "Admins can read all roles" on public.gym_pilot_user_role;

create policy "Users can manage their own roles"
  on public.gym_pilot_user_role
  for all
  using (
    auth.uid() = user_id
    or public.user_has_role(auth.uid(), 'admin')
  )
  with check (
    auth.uid() = user_id
    or public.user_has_role(auth.uid(), 'admin')
  );

create policy "Admins can read all roles"
  on public.gym_pilot_user_role
  for select
  using (
    auth.uid() = user_id
    or public.user_has_role(auth.uid(), 'admin')
  );

create table public.gym_pilot_favourite_folder (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, name)
);

create index if not exists gym_pilot_favourite_folder_user_id_idx
on public.gym_pilot_favourite_folder (user_id);

create trigger set_updated_at
before update on public.gym_pilot_favourite_folder
for each row execute function public.set_updated_at();

alter table public.gym_pilot_favourite_folder enable row level security;

create policy "Users can manage their own favourite folders"
  on public.gym_pilot_favourite_folder
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.gym_pilot_favourite (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  path text not null,
  label text not null,
  folder text,
  folder_id uuid references public.gym_pilot_favourite_folder(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, path)
);

create index if not exists gym_pilot_favourite_user_id_idx
on public.gym_pilot_favourite (user_id);

create index if not exists gym_pilot_favourite_folder_id_idx
on public.gym_pilot_favourite (folder_id);

create trigger set_updated_at
before update on public.gym_pilot_favourite
for each row execute function public.set_updated_at();

alter table public.gym_pilot_favourite enable row level security;

create policy "Users can manage their own favourites"
  on public.gym_pilot_favourite
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.gym_pilot_plan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  plan_name text not null,
  plan_slug text not null,
  plan_sessions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, plan_slug)
);

create index if not exists gym_pilot_plan_user_id_idx
on public.gym_pilot_plan (user_id);

create trigger set_updated_at
before update on public.gym_pilot_plan
for each row execute function public.set_updated_at();

alter table public.gym_pilot_plan enable row level security;

create policy "Users can manage their own plans"
  on public.gym_pilot_plan
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.gym_pilot_assignment (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  plan_id uuid references public.gym_pilot_plan(id) on delete cascade not null,
  assignment_name text not null,
  assigned_user_id uuid references auth.users(id) on delete set null,
  assigned_user_name text,
  completed_exercises jsonb not null default '{}'::jsonb,
  plan_items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gym_pilot_assignment_user_id_idx
on public.gym_pilot_assignment (user_id);
create index if not exists gym_pilot_assignment_plan_id_idx
on public.gym_pilot_assignment (plan_id);
create index if not exists gym_pilot_assignment_assigned_user_id_idx
on public.gym_pilot_assignment (assigned_user_id);

create trigger set_updated_at
before update on public.gym_pilot_assignment
for each row execute function public.set_updated_at();

alter table public.gym_pilot_assignment enable row level security;

create policy "Users can manage their own assignments"
  on public.gym_pilot_assignment
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Assigned users can access their assignments"
  on public.gym_pilot_assignment
  for select
  using (auth.uid() = assigned_user_id);

create policy "Assigned users can update their assignments"
  on public.gym_pilot_assignment
  for update
  using (auth.uid() = assigned_user_id)
  with check (auth.uid() = assigned_user_id);

create policy "Admins and trainers can read all assignments"
  on public.gym_pilot_assignment
  for select
  using (
    exists (
      select 1
      from public.gym_pilot_user_role as viewer_roles
      where viewer_roles.user_id = auth.uid()
        and viewer_roles.role = 'admin'
    )
    or exists (
      select 1
      from public.gym_pilot_user_role as viewer_roles
      where viewer_roles.user_id = auth.uid()
        and viewer_roles.role = 'trainer'
    )
  );

create table public.gym_pilot_user_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gym_pilot_user_activity_user_id_idx
on public.gym_pilot_user_activity (user_id);

create index if not exists gym_pilot_user_activity_created_at_idx
on public.gym_pilot_user_activity (created_at desc);

create trigger set_updated_at
before update on public.gym_pilot_user_activity
for each row execute function public.set_updated_at();

alter table public.gym_pilot_user_activity enable row level security;

create policy "Users can manage their own activity"
  on public.gym_pilot_user_activity
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins and trainers can read related activity"
  on public.gym_pilot_user_activity
  for select
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.gym_pilot_user_role as viewer_roles
      where viewer_roles.user_id = auth.uid()
        and viewer_roles.role = 'admin'
    )
    or exists (
      select 1
      from public.gym_pilot_user_role as viewer_roles
      where viewer_roles.user_id = auth.uid()
        and viewer_roles.role = 'trainer'
    )
    or exists (
      select 1
      from public.gym_pilot_profile as client_profile
      where client_profile.user_id = gym_pilot_user_activity.user_id
        and client_profile.trainer_id = auth.uid()
    )
  );

create table public.gym_pilot_class_attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  session_id text null,
  class_id text null,
  class_name text null,
  instructor_name text null,
  started_at timestamptz null,
  attendance_type text not null check (attendance_type in ('attended', 'taught')),
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
before update on public.gym_pilot_class_attendance
for each row execute function public.set_updated_at();

alter table public.gym_pilot_class_attendance enable row level security;

create policy class_attendance_select_own
  on public.gym_pilot_class_attendance
  for select
  using (auth.uid() = user_id);

create policy class_attendance_insert_own
  on public.gym_pilot_class_attendance
  for insert
  with check (auth.uid() = user_id);

create policy class_attendance_update_own
  on public.gym_pilot_class_attendance
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
