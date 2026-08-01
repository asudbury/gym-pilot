import { describe, expect, it } from 'vitest'
import { resolvePostLoginRedirectPath } from './authUtils'

describe('resolvePostLoginRedirectPath', () => {
  it('preserves the requested destination when it is a protected route', () => {
    expect(resolvePostLoginRedirectPath('/dashboard?tab=plans')).toBe(
      '/dashboard?tab=plans',
    )
  })

  it('falls back to the app home route for public or empty destinations', () => {
    expect(resolvePostLoginRedirectPath('/login')).toBe('/')
    expect(resolvePostLoginRedirectPath('')).toBe('/')
    expect(resolvePostLoginRedirectPath(undefined)).toBe('/')
  })
})
