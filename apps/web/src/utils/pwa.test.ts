import { describe, expect, it } from 'vitest'
import { getInstallHint, isAppleDevice, isInstalledAsApp } from './pwa'

describe('pwa helpers', () => {
  it('detects iPhone Safari user agents', () => {
    expect(
      isAppleDevice(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Version/17.0 Mobile/15E148 Safari/604.1',
      ),
    ).toBe(true)
  })

  it('detects standalone app mode', () => {
    expect(isInstalledAsApp({ standalone: true } as unknown as Navigator)).toBe(true)
  })

  it('returns an iOS-specific install hint', () => {
    expect(getInstallHint(true, false)).toContain('Add to Home Screen')
  })
})
