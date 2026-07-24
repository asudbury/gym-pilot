import { describe, expect, it } from 'vitest'
import { resolveUserActivityViewModel } from './userActivity'

describe('resolveUserActivityViewModel', () => {
  it('maps profile and activity rows into the view model', () => {
    const viewModel = resolveUserActivityViewModel(
      {
        user_id: 'u1',
        friendly_name: 'Ada',
        roles: ['client'],
        last_logged_in_at: '2025-01-01T00:00:00.000Z',
        previous_last_logged_in_at: '2024-12-01T00:00:00.000Z',
      },
      [
        {
          id: 'a1',
          event_type: 'login',
          event_data: { source: 'email', actor: 'Ada' },
          created_at: '2025-01-01T00:00:00.000Z',
        },
      ],
      new Map([['u1', 'ada@example.com']]),
    )

    expect(viewModel.profile?.name).toBe('Ada')
    expect(viewModel.profile?.email).toBe('ada@example.com')
    expect(viewModel.activityRows).toHaveLength(1)
    expect(viewModel.activityRows[0]?.eventType).toBe('login')
  })
})
