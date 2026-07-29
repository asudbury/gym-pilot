do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'gym_pilot_imported_workout'
      and policyname = 'Users can manage their own imported workouts'
  ) then
    create policy "Users can manage their own imported workouts"
    on public.gym_pilot_imported_workout
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end
$$;
