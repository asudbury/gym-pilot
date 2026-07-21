import { getSupabaseClient } from './supabase'
import { logger } from './logging'
import { getAuthenticatedUserId } from './supabaseAuth'
import {
  createSessionWorkoutItem,
  normalizeSessionWorkoutCategory,
  type SessionWorkoutItem,
} from './sessionWorkout'

function normalizeWorkoutItemRecord(value: unknown): SessionWorkoutItem | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Record<string, unknown>
  const category = typeof candidate.category === 'string'
    ? normalizeSessionWorkoutCategory(candidate.category)
    : 'exercise'
  const exerciseName = typeof candidate.exerciseName === 'string'
    ? candidate.exerciseName
    : ''

  if (!exerciseName && typeof candidate.exercise_name === 'string') {
    return createSessionWorkoutItem({
      category,
      exerciseName: candidate.exercise_name,
      exerciseId: typeof candidate.exercise_id === 'string' ? candidate.exercise_id : undefined,
      reps: typeof candidate.reps === 'string' ? candidate.reps : '',
      sets: typeof candidate.sets === 'string' ? candidate.sets : '',
      weight: typeof candidate.weight === 'string' ? candidate.weight : '',
      durationMinutes: typeof candidate.duration_minutes === 'string' ? candidate.duration_minutes : '',
      distanceKm: typeof candidate.distance_km === 'string' ? candidate.distance_km : '',
      speedKph: typeof candidate.speed_kph === 'string' ? candidate.speed_kph : '',
      notes: typeof candidate.notes === 'string' ? candidate.notes : '',
      planItemId: typeof candidate.plan_item_id === 'string' ? candidate.plan_item_id : undefined,
      sortOrder: typeof candidate.sort_order === 'number'
        ? candidate.sort_order
        : typeof candidate.sortOrder === 'number'
          ? candidate.sortOrder
          : undefined,
    })
  }

  return createSessionWorkoutItem({
    id: typeof candidate.id === 'string' ? candidate.id : undefined,
    category,
    exerciseName,
    exerciseId: typeof candidate.exercise_id === 'string' ? candidate.exercise_id : undefined,
    reps: typeof candidate.reps === 'string' ? candidate.reps : '',
    sets: typeof candidate.sets === 'string' ? candidate.sets : '',
    weight: typeof candidate.weight === 'string' ? candidate.weight : '',
    durationMinutes: typeof candidate.durationMinutes === 'string' ? candidate.durationMinutes : '',
    distanceKm: typeof candidate.distanceKm === 'string' ? candidate.distanceKm : '',
    speedKph: typeof candidate.speedKph === 'string' ? candidate.speedKph : '',
    notes: typeof candidate.notes === 'string' ? candidate.notes : '',
    planItemId: typeof candidate.planItemId === 'string' ? candidate.planItemId : undefined,
    sortOrder: typeof candidate.sortOrder === 'number'
      ? candidate.sortOrder
      : typeof candidate.sort_order === 'number'
        ? candidate.sort_order
        : undefined,
  })
}

function createWorkoutItemPayload(input: {
  sessionId: string
  userId: string
  index: number
  item: SessionWorkoutItem
}) {
  return {
    id: input.item.id || `item-${input.index}`,
    session_id: input.sessionId,
    user_id: input.userId,
    item_index: input.index,
    category: input.item.category,
    exercise_name: input.item.exerciseName ?? null,
    exercise_id: input.item.exerciseId ?? null,
    reps: input.item.reps ?? null,
    sets: input.item.sets ?? null,
    weight: input.item.weight ?? null,
    duration_minutes: input.item.durationMinutes ?? null,
    distance_km: input.item.distanceKm ?? null,
    speed_kph: input.item.speedKph ?? null,
    notes: input.item.notes ?? null,
    plan_item_id: input.item.planItemId ?? null,
    sort_order: input.item.sortOrder ?? input.index,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export function buildWorkoutItemsPersistencePayloads(input: {
  sessionId: string
  userId: string
  workoutItems: SessionWorkoutItem[]
}) {
  const normalizedItems = input.workoutItems.map((item, index) => ({
    ...item,
    id: item.id || `item-${index}`,
    sortOrder: item.sortOrder ?? index,
  }))

  return normalizedItems.map((item, index) => createWorkoutItemPayload({
    sessionId: input.sessionId,
    userId: input.userId,
    index,
    item: {
      ...item,
      sortOrder: index,
    },
  }))
}

export function getWorkoutItemsTableName() {
  return 'gym_pilot_user_session_workout_item'
}

export async function loadWorkoutItemsForSession(sessionId: string, userId?: string): Promise<SessionWorkoutItem[]> {
  const client = getSupabaseClient()
  if (!client) {
    return []
  }

  const resolvedUserId = userId || await getAuthenticatedUserId(client)
  if (!resolvedUserId) {
    return []
  }

  const { data, error } = await client
    .from(getWorkoutItemsTableName())
    .select('*')
    .eq('session_id', sessionId)
    .eq('user_id', resolvedUserId)
    .order('sort_order', { ascending: true })
    .order('item_index', { ascending: true })

  if (error) {
    logger.warn('[Supabase] Could not load workout rows', error)
    return []
  }

  return (Array.isArray(data) ? data : []).map((row) => normalizeWorkoutItemRecord(row)).filter((entry): entry is SessionWorkoutItem => Boolean(entry))
}

export async function saveWorkoutItemsForSession(sessionId: string, workoutItems: SessionWorkoutItem[], userId?: string) {
  const client = getSupabaseClient()
  if (!client) {
    return { success: false as const, error: new Error('Supabase client is not available') }
  }

  const resolvedUserId = userId || await getAuthenticatedUserId(client)
  if (!resolvedUserId) {
    return { success: false as const, error: new Error('Unable to resolve the authenticated user for workout persistence') }
  }

  const existingRows = await loadWorkoutItemsForSession(sessionId, resolvedUserId)
  const existingIds = new Set(existingRows.map((item) => item.id))

  const payload = buildWorkoutItemsPersistencePayloads({
    sessionId,
    userId: resolvedUserId,
    workoutItems,
  })

  if (payload.length === 0) {
    const { error } = await client
      .from(getWorkoutItemsTableName())
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', resolvedUserId)

    return error
      ? { success: false as const, error }
      : { success: true as const }
  }

  const { error } = await client
    .from(getWorkoutItemsTableName())
    .upsert(payload, { onConflict: 'id' })

  if (error) {
    logger.warn('[Supabase] Could not save workout rows', error)
    return { success: false as const, error }
  }

  const staleIds = Array.from(existingIds).filter((id) => !workoutItems.some((item) => item.id === id))
  if (staleIds.length > 0) {
    await client
      .from(getWorkoutItemsTableName())
      .delete()
      .in('id', staleIds)
  }

  return { success: true as const }
}
