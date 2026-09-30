import type { Exercise, WorkoutTemplate, WorkoutTemplateExercise } from '@gym-pilot/shared'
import { getSupabaseClient, logger } from '@gym-pilot/shared'
import type { TablesInsert } from '@gym-pilot/shared/src/dataServices/databaseTypes'
import { TableNames } from '@gym-pilot/shared/src/dataServices/tableNames'
import { formatLabel } from '../../../utils/formatUtils'

export type WorkoutTemplateWithExercises = WorkoutTemplate & {
  workout_template_exercise: WorkoutTemplateExercise[]
}

/**
 * Loads all workout templates (with their exercises) for the current user,
 * ordered by most recently created.
 */
export async function loadWorkoutTemplates(): Promise<{
  data: WorkoutTemplateWithExercises[]
  error: string | null
}> {
  const client = getSupabaseClient()
  if (!client) {
    return { data: [], error: 'Supabase client not available.' }
  }

  const { data, error } = await client
    .from(TableNames.WorkoutTemplate)
    .select('*, workout_template_exercise(*)')
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('[workoutTemplatesService] Could not load workout templates', error)
    return { data: [], error: error.message }
  }

  return { data: Array.isArray(data) ? (data as WorkoutTemplateWithExercises[]) : [], error: null }
}

/**
 * Loads a single workout template by id, including its exercises sorted by position.
 */
export async function loadWorkoutTemplate(id: string): Promise<{
  data: WorkoutTemplateWithExercises | null
  error: string | null
}> {
  const client = getSupabaseClient()
  if (!client) {
    return { data: null, error: 'Supabase client not available.' }
  }

  const { data, error } = await client
    .from(TableNames.WorkoutTemplate)
    .select('*, workout_template_exercise(*)')
    .eq('id', id)
    .single()

  if (error) {
    logger.error('[workoutTemplatesService] Could not load template', error)
    return { data: null, error: error.message }
  }

  const sortedExercises = Array.isArray(data.workout_template_exercise)
    ? [...data.workout_template_exercise].sort(
        (a: WorkoutTemplateExercise, b: WorkoutTemplateExercise) =>
          (a.position ?? 0) - (b.position ?? 0),
      )
    : []

  return {
    data: { ...data, workout_template_exercise: sortedExercises } as WorkoutTemplateWithExercises,
    error: null,
  }
}

/**
 * Updates a template's name and description, and persists the current exercise positions.
 */
export async function saveWorkoutTemplate(
  id: string,
  name: string,
  description: string,
  exercises: WorkoutTemplateExercise[],
): Promise<{ error: string | null }> {
  const client = getSupabaseClient()
  if (!client) {
    return { error: 'Supabase client not available.' }
  }

  const { error: updateError } = await client
    .from(TableNames.WorkoutTemplate)
    .update({ name, description: description || null })
    .eq('id', id)

  if (updateError) {
    return { error: updateError.message }
  }

  try {
    await Promise.all(
      exercises.map((row, idx) => {
        if (!row.id) return Promise.resolve(null)
        return client
          .from(TableNames.WorkoutTemplateExercise)
          .update({ position: idx })
          .eq('id', row.id)
      }),
    )
  } catch (posErr) {
    logger.warn('[workoutTemplatesService] Could not persist exercise positions', posErr)
  }

  return { error: null }
}

/**
 * Deletes a workout template by id.
 */
export async function deleteWorkoutTemplate(id: string): Promise<{ error: string | null }> {
  const client = getSupabaseClient()
  if (!client) {
    return { error: 'Supabase client not available.' }
  }

  const { error } = await client
    .from(TableNames.WorkoutTemplate)
    .delete()
    .eq('id', id)

  return { error: error?.message ?? null }
}

/**
 * Creates a copy of an existing workout template (name gets " Copy" appended).
 * Returns the new template's id on success.
 */
