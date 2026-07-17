-- Consolidated favourite-based schema for Gym Pilot.
-- This migration is idempotent and can be applied to a fresh database or an
-- existing one that already has the earlier app-state and favourites tables.

create table if not exists public.gym_pilot_app_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  key text not null,
  value jsonb not null default '{}'::jsonb,
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
  must_change_password boolean not null default false,
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

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'gym_pilot_profiles'
      and policyname = 'Authenticated users can read all profiles'
  ) then
    create policy "Authenticated users can read all profiles"
    on public.gym_pilot_profiles
    for select
    using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'gym_pilot_profiles'
      and policyname = 'Authenticated users can insert profile rows'
  ) then
    create policy "Authenticated users can insert profile rows"
    on public.gym_pilot_profiles
    for insert
    with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'gym_pilot_profiles'
      and policyname = 'Authenticated users can update profile rows'
  ) then
    create policy "Authenticated users can update profile rows"
    on public.gym_pilot_profiles
    for update
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');
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

create index if not exists gym_pilot_favourites_folder_id_idx
on public.gym_pilot_favourites (folder_id);

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

alter table public.gym_pilot_plans enable row level security;

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

alter table public.gym_pilot_assignments enable row level security;

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

-- Legacy rename support for older databases that still have the american-spelling names.
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'gym_pilot_favorite_folders'
  )
  and not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'gym_pilot_favourite_folders'
  ) then
    alter table public.gym_pilot_favorite_folders rename to gym_pilot_favourite_folders;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'gym_pilot_favorites'
  )
  and not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'gym_pilot_favourites'
  ) then
    alter table public.gym_pilot_favorites rename to gym_pilot_favourites;
  end if;
end
$$;
