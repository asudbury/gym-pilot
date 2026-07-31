alter table public.gym_pilot_imported_workout
add column if not exists session_id text;

create index if not exists gym_pilot_imported_workout_session_id_idx
on public.gym_pilot_imported_workout (session_id);
