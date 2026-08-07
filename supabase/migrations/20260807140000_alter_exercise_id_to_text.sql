-- Change workout_template_exercise.exercise_id from uuid to text to match exercise catalog ids
ALTER TABLE public.workout_template_exercise
  ALTER COLUMN exercise_id TYPE text USING exercise_id::text;

-- No change to RLS; exercise_id is a reference to a catalog key, not a foreign key.
