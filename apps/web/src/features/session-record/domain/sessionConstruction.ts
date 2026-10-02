import type { UserSession, UserSessionWorkoutItem } from '@gym-pilot/shared'
import type { PlanSession } from '@gym-pilot/types'
import { toUtcIsoStringFromLocalInputValue } from '../../../dateTimeFormatter'

export type SessionType = 'class' | 'solo' | 'personal_training'

/**
 * Resolves the initial session type from a raw URL search param value.
 * Defaults to `'personal_training'` if the value is not recognised.
 *
 * @param value - The raw string value from the URL (e.g. `searchParams.get('type')`).
 * @returns The validated SessionType.
 */
export function resolveInitialSessionType(value: string | null): SessionType {
  if (value === 'solo') {
    return 'solo'
  }

  if (value === 'class') {
    return 'class'
  }

  return 'personal_training'
}

/**
 * Builds a flat list of partial workout items from a set of plan sessions,
 * preserving exercise order across sessions.
 *
 * @param planSessions - The plan sessions to expand into workout items.
 * @returns An ordered array of partial UserSessionWorkoutItem ready for persistence.
 */
export function buildWorkoutItemsFromPlanSessions(
  planSessions: PlanSession[],
): Partial<UserSessionWorkoutItem>[] {
  if (!planSessions) {
    return []
  }

  const items: Partial<UserSessionWorkoutItem>[] = []
  let order = 0

  for (const session of planSessions) {
    for (const planItem of session.planItems) {
      items.push({
        id: crypto.randomUUID(),
        item_index: order,
        category: 'exercise',
        exercise_name: planItem.exercise_name,
        exercise_id: planItem.exercise_id,
        reps: planItem.reps,
        sets: planItem.workingSets,
        notes: planItem.notes,
        plan_item_id: planItem.id,
        sort_order: order,
      })
      order++
    }
  }

  return items
}

export type BuildSessionParams = {
  sessionId: string
  userId: string
  sessionType: SessionType
  startAt: string
  duration: number | undefined
  notes: string
  rating: number | null
  activeKwh: string
  trainerId: string | null
  trainerName: string | null
}

/**
 * Constructs a UserSession object from validated form state.
 * The `session_id` field is only set for solo and personal_training types.
 * The `trainer_id` and `trainer_name` fields are only set for personal_training.
 *
 * @param params - The validated session form parameters.
 * @returns A fully-typed UserSession ready for persistence.
 */
export function buildUserSession(params: BuildSessionParams): UserSession {
  const {
    sessionId,
    userId,
    sessionType,
    startAt,
    duration,
    notes,
    rating,
    activeKwh,
    trainerId,
    trainerName,
  } = params

  const now = new Date().toISOString()

  return {
    id: sessionId,
    user_id: userId,
    created_at: now,
    updated_at: now,
    attendance_type: null,
    capacity: null,
    class_id: null,
    class_name: null,
    duration_minutes: duration ?? null,
    gym_club_id: null,
    location: null,
    metadata: null,
    notes: notes || null,
    price: null,
    rating: rating ?? null,
    role: 'client',
    session_id:
      sessionType === 'solo' || sessionType === 'personal_training'
        ? sessionId
        : null,
    session_type: sessionType,
    start_at: toUtcIsoStringFromLocalInputValue(startAt),
    status: null,
    trainer_id:
      sessionType === 'personal_training' ? (trainerId ?? null) : null,
    trainer_name:
      sessionType === 'personal_training' ? (trainerName ?? null) : null,
    energy: activeKwh ? Number(activeKwh) : null,
    energy_unit: activeKwh ? 'kWh' : null,
  }
}
