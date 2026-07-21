import type { PlanSession } from '@gym-pilot/types'

export type SessionWorkoutCategory =
  | 'exercise'
  | 'warm_up'
  | 'stretch'
  | 'cool_down'
  | 'run'
  | 'spin'

export type SessionWorkoutItem = {
  id: string
  category: SessionWorkoutCategory
  exerciseName: string
  exerciseId?: string
  reps?: string
  sets?: string
  weight?: string
  durationMinutes?: string
  distanceKm?: string
  speedKph?: string
  notes?: string
  planItemId?: string
  sortOrder?: number
}

export type SessionWorkoutMetadata = {
  workoutItems: SessionWorkoutItem[]
  endedAt?: string | null
  activeKwh?: string | null
  selectedPlanId?: string | null
  selectedPlanName?: string | null
}

function createWorkoutItemId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`
}

export function normalizeSessionWorkoutCategory(
  value: string | null | undefined,
): SessionWorkoutCategory {
  const normalizedValue = value?.trim().toLowerCase()

  switch (normalizedValue) {
    case 'warm_up':
    case 'warmup':
      return 'warm_up'
    case 'stretch':
      return 'stretch'
    case 'cool_down':
    case 'cooldown':
      return 'cool_down'
    case 'run':
      return 'run'
    case 'spin':
      return 'spin'
    default:
      return 'exercise'
  }
}

export function createSessionWorkoutItem(
  input: Partial<SessionWorkoutItem> & Pick<SessionWorkoutItem, 'category' | 'exerciseName'>,
): SessionWorkoutItem {
  return {
    id: input.id ?? createWorkoutItemId(),
    category: normalizeSessionWorkoutCategory(input.category),
    exerciseName: input.exerciseName ?? '',
    exerciseId: input.exerciseId,
    reps: input.reps ?? '',
    sets: input.sets ?? '',
    weight: input.weight ?? '',
    durationMinutes: input.durationMinutes ?? '',
    distanceKm: input.distanceKm ?? '',
    speedKph: input.speedKph ?? '',
    notes: input.notes ?? '',
    planItemId: input.planItemId,
    sortOrder: input.sortOrder,
  }
}

export function addSessionWorkoutItem(
  items: SessionWorkoutItem[],
  input: Partial<SessionWorkoutItem> & Pick<SessionWorkoutItem, 'category' | 'exerciseName'>,
): SessionWorkoutItem[] {
  return [...items, createSessionWorkoutItem(input)]
}

export function summarizeSessionWorkoutItem(item: Partial<SessionWorkoutItem>): string {
  const parts: string[] = []

  if (item.exerciseName?.trim()) {
    parts.push(item.exerciseName.trim())
  }

  const sets = item.sets?.trim()
  const reps = item.reps?.trim()
  const durationMinutes = item.durationMinutes?.trim()

  if (sets && reps) {
    parts.push(`${sets} × ${reps}`)
  } else if (sets) {
    parts.push(sets)
  } else if (reps) {
    parts.push(reps)
  }

  if (durationMinutes) {
    parts.push(`${durationMinutes} min`)
  }

  return parts.join(' • ')
}

export function updateSessionWorkoutItem(
  items: SessionWorkoutItem[],
  itemId: string,
  updates: Partial<SessionWorkoutItem>,
): SessionWorkoutItem[] {
  return items.map((item) => {
    if (item.id !== itemId) {
      return item
    }

    return {
      ...item,
      ...updates,
      category: updates.category
        ? normalizeSessionWorkoutCategory(updates.category)
        : item.category,
      exerciseName: updates.exerciseName ?? item.exerciseName,
      exerciseId: updates.exerciseId ?? item.exerciseId,
      reps: updates.reps ?? item.reps,
      sets: updates.sets ?? item.sets,
      weight: updates.weight ?? item.weight,
      durationMinutes: updates.durationMinutes ?? item.durationMinutes,
      distanceKm: updates.distanceKm ?? item.distanceKm,
      speedKph: updates.speedKph ?? item.speedKph,
      notes: updates.notes ?? item.notes,
      planItemId: updates.planItemId ?? item.planItemId,
    }
  })
}

export function removeSessionWorkoutItem(
  items: SessionWorkoutItem[],
  itemId: string,
): SessionWorkoutItem[] {
  return items.filter((item) => item.id !== itemId)
}

export function reorderSessionWorkoutItem(
  items: SessionWorkoutItem[],
  itemId: string,
  direction: 'up' | 'down',
): SessionWorkoutItem[] {
  const currentIndex = items.findIndex((item) => item.id === itemId)

  if (currentIndex < 0) {
    return items
  }

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
  if (targetIndex < 0 || targetIndex >= items.length) {
    return items
  }

  const nextItems = [...items]
  const [currentItem] = nextItems.splice(currentIndex, 1)
  nextItems.splice(targetIndex, 0, currentItem)

  return nextItems.map((item, index) => ({
    ...item,
    sortOrder: index,
  }))
}

export function buildWorkoutItemsFromPlanSessions(
  planSessions: PlanSession[] | undefined,
): SessionWorkoutItem[] {
  return (planSessions ?? []).flatMap((session) =>
    (session.planItems ?? []).map((item) =>
      createSessionWorkoutItem({
        category: 'exercise',
        exerciseName: item.exercise_name || item.exercise_id || 'Exercise',
        exerciseId: item.exercise_id ?? undefined,
        reps: item.reps ?? '',
        sets: item.workingSets ?? '',
        notes: item.notes ?? '',
        planItemId: item.id,
      }),
    ),
  )
}

export function buildSessionWorkoutMetadata(
  input: SessionWorkoutMetadata & { workoutItems?: SessionWorkoutItem[] },
) {
  return {
    workout: {
      endedAt: input.endedAt ?? null,
      activeKwh: input.activeKwh ?? null,
      selectedPlanId: input.selectedPlanId ?? null,
      selectedPlanName: input.selectedPlanName ?? null,
      workoutItems: input.workoutItems ?? [],
    },
  }
}

export function parseSessionWorkoutMetadata(input: unknown): SessionWorkoutMetadata {
  if (!input || typeof input !== 'object') {
    return { workoutItems: [] }
  }

  const record = input as Record<string, unknown>
  const workout = record.workout
  const values = (workout && typeof workout === 'object' ? workout : record) as Record<string, unknown>

  const workoutItems = Array.isArray(values.workoutItems)
    ? (values.workoutItems as SessionWorkoutItem[]).filter(
        (item): item is SessionWorkoutItem => Boolean(item && typeof item === 'object'),
      )
    : Array.isArray(record.workoutItems)
      ? (record.workoutItems as SessionWorkoutItem[]).filter(
          (item): item is SessionWorkoutItem => Boolean(item && typeof item === 'object'),
        )
      : []

  return {
    workoutItems,
    endedAt: typeof values.endedAt === 'string' ? values.endedAt : null,
    activeKwh: typeof values.activeKwh === 'string' ? values.activeKwh : null,
    selectedPlanId:
      typeof values.selectedPlanId === 'string' ? values.selectedPlanId : null,
    selectedPlanName:
      typeof values.selectedPlanName === 'string' ? values.selectedPlanName : null,
  }
}
