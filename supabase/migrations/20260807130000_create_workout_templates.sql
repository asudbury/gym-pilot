-- Create workout templates and related exercises
create table if not exists public.workout_template (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workout_template enable row level security;

create index if not exists workout_template_user_id_idx
on public.workout_template (user_id);

drop trigger if exists set_updated_at on public.workout_template;
create trigger set_updated_at
before update on public.workout_template
for each row execute function public.set_updated_at();

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'workout_template'
      and policyname = 'Users can manage their own workout templates'
  ) then
    create policy "Users can manage their own workout templates"
      on public.workout_template
      for all
      using (auth.uid() = user_id or public.user_has_role(auth.uid(), 'admin'))
      with check (auth.uid() = user_id or public.user_has_role(auth.uid(), 'admin'));
  end if;
end
$$;

create table if not exists public.workout_template_exercise (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.workout_template(id) on delete cascade not null,
  exercise_id uuid not null,
  position integer not null default 0,
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.workout_template_exercise enable row level security;

create index if not exists workout_template_exercise_template_id_idx
on public.workout_template_exercise (template_id);

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'workout_template_exercise'
      and policyname = 'Users can see exercises for their templates'
  ) then
    create policy "Users can see exercises for their templates"
      on public.workout_template_exercise
      for select
      using (
        exists (
          select 1 from public.workout_template wt where wt.id = template_id and (auth.uid() = wt.user_id or public.user_has_role(auth.uid(), 'admin'))
        )
      );
  end if;
end
$$;
