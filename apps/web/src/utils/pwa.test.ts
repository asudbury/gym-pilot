import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getInstallHint, isAppleDevice, isInstalledAsApp } from './pwa'

describe('pwa helpers', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'window', {
      value: {
        location: { hostname: 'localhost' },
        navigator: { userAgent: 'Mozilla/5.0' },
        matchMedia: vi.fn(() => ({ matches: false })),
      },
      configurable: true,
    })
  })
  it('detects iPhone Safari user agents', () => {
    expect(
      isAppleDevice(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Version/17.0 Mobile/15E148 Safari/604.1',
      ),
    ).toBe(true)
  })

  it('detects standalone app mode', () => {
    expect(isInstalledAsApp({ standalone: true } as unknown as Navigator)).toBe(
      true,
    )
  })

  it('returns an iOS-specific install hint', () => {
    expect(getInstallHint(true, false)).toContain('Add to Home Screen')
  })
})
