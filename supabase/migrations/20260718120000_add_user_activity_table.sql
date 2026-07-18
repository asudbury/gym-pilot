-- Add user activity logging table for tracking sign-ins and other events.

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
end
$$;
