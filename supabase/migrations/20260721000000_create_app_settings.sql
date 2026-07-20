create table if not exists public.gym_pilot_app_setting (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value jsonb not null default 'null'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.gym_pilot_app_setting enable row level security;

create policy "Authenticated users can read app settings"
  on public.gym_pilot_app_setting
  for select
  using (auth.uid() is not null);

create policy "Admins can manage app settings"
  on public.gym_pilot_app_setting
  for all
  using (public.user_has_role(auth.uid(), 'admin'))
  with check (public.user_has_role(auth.uid(), 'admin'));

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists gym_pilot_app_setting_set_updated_at on public.gym_pilot_app_setting;
create trigger gym_pilot_app_setting_set_updated_at
before update on public.gym_pilot_app_setting
for each row execute function public.set_updated_at();
