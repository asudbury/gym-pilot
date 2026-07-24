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
  it('returns true for an active user', () => {
    expect(resolveIsAuthenticated(baseUser)).toBe(true)
  })

  it('returns false for a blocked user', () => {
    expect(resolveIsAuthenticated({ ...baseUser, isFrozen: true })).toBe(false)
  })

  it('returns null for a missing user', () => {
    expect(resolvePersistedUserId(null)).toBeNull()
  })

  it('returns a user id when an active user is present', () => {
    expect(resolvePersistedUserId(baseUser)).toBe(baseUser.id)
  })
})
