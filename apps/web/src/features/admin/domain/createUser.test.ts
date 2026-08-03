import { describe, expect, it } from 'vitest'
import {
  buildCreateUserProfilePayload,
  getCreateUserRoleOptions,
} from './createUser'

describe('createUser domain helpers', () => {
  it('provides the supported role options', () => {
    expect(getCreateUserRoleOptions()).toEqual(['admin', 'trainer', 'client'])
  })

  it('builds the profile payload for a client user', () => {
    const payload = buildCreateUserProfilePayload({
      userId: 'u1',
      displayName: 'Ada',
      roles: ['client'],
      selectedTrainerId: 't1',
    })

    expect(payload).toMatchObject({
      ///user_id: 'u1',
      friendly_name: 'Ada',
      trainer_id: 't1',
      account_tier: 'free',
      is_frozen: false,
      must_change_password: true,
    })
  })

  it('includes gym club id and brand when provided', () => {
    const payload = buildCreateUserProfilePayload({
      userId: 'u3',
      displayName: 'ClubUser',
      roles: ['client'],
      selectedTrainerId: 't2',
      gymClubId: '123',
      gymBrand: 'Virgin',
    })

    expect(payload.gym_club_id).toBe(123)
    expect(payload.gym_brand).toBe('Virgin')
  })
})
