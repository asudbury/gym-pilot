import { describe, expect, it } from 'vitest'
import { resolveDashboardViewModel } from './dashboardLayout'

describe('resolveDashboardViewModel', () => {
  it('includes a user role even when it is not in the array', () => {
    const viewModel = resolveDashboardViewModel('trainer', ['client'])

    expect(viewModel.availableRoles).toEqual(['client', 'trainer'])
    expect(viewModel.layouts[0]?.key).toBe('trainer')
    expect(viewModel.shouldShowRoleSelector).toBe(true)
  })

  it('falls back to the default layout when no roles are available', () => {
    const viewModel = resolveDashboardViewModel(undefined, [])

    expect(viewModel.layouts[0]?.key).toBe('default')
    expect(viewModel.selectedLayoutKey).toBe('default')
  })
})
