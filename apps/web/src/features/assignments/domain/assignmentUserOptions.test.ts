import { describe, expect, it } from 'vitest'

import { buildAssignmentUserOptions } from './assignmentUserOptions'

describe('buildAssignmentUserOptions', () => {
  it('returns unique user options from profile rows', () => {
    const options = buildAssignmentUserOptions([
      { user_id: 'user-1', friendly_name: 'Alice' },
      { user_id: 'user-2', friendly_name: 'Bob' },
      { user_id: 'user-1', friendly_name: 'Alice Again' },
      { user_id: null, friendly_name: 'Ignored' },
    ])

    expect(options).toEqual([
      { id: 'user-1', label: 'Alice' },
      { id: 'user-2', label: 'Bob' },
    ])
  })

  it('falls back to the user id when no friendly name is present', () => {
    const options = buildAssignmentUserOptions([{ user_id: 'user-3' }])

    expect(options).toEqual([{ id: 'user-3', label: 'user-3' }])
  })

  it('uses the current user as a fallback when no profile rows exist', () => {
    const options = buildAssignmentUserOptions([], 'current-user')

    expect(options).toEqual([{ id: 'current-user', label: 'current-user' }])
  })
})
