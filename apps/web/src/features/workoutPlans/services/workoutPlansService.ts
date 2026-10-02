import { getSupabaseClient, logger } from '@gym-pilot/shared'
import type { TablesInsert } from '@gym-pilot/shared/src/dataServices/databaseTypes'
import { TableNames } from '@gym-pilot/shared/src/dataServices/tableNames'
import {
  buildPersistedPlanRows,
  buildPlanSessionsFromRows,
} from '../../planBuilder/domain/workoutPlanState'
import type {
  PlanExerciseRow,
  PlanSessionRow,
  PlanSessionState,
} from '../../planBuilder/domain/workoutPlanState'

export type { PlanSessionState, PlanSessionRow, PlanExerciseRow }

/** Shape returned by `loadWorkoutPlan`. */
export type LoadedWorkoutPlan = {
  planName: string
  sessions: PlanSessionState[]
}

/**
 * Loads a workout plan with its sessions and exercises by plan id.
 */
export async function loadWorkoutPlan(id: string): Promise<{
  data: LoadedWorkoutPlan | null
  error: string | null
}> {
  const client = getSupabaseClient()
  if (!client) {
    return { data: null, error: 'Supabase client not available.' }
  }

  try {
    const { data: planData, error: planError } = await client
      .from(TableNames.WorkoutPlan)
      .select('id, plan_name')
      .eq('id', id)
      .maybeSingle()

    if (planError || !planData) {
      throw planError ?? new Error('Plan not found')
    }

    const { data: sessionsData, error: sessionsError } = await client
      .from(TableNames.WorkoutPlanSession)
      .select('id, plan_id, name, position, created_at, updated_at')
      .eq('plan_id', id)
      .order('position', { ascending: true })

    if (sessionsError) {
      throw sessionsError
    }

    const { data: exercisesData, error: exercisesError } = await client
      .from(TableNames.WorkoutPlanExercise)
      .select(
        'id, plan_id, session_id, exercise_id, exercise_name, position, created_at, updated_at',
      )
      .eq('plan_id', id)
      .order('position', { ascending: true })

    if (exercisesError) {
      throw exercisesError
    }

    return {
      data: {
        planName: planData.plan_name ?? '',
        sessions: buildPlanSessionsFromRows(
          (sessionsData ?? []) as PlanSessionRow[],
          (exercisesData ?? []) as PlanExerciseRow[],
        ),
      },
      error: null,
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to load plan for editing.'
    logger.error('[workoutPlansService] Error loading plan:', err)
    return { data: null, error: message }
  }
}

export type PersistPlanOptions = {
  planId: string | undefined
  planName: string
  isEditMode: boolean
  sessions: PlanSessionState[]
}

/**
 * Creates or updates a workout plan together with its sessions and exercises.
 * Returns the resolved plan id on success.
 */
export async function persistWorkoutPlan(
  options: PersistPlanOptions,
): Promise<{ planId: string | null; error: string | null }> {
  const { planId, planName, isEditMode, sessions } = options

  const client = getSupabaseClient()
  if (!client) {
    return { planId: null, error: 'Supabase client not available.' }
  }

  const { data: authData, error: authErr } = await client.auth.getUser()
  if (authErr || !authData?.user) {
    return {
      planId: null,
      error: 'Unable to determine current user for plan save.',
    }
  }

  const planNameValue = planName.trim()
  let resolvedPlanId = planId

  if (!isEditMode) {
    const { data: createdPlan, error: createPlanError } = await client
      .from(TableNames.WorkoutPlan)
      .insert({ user_id: authData.user.id, plan_name: planNameValue })
      .select('id')
      .maybeSingle()

    if (createPlanError || !createdPlan?.id) {
      return {
        planId: null,
        error: createPlanError?.message ?? 'Failed to create plan',
      }
    }

    resolvedPlanId = createdPlan.id
  } else if (resolvedPlanId) {
    const { error: updatePlanError } = await client
      .from(TableNames.WorkoutPlan)
      .update({ plan_name: planNameValue })
      .eq('id', resolvedPlanId)

    if (updatePlanError) {
      return { planId: null, error: updatePlanError.message }
    }
  }

  if (!resolvedPlanId) {
    return { planId: null, error: 'Unable to determine plan id for save.' }
  }

  if (isEditMode) {
    const { error: deleteSessionsError } = await client
      .from(TableNames.WorkoutPlanSession)
      .delete()
      .eq('plan_id', resolvedPlanId)

    if (deleteSessionsError) {
      return { planId: null, error: deleteSessionsError.message }
    }

    const { error: deleteExercisesError } = await client
      .from(TableNames.WorkoutPlanExercise)
      .delete()
      .eq('plan_id', resolvedPlanId)

    if (deleteExercisesError) {
      return { planId: null, error: deleteExercisesError.message }
    }
  }

  const { persistedSessions, persistedExercises } = buildPersistedPlanRows(
    sessions,
    resolvedPlanId,
  )

  const sessionsToInsert: TablesInsert<typeof TableNames.WorkoutPlanSession>[] =
    persistedSessions

  if (sessionsToInsert.length > 0) {
    const { error: insertSessionsError } = await client
      .from(TableNames.WorkoutPlanSession)
      .insert(sessionsToInsert)

    if (insertSessionsError) {
      return { planId: null, error: insertSessionsError.message }
    }
  }

  const exercisesToInsert: Array<
    TablesInsert<typeof TableNames.WorkoutPlanExercise> & {
      session_id?: string | null
    }
  > = persistedExercises

  if (exercisesToInsert.length > 0) {
    const { error: insertExercisesError } = await client
      .from(TableNames.WorkoutPlanExercise)
      .insert(exercisesToInsert)

    if (insertExercisesError) {
      return { planId: null, error: insertExercisesError.message }
    }
  }

  return { planId: resolvedPlanId, error: null }
}

/**
 * Deletes a workout plan and all its associated sessions and exercises.
 */
export async function deleteWorkoutPlan(
  id: string,
): Promise<{ error: string | null }> {
  const client = getSupabaseClient()
  if (!client) {
    return { error: 'Supabase client not available.' }
  }

  try {
    const { error: deleteExercisesError } = await client
      .from(TableNames.WorkoutPlanExercise)
      .delete()
      .eq('plan_id', id)

    if (deleteExercisesError) {
      return { error: deleteExercisesError.message }
    }

    const { error: deleteSessionsError } = await client
      .from(TableNames.WorkoutPlanSession)
      .delete()
      .eq('plan_id', id)

    if (deleteSessionsError) {
      return { error: deleteSessionsError.message }
    }

    const { error: deletePlanError } = await client
      .from(TableNames.WorkoutPlan)
      .delete()
      .eq('id', id)

    if (deletePlanError) {
      return { error: deletePlanError.message }
    }

    return { error: null }
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : 'An unexpected error occurred while deleting the plan.'
    logger.error('[workoutPlansService] Error deleting plan:', err)
    return { error: message }
  }
}

/**
 * Copies an existing workout plan (name gets " Copy" appended).
 * Returns the new plan's id on success.
 */
export async function copyWorkoutPlan(
  id: string,
  currentPlanName: string,
): Promise<{ newPlanId: string | null; error: string | null }> {
  const client = getSupabaseClient()
  if (!client) {
    return { newPlanId: null, error: 'Supabase client not available.' }
  }

  try {
    const { data: planData, error: planError } = await client
      .from(TableNames.WorkoutPlan)
      .select('id, plan_name')
      .eq('id', id)
      .maybeSingle()

    if (planError || !planData) {
      return {
        newPlanId: null,
        error: planError?.message ?? 'Could not load plan to copy.',
      }
    }

    const { data: sessionsData, error: sessionsError } = await client
      .from(TableNames.WorkoutPlanSession)
      .select('id, plan_id, name, position, created_at, updated_at')
      .eq('plan_id', id)
      .order('position', { ascending: true })

    if (sessionsError) {
      return { newPlanId: null, error: sessionsError.message }
    }

    const { data: exercisesData, error: exercisesError } = await client
      .from(TableNames.WorkoutPlanExercise)
      .select(
        'id, plan_id, session_id, exercise_id, exercise_name, position, created_at, updated_at',
      )
      .eq('plan_id', id)
      .order('position', { ascending: true })

    if (exercisesError) {
      return { newPlanId: null, error: exercisesError.message }
    }

    const { data: authData, error: authErr } = await client.auth.getUser()
    if (authErr || !authData?.user) {
      return {
        newPlanId: null,
        error: 'Unable to determine current user for plan copy.',
      }
    }

    const sourceName =
      currentPlanName.trim() || planData.plan_name || 'Workout Plan'
    const { data: newPlan, error: insertPlanError } = await client
      .from(TableNames.WorkoutPlan)
      .insert({ user_id: authData.user.id, plan_name: `${sourceName} Copy` })
      .select('id')
      .maybeSingle()

    if (insertPlanError || !newPlan?.id) {
      return {
        newPlanId: null,
        error: insertPlanError?.message ?? 'Could not create copied plan.',
      }
    }

    const sessionIdMap = new Map<string, string>()
    const copiedSessions: TablesInsert<typeof TableNames.WorkoutPlanSession>[] =
      (sessionsData ?? []).map((session) => {
        const newId = crypto.randomUUID()
        sessionIdMap.set(session.id, newId)
        return {
          id: newId,
          plan_id: newPlan.id,
          name: session.name,
          position: session.position,
        }
      })

    if (copiedSessions.length > 0) {
      const { error: insertSessionsError } = await client
        .from(TableNames.WorkoutPlanSession)
        .insert(copiedSessions)

      if (insertSessionsError) {
        await client.from(TableNames.WorkoutPlan).delete().eq('id', newPlan.id)
        return { newPlanId: null, error: insertSessionsError.message }
      }
    }

    const copiedExercises: TablesInsert<
      typeof TableNames.WorkoutPlanExercise
    >[] = (exercisesData ?? []).map((exercise) => ({
      id: crypto.randomUUID(),
      plan_id: newPlan.id,
      session_id: exercise.session_id
        ? (sessionIdMap.get(exercise.session_id) ?? null)
        : null,
      exercise_id: exercise.exercise_id,
      exercise_name: exercise.exercise_name ?? null,
      position: exercise.position,
    }))

    if (copiedExercises.length > 0) {
      const { error: insertExercisesError } = await client
        .from(TableNames.WorkoutPlanExercise)
        .insert(copiedExercises)

      if (insertExercisesError) {
        await client.from(TableNames.WorkoutPlan).delete().eq('id', newPlan.id)
        return { newPlanId: null, error: insertExercisesError.message }
      }
    }

    return { newPlanId: newPlan.id, error: null }
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : 'An unexpected error occurred while copying the plan.'
    logger.error('[workoutPlansService] Error copying plan:', err)
    return { newPlanId: null, error: message }
  }
}
