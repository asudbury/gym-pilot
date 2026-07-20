create table if not exists public.gym_pilot_error_log (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.gym_pilot_audit_log (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table public.gym_pilot_error_log enable row level security;
alter table public.gym_pilot_audit_log enable row level security;

create policy "Authenticated users can read error logs"
  on public.gym_pilot_error_log
  for select
  using (auth.uid() is not null);

create policy "Authenticated users can read audit logs"
  on public.gym_pilot_audit_log
  for select
  using (auth.uid() is not null);

create policy "Admins can manage error logs"
  on public.gym_pilot_error_log
  for all
  using (public.user_has_role(auth.uid(), 'admin'))
  with check (public.user_has_role(auth.uid(), 'admin'));

create policy "Admins can manage audit logs"
  on public.gym_pilot_audit_log
  for all
  using (public.user_has_role(auth.uid(), 'admin'))
  with check (public.user_has_role(auth.uid(), 'admin'));
