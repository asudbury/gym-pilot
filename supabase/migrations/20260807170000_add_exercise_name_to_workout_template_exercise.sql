-- Add exercise_name to workout_template_exercise so templates snapshot exercise names
alter table public.workout_template_exercise
  add column if not exists exercise_name text;

-- No RLS change required; exercise_name is a client-side denormalisation for display