export async function copyWorkoutTemplate(id: string): Promise<{
  newTemplateId: string | null
  error: string | null
}> {
  const client = getSupabaseClient()
  if (!client) {
    return { newTemplateId: null, error: 'Supabase client not available.' }
  }

  const { data, error } = await client
    .from(TableNames.WorkoutTemplate)
    .select('*, workout_template_exercise(*)')
    .eq('id', id)
    .single()

  if (error || !data) {
    return { newTemplateId: null, error: error?.message ?? 'Could not copy template' }
  }

  const { data: authData, error: authErr } = await client.auth.getUser()
  if (authErr || !authData?.user) {
    return { newTemplateId: null, error: 'Unable to determine current user for template copy' }
  }

  const { data: newTemplate, error: insertError } = await client
    .from(TableNames.WorkoutTemplate)
    .insert({
      name: `${data.name} Copy`,
      description: data.description,
      user_id: authData.user.id,
    })
    .select()
    .single()

  if (insertError || !newTemplate) {
    return { newTemplateId: null, error: insertError?.message ?? 'Could not copy template' }
  }

  if (data.workout_template_exercise?.length) {
    const exerciseRows = (data.workout_template_exercise as WorkoutTemplateExercise[]).map(
      (ex, idx) => ({
        template_id: newTemplate.id,
        exercise_id: ex.exercise_id,
        exercise_name: ex.exercise_name,
        position: idx,
      }),
    )
    const { error: exerciseError } = await client
      .from(TableNames.WorkoutTemplateExercise)
      .insert(exerciseRows)
    if (exerciseError) {
      // Clean up the orphaned template record before returning the error
      await client.from(TableNames.WorkoutTemplate).delete().eq('id', newTemplate.id)
      return { newTemplateId: null, error: exerciseError.message }
    }
  }

  return { newTemplateId: newTemplate.id, error: null }
}

/**
 * Removes a single exercise row from a template.
 */
export async function removeTemplateExercise(rowId: string): Promise<{ error: string | null }> {
  const client = getSupabaseClient()
  if (!client) {
    return { error: 'Supabase client not available.' }
  }

  const { error } = await client
    .from(TableNames.WorkoutTemplateExercise)
    .delete()
    .eq('id', rowId)

  return { error: error?.message ?? null }
}

/**
 * Appends new exercises to a template, starting positions after the current last exercise.
 */
export async function addExercisesToTemplate(
  templateId: string,
  exercises: Exercise[],
  startIndex: number,
): Promise<{ error: string | null }> {
  const client = getSupabaseClient()
  if (!client) {
    return { error: 'Supabase client not available.' }
  }

  const rows: TablesInsert<typeof TableNames.WorkoutTemplateExercise>[] = exercises.map(
    (ex, idx) => ({
      template_id: templateId,
      exercise_id: ex.id,
      exercise_name: formatLabel(ex.name) || null,
      position: startIndex + idx,
    }),
  )

  const { error } = await client.from(TableNames.WorkoutTemplateExercise).insert(rows)

  return { error: error?.message ?? null }
}

/**
 * Creates a new workout template with the given exercises.
 * Returns the new template's id on success.
 */
export async function createWorkoutTemplate(
  name: string,
  description: string | null,
  exercises: { id: string; name: string }[],
): Promise<{ templateId: string | null; error: string | null }> {
  const client = getSupabaseClient()
  if (!client) {
    return { templateId: null, error: 'Supabase client not available.' }
  }

  const { data: authData, error: authErr } = await client.auth.getUser()
  if (authErr || !authData?.user) {
    logger.error('[workoutTemplatesService] Unable to determine current user for template save', authErr)
    return { templateId: null, error: 'Unable to determine current user for template save' }
  }

  const { data: insertedTemplate, error: insertError } = await client
    .from(TableNames.WorkoutTemplate)
    .insert({
      name,
      description: description || null,
      metadata: {},
      user_id: authData.user.id,
    })
    .select('*')
    .single()

  if (insertError || !insertedTemplate) {
    return { templateId: null, error: insertError?.message ?? 'Error inserting template' }
  }

  const exerciseRows: TablesInsert<typeof TableNames.WorkoutTemplateExercise>[] = exercises.map(
    (ex, idx) => ({
      template_id: insertedTemplate.id,
      exercise_id: ex.id,
      position: idx,
      exercise_name: formatLabel(ex.name) || null,
    }),
  )

  const { error: exInsertErr } = await client
    .from(TableNames.WorkoutTemplateExercise)
    .insert(exerciseRows)

  if (exInsertErr) {
    // Clean up the orphaned template record before returning the error
    await client.from(TableNames.WorkoutTemplate).delete().eq('id', insertedTemplate.id)
    return { templateId: null, error: exInsertErr.message }
  }

  return { templateId: insertedTemplate.id, error: null }
}
