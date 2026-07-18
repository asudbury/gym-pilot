-- Allow admins and trainers to read activity rows for their clients.

alter table public.gym_pilot_user_activity enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'gym_pilot_user_activity'
      and policyname = 'Admins and trainers can read related activity'
  ) then
    create policy "Admins and trainers can read related activity"
    on public.gym_pilot_user_activity
    for select
    using (
      auth.uid() = user_id
      or exists (
        select 1
        from public.gym_pilot_profiles as viewer_profile
        where viewer_profile.user_id = auth.uid()
          and exists (
            select 1
            from jsonb_array_elements_text(coalesce(viewer_profile.roles, '[]'::jsonb)) as role
            where role = 'admin'
          )
      )
      or exists (
        select 1
        from public.gym_pilot_profiles as viewer_profile
        join public.gym_pilot_profiles as client_profile
          on client_profile.user_id = gym_pilot_user_activity.user_id
        where viewer_profile.user_id = auth.uid()
          and client_profile.trainer_id = auth.uid()
          and exists (
            select 1
            from jsonb_array_elements_text(coalesce(viewer_profile.roles, '[]'::jsonb)) as role
            where role = 'trainer'
          )
      )
    );
  end if;
end
$$;
