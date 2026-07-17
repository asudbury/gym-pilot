create table public.gym_pilot_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  plan_name text not null,
  plan_slug text not null,
  plan_sessions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(user_id, plan_slug)
);

create index gym_pilot_plans_user_id_idx
on public.gym_pilot_plans (user_id);

create table public.gym_pilot_assignments (
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

create index gym_pilot_assignments_user_id_idx
on public.gym_pilot_assignments (user_id);

create index gym_pilot_assignments_plan_id_idx
on public.gym_pilot_assignments (plan_id);

create index gym_pilot_assignments_assigned_user_id_idx
on public.gym_pilot_assignments (assigned_user_id);

create table public.gym_pilot_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  category text,
  body_part text,
  equipment text,
  instructions jsonb not null default '{}'::jsonb,
  instruction_steps jsonb not null default '[]'::jsonb,
  muscle_group text,
  secondary_muscles jsonb not null default '[]'::jsonb,
  target text,
  image text,
  gif_url text,
  media_id text,
  attribution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(user_id, name)
);

create index gym_pilot_exercises_user_id_idx
on public.gym_pilot_exercises (user_id);

create table public.gym_pilot_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  assignment_id uuid references public.gym_pilot_assignments(id) on delete cascade not null,
  exercise_id uuid references public.gym_pilot_exercises(id) on delete cascade not null,
  progress_value text,
  notes text,
  completed_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(user_id, assignment_id, exercise_id)
);

create index gym_pilot_progress_user_id_idx
on public.gym_pilot_progress (user_id);

create index gym_pilot_progress_assignment_id_idx
on public.gym_pilot_progress (assignment_id);

create index gym_pilot_progress_exercise_id_idx
on public.gym_pilot_progress (exercise_id);

alter table public.gym_pilot_plans enable row level security;
alter table public.gym_pilot_assignments enable row level security;
alter table public.gym_pilot_exercises enable row level security;
alter table public.gym_pilot_progress enable row level security;

create policy "Users can manage their own plans"
on public.gym_pilot_plans
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage their own assignments"
on public.gym_pilot_assignments
for all
using (auth.uid() = user_id or auth.uid() = assigned_user_id)
with check (auth.uid() = user_id or auth.uid() = assigned_user_id);

create policy "Users can manage their own exercises"
on public.gym_pilot_exercises
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage their own progress"
on public.gym_pilot_progress
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
