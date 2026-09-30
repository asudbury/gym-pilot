import { describe, expect, it } from 'vitest'
import {
  buildPersistedPlanRows,
  buildPlanSessionsFromRows,
} from './workoutPlanState'

describe('buildPlanSessionsFromRows', () => {
  it('reconstructs session-specific exercises from the persisted position field', () => {
    const sessions = [
      {
        id: 'session-1',
        name: 'Day 1',
        plan_id: 'plan-1',
        position: 0,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'session-2',
        name: 'Day 2',
        plan_id: 'plan-1',
        position: 1,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ]

    const exercises = [
      {
        id: 'exercise-1',
        plan_id: 'plan-1',
        session_id: 'session-1',
        exercise_id: 'bench-press',
        exercise_name: 'Bench Press',
        position: 0,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'exercise-2',
        plan_id: 'plan-1',
        session_id: 'session-2',
        exercise_id: 'squat',
        exercise_name: 'Squat',
        position: 1,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ]

    const result = buildPlanSessionsFromRows(sessions as any, exercises as any)

    expect(result).toHaveLength(2)
    expect(result[0].planItems).toHaveLength(1)
    expect(result[0].planItems[0].id).toBe('exercise-1')
    expect(result[1].planItems).toHaveLength(1)
    expect(result[1].planItems[0].id).toBe('exercise-2')
  })

  it('generates fresh ids for persisted exercises instead of reusing existing row ids', () => {
    const sessions = [
      {
        id: 'session-1',
        name: 'Day 1',
        plan_id: 'plan-1',
        position: 0,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
        planItems: [
          {
            id: 'existing-exercise-id',
            plan_id: 'plan-1',
            exercise_id: 'bench-press',
            exercise_name: 'Bench Press',
            position: 0,
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
    ]

    const result = buildPersistedPlanRows(sessions as any, 'plan-1')

    expect(result.persistedExercises).toHaveLength(1)
    expect(result.persistedExercises[0].id).not.toBe('existing-exercise-id')
    expect(result.persistedExercises[0].exercise_id).toBe('bench-press')
  })

  it('persists exercises with the persisted session id so they stay attached to the right session', () => {
    const sessions = [
      {
        id: 'session-1',
        name: 'Day 1',
        plan_id: 'plan-1',
        position: 0,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
        planItems: [
          {
            id: 'exercise-1',
            plan_id: 'plan-1',
            exercise_id: 'bench-press',
            exercise_name: 'Bench Press',
            position: 0,
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
      {
        id: 'session-2',
        name: 'Day 2',
        plan_id: 'plan-1',
        position: 1,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
        planItems: [
          {
            id: 'exercise-2',
            plan_id: 'plan-1',
            exercise_id: 'squat',
            exercise_name: 'Squat',
            position: 0,
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
    ]

    const createdIds = [
      'persisted-session-1',
      'persisted-session-2',
      'persisted-exercise-1',
      'persisted-exercise-2',
    ]

    const result = buildPersistedPlanRows(sessions as any, 'plan-1', () => {
      const nextId = createdIds.shift()
      return nextId ?? 'fallback-id'
    })

    expect(result.persistedExercises[0].session_id).toBe(
      result.persistedSessions[0].id,
    )
    expect(result.persistedExercises[1].session_id).toBe(
      result.persistedSessions[1].id,
    )
  })

  it('groups exercises by the session bucket encoded in their persisted position', () => {
    const sessions = [
      {
        id: 'session-1',
        name: 'Day 1',
        plan_id: 'plan-1',
        position: 0,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'session-2',
        name: 'Day 2',
        plan_id: 'plan-1',
        position: 1,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ]

    const exercises = [
      {
        id: 'exercise-1',
        plan_id: 'plan-1',
        session_id: 'session-1',
        exercise_id: 'bench-press',
        exercise_name: 'Bench Press',
        position: 0,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'exercise-2',
        plan_id: 'plan-1',
        session_id: 'session-1',
        exercise_id: 'squat',
        exercise_name: 'Squat',
        position: 1,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'exercise-3',
        plan_id: 'plan-1',
        session_id: 'session-2',
        exercise_id: 'deadlift',
        exercise_name: 'Deadlift',
        position: 0,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ]

    const result = buildPlanSessionsFromRows(sessions as any, exercises as any)

    expect(result[0].planItems.map((item) => item.id)).toEqual([
      'exercise-1',
      'exercise-2',
    ])
    expect(result[1].planItems.map((item) => item.id)).toEqual(['exercise-3'])
  })
})
