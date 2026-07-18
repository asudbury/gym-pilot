import { describe, expect, it } from 'vitest'
import type { AuthUser } from './authTypes'
import { resolveIsAuthenticated, resolvePersistedUserId } from './authState'

const baseUser: AuthUser = {
  id: 'user-1',
  name: 'Test User',
  slug: 'test-user',
  role: 'client',
  roles: ['client'],
  trainerId: null,
  applicationName: null,
  gymBrand: null,
  gymName: null,
  accountTier: null,
  accessEndsAt: null,
  isFrozen: false,
  email: null,
}

describe('resolveIsAuthenticated', () => {
  it('returns true for an active user without bypass', () => {
    expect(resolveIsAuthenticated(baseUser, false)).toBe(true)
  })

  it('returns true when bypass is enabled even without a user', () => {
    expect(resolveIsAuthenticated(null, true)).toBe(true)
  })

  it('returns false for a blocked user', () => {
    expect(resolveIsAuthenticated({ ...baseUser, isFrozen: true }, false)).toBe(false)
  })

  it('returns the bypass marker when bypass is enabled', () => {
    expect(resolvePersistedUserId(null, true)).toBe('mvp-bypass')
  })

  it('returns a user id when an active user is present', () => {
    expect(resolvePersistedUserId(baseUser, false)).toBe(baseUser.id)
  })
})
