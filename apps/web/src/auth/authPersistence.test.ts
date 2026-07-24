import { describe, expect, it } from 'vitest'
import type { AuthUser } from '../features/auth/domain/authTypes'
import { shouldPersistAuthSession } from './authPersistence'

const sampleUser = {
  id: 'user-1',
  name: 'Test User',
  slug: 'test-user',
  role: 'client',
  roles: ['client'],
} as AuthUser

describe('shouldPersistAuthSession', () => {
  it('skips persistence before auth hydration completes', () => {
    expect(shouldPersistAuthSession(false, null, false)).toBe(false)
  })

  it('persists a hydrated authenticated user', () => {
    expect(shouldPersistAuthSession(true, sampleUser, false)).toBe(true)
  })

  it('persists a logout once the user had previously been authenticated', () => {
    expect(shouldPersistAuthSession(true, null, true)).toBe(true)
  })
})
