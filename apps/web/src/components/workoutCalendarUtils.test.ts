import { describe, expect, it } from 'vitest'
import {
  resolveWorkoutLinkState,
  NO_LINK_SESSION_ID,
} from './workoutCalendarUtils'

describe('resolveWorkoutLinkState', () => {
  it('treats null as unassigned and the no-link sentinel as explicit no-link', () => {
    expect(resolveWorkoutLinkState(null)).toBe('unassigned')
    expect(resolveWorkoutLinkState(NO_LINK_SESSION_ID)).toBe('no-link')
    expect(resolveWorkoutLinkState('0')).toBe('no-link')
    expect(resolveWorkoutLinkState('session-123')).toBe('linked')
  })
})
