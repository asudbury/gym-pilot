-- Reintroduce optional attendance rating for timetable history.

alter table public.gym_pilot_class_attendance
  add column if not exists rating smallint;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gym_pilot_class_attendance_rating_check'
      and conrelid = 'public.gym_pilot_class_attendance'::regclass
  ) then
    alter table public.gym_pilot_class_attendance
      add constraint gym_pilot_class_attendance_rating_check
      check (rating is null or rating between 1 and 5);
  end if;
end
$$;
