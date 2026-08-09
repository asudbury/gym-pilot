import type { Tables } from '@gym-pilot/shared/src/dataServices/databaseTypes'
import type { TableNames } from '@gym-pilot/shared/src/dataServices/tableNames'

export type PlanSessionRow = Tables<typeof TableNames.WorkoutPlanSession>
export type PlanExerciseRow = Tables<typeof TableNames.WorkoutPlanExercise>

export type PlanSessionState = PlanSessionRow & {
  planItems: PlanExerciseRow[]
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
    const sessionBucket = Math.floor(exercise.position / 1000)
    const targetSession = sortedSessions[sessionBucket] ?? sortedSessions[0]

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
