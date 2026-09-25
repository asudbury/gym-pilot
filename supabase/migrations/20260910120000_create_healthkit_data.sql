create extension if not exists pgcrypto;

create table if not exists public.healthkit_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  device text null,
  recorded_at timestamptz not null,
  steps text null,
  heart_rate text null,
  active_energy text null,
  created_at timestamptz not null default now()
);

alter table public.healthkit_data enable row level security;

create policy if not exists "authenticated users can insert their own healthkit data"
  on public.healthkit_data
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy if not exists "authenticated users can read their own healthkit data"
  on public.healthkit_data
  for select
  to authenticated
  using (auth.uid() = user_id);
