import type { Tables } from '@gym-pilot/shared/src/dataServices/databaseTypes'
import type { TableNames } from '@gym-pilot/shared/src/dataServices/tableNames'

export type PlanSessionRow = Tables<typeof TableNames.WorkoutPlanSession>
export type PlanExerciseRow = Tables<typeof TableNames.WorkoutPlanExercise> & {
  session_id?: string | null
}

export type PlanSessionState = PlanSessionRow & {
  planItems: PlanExerciseRow[]
}

export type PersistedPlanSessionRow = {
  id: string
  plan_id: string
  name: string
  position: number
}

export type PersistedPlanExerciseRow = {
  id: string
  plan_id: string
  session_id: string
  exercise_id: string
  exercise_name: string | null
  position: number
}

function createPersistedId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function buildPersistedPlanRows(
  sessions: PlanSessionState[],
  planId: string,
  createId: () => string = createPersistedId,
): {
  persistedSessions: PersistedPlanSessionRow[]
  persistedExercises: PersistedPlanExerciseRow[]
} {
  const persistedSessions = sessions.map((session, index) => ({
    id: session.id,
    plan_id: planId,
    name: session.name,
    position: index,
  }))

  const persistedExercises = sessions.flatMap((session) =>
    session.planItems.map((item, itemIndex) => ({
      id: createId(),
      plan_id: planId,
      session_id: session.id,
      exercise_id: item.exercise_id,
      exercise_name: item.exercise_name ?? null,
      position: itemIndex,
    })),
  )

  return {
    persistedSessions,
    persistedExercises,
  }
}

export function buildPlanSessionsFromRows(
  sessions: PlanSessionRow[],
  exercises: PlanExerciseRow[],
): PlanSessionState[] {
  if (sessions.length === 0) {
    return []
  }

  const sortedSessions = [...sessions].sort(
    (left, right) => left.position - right.position,
  )
  const exercisesBySessionId = new Map<string, PlanExerciseRow[]>()

  sortedSessions.forEach((session) => {
    exercisesBySessionId.set(session.id, [])
  })

  const orderedExercises = [...exercises].sort(
    (left, right) => left.position - right.position,
  )

  orderedExercises.forEach((exercise) => {
    const targetSession = sortedSessions.find(
      (session) => session.id === exercise.session_id,
    )

    if (targetSession) {
      const sessionExercises = exercisesBySessionId.get(targetSession.id) || []
      sessionExercises.push(exercise)
      exercisesBySessionId.set(targetSession.id, sessionExercises)
    }
  })

  return sortedSessions.map((session) => ({
    ...session,
    planItems: exercisesBySessionId.get(session.id) || [],
  }))
}
