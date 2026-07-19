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
end $$;
