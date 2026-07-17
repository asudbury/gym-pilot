-- Consolidated Gym Pilot schema
--
-- This migration replaces the previous split migrations and creates the
-- current production schema for:
--   - app state key/value storage
--   - plans
--   - assignments
--
-- The app uses local-first persistence for auth/session state and remote
-- Supabase persistence for user-scoped app state, favourites, and domain records.

create table if not exists public.gym_pilot_app_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  key text not null,
  value jsonb not null default '{}',
  updated_at timestamptz default now(),

  unique(user_id, key)
);

alter table public.gym_pilot_app_state enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'gym_pilot_app_state'
      and policyname = 'Users can manage their own app state'
  ) then
    create policy "Users can manage their own app state"
    on public.gym_pilot_app_state
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end
$$;

create unique index if not exists gym_pilot_app_state_user_id_key_idx
on public.gym_pilot_app_state (user_id, key);

create table if not exists public.gym_pilot_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  friendly_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gym_pilot_profiles_user_id_idx
on public.gym_pilot_profiles (user_id);

alter table public.gym_pilot_profiles enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'gym_pilot_profiles'
      and policyname = 'Users can manage their own profile'
  ) then
    create policy "Users can manage their own profile"
    on public.gym_pilot_profiles
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end
$$;

create table if not exists public.gym_pilot_favourite_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(user_id, name)
);

create index if not exists gym_pilot_favourite_folders_user_id_idx
on public.gym_pilot_favourite_folders (user_id);

alter table public.gym_pilot_favourite_folders enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'gym_pilot_favourite_folders'
      and policyname = 'Users can manage their own favourite folders'
  ) then
    create policy "Users can manage their own favourite folders"
    on public.gym_pilot_favourite_folders
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end
$$;

create table if not exists public.gym_pilot_favourites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  path text not null,
  label text not null,
  folder text,
  folder_id uuid references public.gym_pilot_favourite_folders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(user_id, path)
);

create index if not exists gym_pilot_favourites_user_id_idx
on public.gym_pilot_favourites (user_id);

alter table public.gym_pilot_favourites enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'gym_pilot_favourites'
      and policyname = 'Users can manage their own favourites'
  ) then
    create policy "Users can manage their own favourites"
    on public.gym_pilot_favourites
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end
$$;

create table if not exists public.gym_pilot_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  plan_name text not null,
  plan_slug text not null,
  plan_sessions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(user_id, plan_slug)
);

create index if not exists gym_pilot_plans_user_id_idx
on public.gym_pilot_plans (user_id);

create table if not exists public.gym_pilot_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  plan_id uuid references public.gym_pilot_plans(id) on delete cascade not null,
  assignment_name text not null,
  assigned_user_id uuid references auth.users(id) on delete set null,
  assigned_user_name text,
  completed_exercises jsonb not null default '{}'::jsonb,
  plan_items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gym_pilot_assignments_user_id_idx
on public.gym_pilot_assignments (user_id);

create index if not exists gym_pilot_assignments_plan_id_idx
on public.gym_pilot_assignments (plan_id);

create index if not exists gym_pilot_assignments_assigned_user_id_idx
on public.gym_pilot_assignments (assigned_user_id);

alter table public.gym_pilot_plans enable row level security;
alter table public.gym_pilot_assignments enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'gym_pilot_plans'
      and policyname = 'Users can manage their own plans'
  ) then
    create policy "Users can manage their own plans"
    on public.gym_pilot_plans
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'gym_pilot_assignments'
      and policyname = 'Users can manage their own assignments'
  ) then
    create policy "Users can manage their own assignments"
    on public.gym_pilot_assignments
    for all
    using (auth.uid() = user_id or auth.uid() = assigned_user_id)
    with check (auth.uid() = user_id or auth.uid() = assigned_user_id);
  end if;
end
$$;
