import { describe, expect, it } from 'vitest'
import { resolveAuthProtectionEnabled } from './config'

describe('resolveAuthProtectionEnabled', () => {
  it('keeps auth protection enabled by default', () => {
    expect(
      resolveAuthProtectionEnabled({
        bypassRequested: false,
        hostname: 'localhost',
        isDevelopment: true,
      }),
    ).toBe(true)
  })

  it('allows bypass only on safe local development hosts', () => {
    expect(
      resolveAuthProtectionEnabled({
        bypassRequested: true,
        hostname: 'localhost',
        isDevelopment: true,
      }),
    ).toBe(false)
  })

  it('does not allow bypass outside local development', () => {
    expect(
      resolveAuthProtectionEnabled({
        bypassRequested: true,
        hostname: 'gym-pilot.example.com',
        isDevelopment: false,
      }),
    ).toBe(true)
  })
})
