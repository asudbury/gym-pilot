import { describe, expect, it } from 'vitest'
import {
  resolveRemovedSessionState,
  resolveReorderedSessionState,
} from './workoutPlanEditState'

type Session = {
  id: string
  name: string
}

const sessions: Session[] = [
  { id: 's1', name: 'Session 1' },
  { id: 's2', name: 'Session 2' },
  { id: 's3', name: 'Session 3' },
]

describe('resolveRemovedSessionState', () => {
  it('moves active index back when removing an earlier session', () => {
    const result = resolveRemovedSessionState(sessions, 2, 1)

    expect(result.sessions.map((session) => session.id)).toEqual(['s1', 's3'])
    expect(result.activeSessionIndex).toBe(1)
  })

  it('keeps active index when removing a later session', () => {
    const result = resolveRemovedSessionState(sessions, 0, 2)

    expect(result.sessions.map((session) => session.id)).toEqual(['s1', 's2'])
    expect(result.activeSessionIndex).toBe(0)
  })
})

describe('resolveReorderedSessionState', () => {
  it('updates active index when active session is moved down', () => {
    const result = resolveReorderedSessionState(sessions, 0, 0, 'down')

    expect(result.sessions.map((session) => session.id)).toEqual([
      's2',
      's1',
      's3',
    ])
    expect(result.activeSessionIndex).toBe(1)
    expect(result.movedSessionId).toBe('s1')
  })

  it('updates active index when another session moves over active session', () => {
    const result = resolveReorderedSessionState(sessions, 1, 0, 'down')

    expect(result.sessions.map((session) => session.id)).toEqual([
      's2',
      's1',
      's3',
    ])
    expect(result.activeSessionIndex).toBe(0)
    expect(result.movedSessionId).toBe('s1')
  })
})
