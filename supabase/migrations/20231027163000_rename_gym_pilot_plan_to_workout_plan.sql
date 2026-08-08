-- Up Migration
-- Rename the main table
ALTER TABLE public.gym_pilot_plan RENAME TO workout_plan;

-- Update foreign key constraints that reference the old table name
-- Based on your data-schema.md, the 'assignment' table has a 'plan_id'
-- that references the plan table.

-- First, rename the existing foreign key constraint for clarity
ALTER TABLE public.assignment 
RENAME CONSTRAINT gym_pilot_assignment_plan_id_fkey TO assignment_workout_plan_id_fkey;

-- Then, drop and re-add the foreign key constraint to point to the new table name
ALTER TABLE public.assignment 
DROP CONSTRAINT assignment_workout_plan_id_fkey,
ADD CONSTRAINT assignment_workout_plan_id_fkey
FOREIGN KEY (plan_id) REFERENCES public.workout_plan(id) ON DELETE CASCADE;

-- If there are other tables referencing gym_pilot_plan, you would add similar
-- ALTER TABLE statements here. For example, if 'favourite' had a plan_id:
-- ALTER TABLE public.favourite
-- RENAME CONSTRAINT favourite_plan_id_fkey TO favourite_workout_plan_id_fkey;
-- ALTER TABLE public.favourite
-- DROP CONSTRAINT favourite_workout_plan_id_fkey,
-- ADD CONSTRAINT favourite_workout_plan_id_fkey
-- FOREIGN KEY (plan_id) REFERENCES public.workout_plan(id) ON DELETE CASCADE;
-- If there are other tables referencing gym_pilot_plan, you would add similar
-- ALTER TABLE statements here. For example, if 'favourite' had a plan_id:
-- ALTER TABLE public.favourite
-- RENAME CONSTRAINT favourite_plan_id_fkey TO favourite_workout_plan_id_fkey;
-- ALTER TABLE public.favourite
-- DROP CONSTRAINT favourite_workout_plan_id_fkey,
-- ADD CONSTRAINT favourite_workout_plan_id_fkey
-- FOREIGN KEY (plan_id) REFERENCES public.workout_plan(id) ON DELETE CASCADE;