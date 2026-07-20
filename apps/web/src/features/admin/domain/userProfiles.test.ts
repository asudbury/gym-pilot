import { describe, expect, it } from 'vitest'
import {
  createInitialProfileDraft,
  mapProfileRow,
  resolveTrainerOptions,
  toggleRoleSelection,
} from './userProfiles'

describe('createInitialProfileDraft', () => {
  it('creates a draft from a profile row', () => {
    const draft = createInitialProfileDraft({
      id: 'u1',
      name: 'Ada',
      roles: ['client'],
      applicationName: 'App',
      gymBrand: 'Virgin',
      gymName: '1',
      accountTier: 'free',
      accessEndsAt: null,
      isFrozen: false,
      email: 'ada@example.com',
      trainerId: null,
      mustChangePassword: false,
      lastLoggedInAt: null,
      previousLastLoggedInAt: null,
    })

    expect(draft.name).toBe('Ada')
    expect(draft.roles).toEqual(['client'])
    expect(draft.accountTier).toBe('free')
  })
})

describe('mapProfileRow', () => {
  it('maps the raw Supabase row into admin profile data', () => {
    const profile = mapProfileRow(
      {
        user_id: 'u1',
        friendly_name: 'Ada',
        roles: ['client'],
        trainer_id: 'trainer-1',
        application_name: 'App',
        gym_brand: 'Virgin',
        gym_club_id: 3,
        account_tier: 'bronze',
        access_ends_at: '2025-01-02T00:00:00.000Z',
        is_frozen: true,
        must_change_password: true,
        last_logged_in_at: '2024-01-01T00:00:00.000Z',
        previous_last_logged_in_at: '2023-01-01T00:00:00.000Z',
      },
      new Map([['u1', 'ada@example.com']]),
    )

    expect(profile.name).toBe('Ada')
    expect(profile.roles).toEqual(['client'])
    expect(profile.email).toBe('ada@example.com')
  })

  it('trims friendly names and emails from raw strings', () => {
    const profile = mapProfileRow(
      {
        user_id: 'u1',
        friendly_name: '  Ada  ',
        email: '  ada@example.com  ',
      },
      new Map([['u1', null]]),
    )

    expect(profile.name).toBe('Ada')
    expect(profile.email).toBe('ada@example.com')
  })
})

describe('resolveTrainerOptions', () => {
  it('adds the profile as a trainer option for trainer profiles', () => {
    const options = resolveTrainerOptions(
      {
        id: 'u1',
        name: 'Ada',
        roles: ['trainer'],
        applicationName: null,
        gymBrand: null,
        gymName: null,
        accountTier: null,
        accessEndsAt: null,
        isFrozen: false,
        email: null,
        trainerId: null,
        mustChangePassword: false,
        lastLoggedInAt: null,
        previousLastLoggedInAt: null,
      },
      [{ id: 't1', name: 'Trainer 1', roles: ['trainer'] }],
    )

    expect(options[0]).toMatchObject({ id: 'u1', name: 'Ada' })
  })
})

describe('toggleRoleSelection', () => {
  it('adds and removes roles', () => {
    expect(toggleRoleSelection(['client'], 'trainer')).toEqual([
      'client',
      'trainer',
    ])
    expect(toggleRoleSelection(['client', 'trainer'], 'trainer')).toEqual([
      'client',
    ])
  })
})
