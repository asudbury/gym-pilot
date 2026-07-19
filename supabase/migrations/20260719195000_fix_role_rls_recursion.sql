-- Fix recursive RLS checks for role-based access.
-- This migration replaces the self-referential role policies with a helper
-- function that is safe for RLS evaluation.

create or replace function public.user_has_role(p_user_id uuid, p_role text)
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.gym_pilot_user_role as role_rows
    where role_rows.user_id = p_user_id
      and role_rows.role = p_role
  );
$$;

grant execute on function public.user_has_role(uuid, text) to authenticated;

drop policy if exists "Users can manage their own profile" on public.gym_pilot_profile;
drop policy if exists "Admins can read all profiles" on public.gym_pilot_profile;

drop policy if exists "Users can manage their own roles" on public.gym_pilot_user_role;
drop policy if exists "Admins can read all roles" on public.gym_pilot_user_role;

alter table public.gym_pilot_profile enable row level security;
alter table public.gym_pilot_user_role enable row level security;

create policy "Users can manage their own profile"
  on public.gym_pilot_profile
  for all
  using (
    auth.uid() = user_id
    or public.user_has_role(auth.uid(), 'admin')
  )
  with check (
    auth.uid() = user_id
    or public.user_has_role(auth.uid(), 'admin')
  );

create policy "Admins can read all profiles"
  on public.gym_pilot_profile
  for select
  using (
    auth.uid() = user_id
    or public.user_has_role(auth.uid(), 'admin')
  );

create policy "Users can manage their own roles"
  on public.gym_pilot_user_role
  for all
  using (
    auth.uid() = user_id
    or public.user_has_role(auth.uid(), 'admin')
  )
  with check (
    auth.uid() = user_id
    or public.user_has_role(auth.uid(), 'admin')
  );

create policy "Admins can read all roles"
  on public.gym_pilot_user_role
  for select
  using (
    auth.uid() = user_id
    or public.user_has_role(auth.uid(), 'admin')
  );
