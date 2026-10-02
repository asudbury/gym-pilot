import { describe, it, expect } from 'vitest'
import {
  canAccessTimetable,
  canAccessPTSessions,
  type UserCapabilityLike,
} from './capabilityResolution'

describe('canAccessTimetable', () => {
  it('returns false for null or undefined user', () => {
    expect(canAccessTimetable(null)).toBe(false)
    expect(canAccessTimetable(undefined)).toBe(false)
  })

  it('returns false when user has no gymName', () => {
    const user: UserCapabilityLike = {}
    expect(canAccessTimetable(user)).toBe(false)
  })

  it('returns false when gymName is null or empty', () => {
    expect(canAccessTimetable({ gymName: null })).toBe(false)
    expect(canAccessTimetable({ gymName: '' })).toBe(false)
    expect(canAccessTimetable({ gymName: '   ' })).toBe(false)
  })

  it('returns true when user has a non-empty gymName', () => {
    expect(canAccessTimetable({ gymName: 'Gold Gym' })).toBe(true)
    expect(canAccessTimetable({ gymName: '  Fitness Studio  ' })).toBe(true)
  })

  it('ignores other fields and only checks gymName', () => {
    const user: UserCapabilityLike = {
      gymName: 'My Gym',
      trainerId: 'trainer-123',
      roles: ['admin'],
    }
    expect(canAccessTimetable(user)).toBe(true)
  })
})

describe('canAccessPTSessions', () => {
  it('returns false for null or undefined user', () => {
    expect(canAccessPTSessions(null)).toBe(false)
    expect(canAccessPTSessions(undefined)).toBe(false)
  })

  it('returns false when user has no trainer ID or trainer role', () => {
    const user: UserCapabilityLike = {}
    expect(canAccessPTSessions(user)).toBe(false)
  })

  it('returns true when user has a valid trainerId', () => {
    expect(canAccessPTSessions({ trainerId: 'trainer-123' })).toBe(true)
    expect(canAccessPTSessions({ trainerId: '  trainer-456  ' })).toBe(true)
  })

  it('returns false when trainerId is null or empty', () => {
    expect(canAccessPTSessions({ trainerId: null })).toBe(false)
    expect(canAccessPTSessions({ trainerId: '' })).toBe(false)
    expect(canAccessPTSessions({ trainerId: '   ' })).toBe(false)
  })

  it('returns true when user has trainer role', () => {
    const user: UserCapabilityLike = {
      roles: ['trainer'],
    }
    expect(canAccessPTSessions(user)).toBe(true)
  })

  it('returns true when user has trainer role among multiple roles', () => {
    const user: UserCapabilityLike = {
      roles: ['admin', 'trainer', 'user'],
    }
    expect(canAccessPTSessions(user)).toBe(true)
  })

  it('returns false when roles array exists but does not include trainer', () => {
    const user: UserCapabilityLike = {
      roles: ['admin', 'user'],
    }
    expect(canAccessPTSessions(user)).toBe(false)
  })

  it('returns true when user has either trainerId or trainer role', () => {
    const userWithBoth: UserCapabilityLike = {
      trainerId: 'trainer-123',
      roles: ['trainer'],
    }
    expect(canAccessPTSessions(userWithBoth)).toBe(true)

    const userWithTrainerId: UserCapabilityLike = {
      trainerId: 'trainer-123',
      roles: ['admin'],
    }
    expect(canAccessPTSessions(userWithTrainerId)).toBe(true)

    const userWithRole: UserCapabilityLike = {
      trainerId: null,
      roles: ['trainer'],
    }
    expect(canAccessPTSessions(userWithRole)).toBe(true)
  })

  it('handles null values in roles array', () => {
    const user: UserCapabilityLike = {
      roles: [null, 'trainer', undefined],
    }
    expect(canAccessPTSessions(user)).toBe(true)
  })
})
