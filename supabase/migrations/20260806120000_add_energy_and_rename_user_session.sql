-- Add energy columns to user session and rename table to user_workout

-- Add nullable energy columns matching imported_workout
alter table if exists public.gym_pilot_user_session
  add column if not exists energy double precision;

alter table if exists public.gym_pilot_user_session
  add column if not exists energy_unit text;

-- Rename the session table to a clearer name
alter table if exists public.gym_pilot_user_session
  rename to user_workout;

-- Update the workout item foreign key to reference the renamed table
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'gym_pilot_user_session_workout_item_session_row_id_fkey'
  ) then
    alter table if exists public.gym_pilot_user_session_workout_item
      drop constraint gym_pilot_user_session_workout_item_session_row_id_fkey;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'gym_pilot_user_session_workout_item_session_row_id_fkey'
  ) then
    alter table if exists public.gym_pilot_user_session_workout_item
      add constraint gym_pilot_user_session_workout_item_session_row_id_fkey
      foreign key (session_row_id) references public.user_workout(id)
      on delete cascade;
  end if;
end $$;
