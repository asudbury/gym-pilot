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
      user_id: 'u1',
      friendly_name: 'Ada',
      roles: ['client'],
      trainer_id: 't1',
      account_tier: 'free',
      is_frozen: false,
      must_change_password: true,
    })
  })
})
