import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createSupabaseAdminAuthUser,
  getSupabaseAuthUserById,
  listSupabaseAuthUsers,
} from './adminAuth'

const invoke = vi.fn()

vi.mock('./supabase', () => ({
  getSupabaseClient: () => ({
    functions: {
      invoke,
    },
  }),
}))

describe('adminAuth', () => {
  beforeEach(() => {
    invoke.mockReset()
  })

  it('invokes the admin management function when listing auth users', async () => {
    invoke.mockResolvedValue({
      data: {
        users: [{ id: 'user-1', email: 'user@example.com' }],
      },
      error: null,
    })

    await expect(listSupabaseAuthUsers()).resolves.toEqual([
      { id: 'user-1', email: 'user@example.com' },
    ])

    expect(invoke).toHaveBeenCalledWith('admin-user-management', {
      body: {
        action: 'list-auth-users',
      },
    })
  })

  it('passes create-user payloads to the admin management function', async () => {
    invoke.mockResolvedValue({
      data: {
        user: { id: 'user-2', email: 'new@example.com' },
      },
      error: null,
    })

    await expect(
      createSupabaseAdminAuthUser({
        email: 'new@example.com',
        password: 'temp-pass',
        passwordChangeRequired: true,
      }),
    ).resolves.toEqual({
      id: 'user-2',
      email: 'new@example.com',
    })

    expect(invoke).toHaveBeenCalledWith('admin-user-management', {
      body: {
        action: 'create-auth-user',
        email: 'new@example.com',
        password: 'temp-pass',
        passwordChangeRequired: true,
      },
    })
  })

  it('returns a specific auth user when requested', async () => {
    invoke.mockResolvedValue({
      data: {
        user: { id: 'user-3', email: 'lookup@example.com' },
      },
      error: null,
    })

    await expect(getSupabaseAuthUserById('user-3')).resolves.toEqual({
      id: 'user-3',
      email: 'lookup@example.com',
    })
  })
})
