-- Allow users to insert workout_template_exercise rows only for templates they own
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'workout_template_exercise'
      and policyname = 'Users can insert exercises for their templates'
  ) then
    create policy "Users can insert exercises for their templates"
      on public.workout_template_exercise
      for insert
      with check (
        exists (
          select 1 from public.workout_template wt
          where wt.id = template_id
            and (auth.uid() = wt.user_id or public.user_has_role(auth.uid(), 'admin'))
        )
      );
  end if;
end
$$;
