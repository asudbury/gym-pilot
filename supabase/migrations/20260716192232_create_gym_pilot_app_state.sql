create table public.gym_pilot_app_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  key text not null,
  value jsonb not null default '{}',
  updated_at timestamptz default now(),

  unique(user_id, key)
);

alter table public.gym_pilot_app_state enable row level security;

create policy "Users can manage their own app state"
on public.gym_pilot_app_state
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);