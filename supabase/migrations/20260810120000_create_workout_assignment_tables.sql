create table if not exists public.workout_assignment (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assignment_name text not null,
  assigned_to_user_id uuid null references auth.users(id) on delete set null,
  allocated_by_user_id uuid null references auth.users(id) on delete set null,
  description text null,
  goal text null,
  notes text null,
  source_plan_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_assignment_session (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.workout_assignment(id) on delete cascade,
  name text not null,
  position integer not null default 1,
  goal text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_assignment_exercise (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.workout_assignment(id) on delete cascade,
  assignment_session_id uuid not null references public.workout_assignment_session(id) on delete cascade,
  exercise_id text not null,
  exercise_name text null,
  position integer not null default 1,
  reps text null,
  weight text null,
  notes text null,
  goal text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workout_assignment_user_id_idx on public.workout_assignment (user_id);
create index if not exists workout_assignment_assigned_to_user_id_idx on public.workout_assignment (assigned_to_user_id);
create index if not exists workout_assignment_allocated_by_user_id_idx on public.workout_assignment (allocated_by_user_id);
create index if not exists workout_assignment_session_assignment_id_idx on public.workout_assignment_session (assignment_id);
create index if not exists workout_assignment_exercise_assignment_id_idx on public.workout_assignment_exercise (assignment_id);
create index if not exists workout_assignment_exercise_session_id_idx on public.workout_assignment_exercise (assignment_session_id);

alter table public.workout_assignment enable row level security;
alter table public.workout_assignment_session enable row level security;
alter table public.workout_assignment_exercise enable row level security;

drop policy if exists workout_assignment_owner_policy on public.workout_assignment;
create policy workout_assignment_owner_policy on public.workout_assignment
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists workout_assignment_allocator_policy on public.workout_assignment;
create policy workout_assignment_allocator_policy on public.workout_assignment
  for select
  using (auth.uid() = allocated_by_user_id);

drop policy if exists workout_assignment_assignee_policy on public.workout_assignment;
create policy workout_assignment_assignee_policy on public.workout_assignment
  for select
  using (auth.uid() = assigned_to_user_id);

drop policy if exists workout_assignment_session_owner_policy on public.workout_assignment_session;
create policy workout_assignment_session_owner_policy on public.workout_assignment_session
  for all
  using (exists (
    select 1 from public.workout_assignment a where a.id = assignment_id and a.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.workout_assignment a where a.id = assignment_id and a.user_id = auth.uid()
  ));

drop policy if exists workout_assignment_exercise_owner_policy on public.workout_assignment_exercise;
create policy workout_assignment_exercise_owner_policy on public.workout_assignment_exercise
  for all
  using (exists (
    select 1 from public.workout_assignment a where a.id = assignment_id and a.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.workout_assignment a where a.id = assignment_id and a.user_id = auth.uid()
  ));
