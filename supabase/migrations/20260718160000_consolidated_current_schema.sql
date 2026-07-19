-- Consolidated current Gym Pilot schema.
-- This is the canonical Supabase migration for the current singular-table schema.

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

create table if not exists public.gym_pilot_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  friendly_name text,
  must_change_password boolean not null default false,
  terms_accepted boolean not null default false,
  terms_accepted_at timestamptz,
  roles jsonb not null default '[]'::jsonb,
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

create index if not exists gym_pilot_profile_user_id_idx
on public.gym_pilot_profile (user_id);

create index if not exists gym_pilot_profile_last_logged_in_at_idx
on public.gym_pilot_profile (last_logged_in_at desc);

alter table public.gym_pilot_profile enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'gym_pilot_profile'
      and policyname = 'Users can manage their own profile'
  ) then
    create policy "Users can manage their own profile"
    on public.gym_pilot_profile
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'gym_pilot_profile'
      and policyname = 'Authenticated users can read all profiles'
  ) then
    create policy "Authenticated users can read all profiles"
    on public.gym_pilot_profile
    for select
    using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'gym_pilot_profile'
      and policyname = 'Authenticated users can insert profile rows'
  ) then
    create policy "Authenticated users can insert profile rows"
    on public.gym_pilot_profile
    for insert
    with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'gym_pilot_profile'
      and policyname = 'Authenticated users can update profile rows'
  ) then
    create policy "Authenticated users can update profile rows"
    on public.gym_pilot_profile
    for update
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');
  end if;
end
$$;

create table if not exists public.gym_pilot_favourite_folder (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(user_id, name)
);

create index if not exists gym_pilot_favourite_folder_user_id_idx
on public.gym_pilot_favourite_folder (user_id);

alter table public.gym_pilot_favourite_folder enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'gym_pilot_favourite_folder'
      and policyname = 'Users can manage their own favourite folders'
  ) then
    create policy "Users can manage their own favourite folders"
    on public.gym_pilot_favourite_folder
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end
$$;

create table if not exists public.gym_pilot_favourite (
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

alter table public.gym_pilot_favourite enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'gym_pilot_favourite'
      and policyname = 'Users can manage their own favourites'
  ) then
    create policy "Users can manage their own favourites"
    on public.gym_pilot_favourite
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end
$$;

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

create index if not exists gym_pilot_plan_user_id_idx
on public.gym_pilot_plan (user_id);

alter table public.gym_pilot_plan enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'gym_pilot_plan'
      and policyname = 'Users can manage their own plans'
  ) then
    create policy "Users can manage their own plans"
    on public.gym_pilot_plan
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end
$$;

create table if not exists public.gym_pilot_assignment (
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

alter table public.gym_pilot_assignment enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'gym_pilot_assignment'
      and policyname = 'Users can manage their own assignments'
  ) then
    create policy "Users can manage their own assignments"
    on public.gym_pilot_assignment
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
        from public.gym_pilot_profile as viewer_profile
        where viewer_profile.user_id = auth.uid()
          and exists (
            select 1
            from jsonb_array_elements_text(coalesce(viewer_profile.roles, '[]'::jsonb)) as role
            where role = 'admin'
          )
      )
      or exists (
        select 1
        from public.gym_pilot_profile as viewer_profile
        join public.gym_pilot_profile as client_profile
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

create table if not exists public.class_attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  session_id text null,
  class_id text null,
  class_name text null,
  instructor_name text null,
  started_at timestamptz null,
  attendance_type text not null check (attendance_type in ('attended', 'taught')),
  notes text null,
  created_at timestamptz not null default now()
);

alter table public.class_attendance enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'class_attendance'
      and policyname = 'class_attendance_select_own'
  ) then
    create policy class_attendance_select_own
      on public.class_attendance
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'class_attendance'
      and policyname = 'class_attendance_insert_own'
  ) then
    create policy class_attendance_insert_own
      on public.class_attendance
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'class_attendance'
      and policyname = 'class_attendance_update_own'
  ) then
    create policy class_attendance_update_own
      on public.class_attendance
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
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
      and table_name = 'gym_pilot_favourite_folder'
  )
  and not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'gym_pilot_favourite_folder'
  ) then
    alter table public.gym_pilot_favourite_folder rename to gym_pilot_favourite_folder;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'gym_pilot_favourite'
  )
  and not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'gym_pilot_favourite'
  ) then
    alter table public.gym_pilot_favourite rename to gym_pilot_favourite;
  end if;
end
$$;
