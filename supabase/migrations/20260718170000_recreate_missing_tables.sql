-- Recreate the core Gym Pilot tables if they were removed manually from the remote database.
create extension if not exists pgcrypto;

create table if not exists public.gym_pilot_app_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  unique(user_id, key)
);

alter table public.gym_pilot_app_state enable row level security;

create unique index if not exists gym_pilot_app_state_user_id_key_idx
on public.gym_pilot_app_state (user_id, key);

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

create table if not exists public.gym_pilot_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  friendly_name text,
  must_change_password boolean not null default false,
  roles jsonb not null default '[]'::jsonb,
  trainer_id uuid,
  application_name text,
  gym_brand text,
  gym_name text,
  gym_club_id bigint,
  account_tier text not null default 'free' constraint gym_pilot_profiles_account_tier_check check (account_tier in ('free', 'bronze', 'silver', 'gold')),
  access_ends_at timestamptz,
  is_frozen boolean not null default false,
  last_logged_in_at timestamptz,
  previous_last_logged_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gym_pilot_profiles_user_id_idx
on public.gym_pilot_profiles (user_id);

create index if not exists gym_pilot_profiles_last_logged_in_at_idx
on public.gym_pilot_profiles (last_logged_in_at desc);

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

create table if not exists public.gym_pilot_user_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists gym_pilot_user_activity_user_id_idx
on public.gym_pilot_user_activity (user_id);

create index if not exists gym_pilot_user_activity_created_at_idx
on public.gym_pilot_user_activity (created_at desc);

alter table public.gym_pilot_user_activity enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'gym_pilot_user_activity'
      and policyname = 'Users can manage their own activity'
  ) then
    create policy "Users can manage their own activity"
    on public.gym_pilot_user_activity
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'gym_pilot_user_activity'
      and policyname = 'Admins and trainers can read related activity'
  ) then
    create policy "Admins and trainers can read related activity"
    on public.gym_pilot_user_activity
    for select
    using (
      auth.uid() = user_id
      or exists (
        select 1
        from public.gym_pilot_profiles as viewer_profile
        where viewer_profile.user_id = auth.uid()
          and exists (
            select 1
            from jsonb_array_elements_text(coalesce(viewer_profile.roles, '[]'::jsonb)) as role
            where role = 'admin'
          )
      )
      or exists (
        select 1
        from public.gym_pilot_profiles as viewer_profile
        join public.gym_pilot_profiles as client_profile
          on client_profile.user_id = gym_pilot_user_activity.user_id
        where viewer_profile.user_id = auth.uid()
          and client_profile.trainer_id = auth.uid()
          and exists (
            select 1
            from jsonb_array_elements_text(coalesce(viewer_profile.roles, '[]'::jsonb)) as role
            where role = 'trainer'
          )
      )
    );
  end if;
end
$$;
