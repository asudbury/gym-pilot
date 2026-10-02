import { describe, expect, it } from 'vitest'
import type { PlanSession } from '@gym-pilot/types'
import {
  buildUserSession,
  buildWorkoutItemsFromPlanSessions,
  resolveInitialSessionType,
  type BuildSessionParams,
  type SessionType,
} from './sessionConstruction'

const makeSession = (
  overrides: Partial<BuildSessionParams> = {},
): BuildSessionParams => ({
  sessionId: 'session-1',
  userId: 'user-1',
  sessionType: 'solo',
  startAt: '2024-01-15T09:00',
  duration: 60,
  notes: '',
  rating: null,
  activeKwh: '',
  trainerId: null,
  trainerName: null,
  ...overrides,
})

const makePlanSession = (
  id: string,
  items: PlanSession['planItems'] = [],
): PlanSession => ({
  id,
  planItems: items,
})

describe('resolveInitialSessionType', () => {
  it('returns "solo" for "solo"', () => {
    expect(resolveInitialSessionType('solo')).toBe<SessionType>('solo')
  })

  it('returns "class" for "class"', () => {
    expect(resolveInitialSessionType('class')).toBe<SessionType>('class')
  })

  it('defaults to "personal_training" for unrecognised values', () => {
    expect(resolveInitialSessionType(null)).toBe<SessionType>(
      'personal_training',
    )
    expect(resolveInitialSessionType('unknown')).toBe<SessionType>(
      'personal_training',
    )
  })
})

describe('buildWorkoutItemsFromPlanSessions', () => {
  it('returns an empty array for an empty sessions list', () => {
    expect(buildWorkoutItemsFromPlanSessions([])).toEqual([])
  })

  it('builds one workout item per plan item preserving order', () => {
    const sessions: PlanSession[] = [
      makePlanSession('s1', [
        {
          id: 'item-1',
          exercise_id: 'ex-1',
          exercise_name: 'Squat',
          reps: '10',
          workingSets: '3',
        },
        {
          id: 'item-2',
          exercise_id: 'ex-2',
          exercise_name: 'Bench Press',
          reps: '8',
          workingSets: '4',
        },
      ]),
    ]
    const items = buildWorkoutItemsFromPlanSessions(sessions)
    expect(items).toHaveLength(2)
    expect(items[0].exercise_name).toBe('Squat')
    expect(items[0].item_index).toBe(0)
    expect(items[1].exercise_name).toBe('Bench Press')
    expect(items[1].item_index).toBe(1)
  })

  it('flattens items across multiple sessions', () => {
    const sessions: PlanSession[] = [
      makePlanSession('s1', [{ id: 'i1', exercise_id: 'ex-1' }]),
      makePlanSession('s2', [{ id: 'i2', exercise_id: 'ex-2' }]),
    ]
    const items = buildWorkoutItemsFromPlanSessions(sessions)
    expect(items).toHaveLength(2)
    expect(items[1].sort_order).toBe(1)
  })
})

describe('buildUserSession', () => {
  it('includes session_id for solo sessions', () => {
    const session = buildUserSession(
      makeSession({ sessionType: 'solo', sessionId: 'abc' }),
    )
    expect(session.session_id).toBe('abc')
  })

  it('includes session_id for personal_training sessions', () => {
    const session = buildUserSession(
      makeSession({ sessionType: 'personal_training', sessionId: 'abc' }),
    )
    expect(session.session_id).toBe('abc')
  })

  it('omits session_id for class sessions', () => {
    const session = buildUserSession(
      makeSession({ sessionType: 'class', sessionId: 'abc' }),
    )
    expect(session.session_id).toBeNull()
  })

  it('sets trainer fields only for personal_training', () => {
    const ptSession = buildUserSession(
      makeSession({
        sessionType: 'personal_training',
        trainerId: 't1',
        trainerName: 'Alice',
      }),
    )
    expect(ptSession.trainer_id).toBe('t1')
    expect(ptSession.trainer_name).toBe('Alice')

    const soloSession = buildUserSession(
      makeSession({
        sessionType: 'solo',
        trainerId: 't1',
        trainerName: 'Alice',
      }),
    )
    expect(soloSession.trainer_id).toBeNull()
    expect(soloSession.trainer_name).toBeNull()
  })

  it('sets energy fields when activeKwh is provided', () => {
    const session = buildUserSession(makeSession({ activeKwh: '0.5' }))
    expect(session.energy).toBe(0.5)
    expect(session.energy_unit).toBe('kWh')
  })

  it('omits energy fields when activeKwh is empty', () => {
    const session = buildUserSession(makeSession({ activeKwh: '' }))
    expect(session.energy).toBeNull()
    expect(session.energy_unit).toBeNull()
  })
})
