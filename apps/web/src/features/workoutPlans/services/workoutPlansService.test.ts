import { getSupabaseClient } from '@gym-pilot/shared'
import { TableNames } from '@gym-pilot/shared/src/dataServices/tableNames'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildPersistedPlanRows } from '../../planBuilder/domain/workoutPlanState'
import { persistWorkoutPlan } from './workoutPlansService'

vi.mock('@gym-pilot/shared', () => ({
  getSupabaseClient: vi.fn(),
  logger: {
    error: vi.fn(),
  },
}))

vi.mock('../../planBuilder/domain/workoutPlanState', async () => {
  const actual = await vi.importActual<
    typeof import('../../planBuilder/domain/workoutPlanState')
  >('../../planBuilder/domain/workoutPlanState')

  return {
    ...actual,
    buildPersistedPlanRows: vi.fn(),
  }
})

function createPersistClientMock() {
  const workoutPlanInsertMaybeSingle = vi
    .fn()
    .mockResolvedValue({ data: { id: 'created-plan-id' }, error: null })
  const workoutPlanInsertSelect = vi
    .fn()
    .mockReturnValue({ maybeSingle: workoutPlanInsertMaybeSingle })
  const workoutPlanInsert = vi
    .fn()
    .mockReturnValue({ select: workoutPlanInsertSelect })

  const workoutPlanUpdateEq = vi.fn().mockResolvedValue({ error: null })
  const workoutPlanUpdate = vi.fn().mockReturnValue({ eq: workoutPlanUpdateEq })

  const workoutPlanDeleteEq = vi.fn().mockResolvedValue({ error: null })
  const workoutPlanDelete = vi.fn().mockReturnValue({ eq: workoutPlanDeleteEq })

  const workoutPlanSessionDeleteEq = vi.fn().mockResolvedValue({ error: null })
  const workoutPlanSessionDelete = vi
    .fn()
    .mockReturnValue({ eq: workoutPlanSessionDeleteEq })
  const workoutPlanSessionInsert = vi.fn().mockResolvedValue({ error: null })

  const workoutPlanExerciseDeleteEq = vi.fn().mockResolvedValue({ error: null })
  const workoutPlanExerciseDelete = vi
    .fn()
    .mockReturnValue({ eq: workoutPlanExerciseDeleteEq })
  const workoutPlanExerciseInsert = vi.fn().mockResolvedValue({ error: null })

  const from = vi.fn((tableName: string) => {
    if (tableName === TableNames.WorkoutPlan) {
      return {
        insert: workoutPlanInsert,
        update: workoutPlanUpdate,
        delete: workoutPlanDelete,
      }
    }

    if (tableName === TableNames.WorkoutPlanSession) {
      return {
        delete: workoutPlanSessionDelete,
        insert: workoutPlanSessionInsert,
      }
    }

    if (tableName === TableNames.WorkoutPlanExercise) {
      return {
        delete: workoutPlanExerciseDelete,
        insert: workoutPlanExerciseInsert,
      }
    }

    throw new Error(`Unexpected table: ${tableName}`)
  })

  return {
    client: {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
      from,
    },
    spies: {
      from,
      workoutPlanInsert,
      workoutPlanUpdateEq,
      workoutPlanSessionDeleteEq,
      workoutPlanExerciseDeleteEq,
      workoutPlanSessionInsert,
      workoutPlanExerciseInsert,
    },
  }
}

describe('persistWorkoutPlan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(buildPersistedPlanRows).mockReturnValue({
      persistedSessions: [
        {
          id: 'session-1',
          plan_id: 'plan-1',
          name: 'Day 1',
          position: 0,
        },
      ],
      persistedExercises: [
        {
          id: 'exercise-1',
          plan_id: 'plan-1',
          session_id: 'session-1',
          exercise_id: 'squat',
          exercise_name: 'Squat',
          position: 0,
        },
      ],
    })
  })

  it('returns a client error when Supabase is unavailable', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(null as never)

    await expect(
      persistWorkoutPlan({
        planId: undefined,
        planName: 'Strength Plan',
        isEditMode: false,
        sessions: [],
      }),
    ).resolves.toEqual({
      planId: null,
      error: 'Supabase client not available.',
    })
  })

  it('creates a new plan and inserts sessions/exercises in create mode', async () => {
    const { client, spies } = createPersistClientMock()
    vi.mocked(getSupabaseClient).mockReturnValue(client as never)

    const result = await persistWorkoutPlan({
      planId: undefined,
      planName: '  Strength Plan  ',
      isEditMode: false,
      sessions: [],
    })

    expect(result).toEqual({ planId: 'created-plan-id', error: null })
    expect(spies.workoutPlanInsert).toHaveBeenCalledWith({
      user_id: 'user-1',
      plan_name: 'Strength Plan',
    })
    expect(spies.workoutPlanSessionInsert).toHaveBeenCalledTimes(1)
    expect(spies.workoutPlanExerciseInsert).toHaveBeenCalledTimes(1)
  })

  it('updates and replaces rows in edit mode', async () => {
    const { client, spies } = createPersistClientMock()
    vi.mocked(getSupabaseClient).mockReturnValue(client as never)

    const result = await persistWorkoutPlan({
      planId: 'plan-1',
      planName: 'Updated Plan Name',
      isEditMode: true,
      sessions: [],
    })

    expect(result).toEqual({ planId: 'plan-1', error: null })
    expect(spies.workoutPlanUpdateEq).toHaveBeenCalledWith('id', 'plan-1')
    expect(spies.workoutPlanSessionDeleteEq).toHaveBeenCalledWith(
      'plan_id',
      'plan-1',
    )
    expect(spies.workoutPlanExerciseDeleteEq).toHaveBeenCalledWith(
      'plan_id',
      'plan-1',
    )
    expect(spies.workoutPlanSessionInsert).toHaveBeenCalledTimes(1)
    expect(spies.workoutPlanExerciseInsert).toHaveBeenCalledTimes(1)
  })
})
