import { describe, expect, it } from 'vitest'
import { isLocalhostHost, shouldRecordSupabaseUserActivity } from './gymPilotSupabase'

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
})
