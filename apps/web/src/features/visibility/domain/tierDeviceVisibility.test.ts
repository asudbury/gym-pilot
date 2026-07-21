import { describe, expect, it } from 'vitest'
import { isVisibleForTierAndDevice } from './tierDeviceVisibility'

describe('isVisibleForTierAndDevice', () => {
  it('allows free tier access by default', () => {
    expect(
      isVisibleForTierAndDevice('free', 'desktop', {
        minTier: 'free',
      }),
    ).toBe(true)
  })

  it('blocks lower-tier access for higher-tier rules', () => {
    expect(
      isVisibleForTierAndDevice('free', 'desktop', { minTier: 'bronze' }),
    ).toBe(false)
  })

  it('allows the required tier when the user meets the minimum', () => {
    expect(
      isVisibleForTierAndDevice('bronze', 'desktop', { minTier: 'bronze' }),
    ).toBe(true)
  })

  it('respects allowed tiers', () => {
    expect(
      isVisibleForTierAndDevice('silver', 'desktop', {
        allowedTiers: ['bronze', 'gold'],
      }),
    ).toBe(false)
  })

  it('respects visibleOn device rules', () => {
    expect(
      isVisibleForTierAndDevice('free', 'mobile', {
        visibleOn: ['desktop', 'tablet'],
      }),
    ).toBe(false)
    expect(
      isVisibleForTierAndDevice('free', 'tablet', {
        visibleOn: ['desktop', 'tablet'],
      }),
    ).toBe(true)
  })
})
