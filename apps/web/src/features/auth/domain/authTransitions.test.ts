import { describe, expect, it } from 'vitest'
import type { User } from '@gym-pilot/types'
import {
  resolveAuthUserProfileNameUpdate,
  resolveLoginAuthUser,
} from './authTransitions'

describe('authTransitions', () => {
  it('resolves a login user from the available users list', () => {
    const user = resolveLoginAuthUser(
      [
        {
          id: 'u1',
          name: 'Ada',
          slug: 'ada',
          role: 'client',
          roles: ['client'],
          applicationName: null,
          gymBrand: null,
          gymName: null,
          accountTier: null,
          accessEndsAt: null,
          isFrozen: false,
          trainerId: null,
        } satisfies User,
      ],
      'u1',
    )

    expect(user?.id).toBe('u1')
    expect(user?.name).toBe('Ada')
  })

  it('creates a slugged profile-name update for an existing user', () => {
    const user = {
      id: 'u2',
      name: 'Ada',
      slug: 'ada',
      role: 'client',
      roles: ['client'],
      applicationName: null,
      gymBrand: null,
      gymName: null,
      accountTier: null,
      accessEndsAt: null,
      isFrozen: false,
      trainerId: null,
    } satisfies User
    const nextState = resolveAuthUserProfileNameUpdate(
      { ...user, email: null },
      ' New Name ',
    )

    expect(nextState?.user.slug).toBe('new-name')
    expect(nextState?.user.name).toBe('New Name')
  })
})
