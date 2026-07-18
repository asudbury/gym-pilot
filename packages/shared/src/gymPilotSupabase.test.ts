import { describe, expect, it } from 'vitest'
import { getSupabaseTableName, isLocalhostHost, shouldRecordLoginActivity, shouldRecordSupabaseUserActivity } from './gymPilotSupabase'

describe('local activity recording guard', () => {
  it('treats localhost-style hosts as local and skips recording', () => {
    expect(isLocalhostHost('localhost')).toBe(true)
    expect(isLocalhostHost('127.0.0.1')).toBe(true)
    expect(isLocalhostHost('::1')).toBe(true)
    expect(isLocalhostHost('foo.localhost')).toBe(true)
  })

  it('allows recording when the host is not localhost', () => {
    expect(isLocalhostHost('gym-pilot.example.com')).toBe(false)
    expect(shouldRecordSupabaseUserActivity()).toBe(true)
  })

  it('maps app storage keys to the singular table naming convention', () => {
    expect(getSupabaseTableName('gym-pilot-plans')).toBe('gym_pilot_plan')
    expect(getSupabaseTableName('gym-pilot-assignments')).toBe('gym_pilot_assignment')
    expect(getSupabaseTableName('gym-pilot.favorites')).toBe('gym_pilot_favourite')
  })

  it('only records a login activity when the profile timestamp actually changes', () => {
    expect(shouldRecordLoginActivity('2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z')).toBe(false)
    expect(shouldRecordLoginActivity('2025-01-02T00:00:00.000Z', '2025-01-01T00:00:00.000Z')).toBe(true)
  })
})
