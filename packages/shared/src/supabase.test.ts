import { describe, expect, it, vi } from 'vitest'
import { ensureAuthenticatedSupabaseSession } from './supabase'

describe('ensureAuthenticatedSupabaseSession', () => {
  it('uses a sign-in session when signup does not return one', async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({
      data: {
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
        },
      },
      error: null,
    })
    const setSession = vi.fn().mockResolvedValue({
      data: {
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
        },
      },
      error: null,
    })

    const client = {
      auth: {
        signInWithPassword,
        setSession,
      },
    } as any

    await ensureAuthenticatedSupabaseSession(
      client,
      'user@example.com',
      'super-secret',
      {
        data: {
          user: { id: 'user-1' },
          session: null,
        },
        error: null,
      },
    )

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'super-secret',
    })
    expect(setSession).toHaveBeenCalledWith({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    })
  })
})
