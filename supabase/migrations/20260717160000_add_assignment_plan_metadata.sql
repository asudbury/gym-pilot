alter table public.gym_pilot_assignments
  add column if not exists plan_name text;

alter table public.gym_pilot_assignments
  add column if not exists plan_slug text;
