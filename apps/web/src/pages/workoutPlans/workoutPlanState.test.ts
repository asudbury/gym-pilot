import { describe, expect, it } from 'vitest'
import { buildPlanSessionsFromRows } from './workoutPlanState'

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
        exercise_id: 'bench-press',
        exercise_name: 'Bench Press',
        position: 0,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'exercise-2',
        plan_id: 'plan-1',
        exercise_id: 'squat',
        exercise_name: 'Squat',
        position: 1000,
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
        exercise_id: 'bench-press',
        exercise_name: 'Bench Press',
        position: 0,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'exercise-2',
        plan_id: 'plan-1',
        exercise_id: 'squat',
        exercise_name: 'Squat',
        position: 1,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'exercise-3',
        plan_id: 'plan-1',
        exercise_id: 'deadlift',
        exercise_name: 'Deadlift',
        position: 1000,
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
