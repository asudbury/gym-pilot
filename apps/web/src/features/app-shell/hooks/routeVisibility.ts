import type { TierVisibilityRules } from '../../visibility/domain/tierDeviceVisibility'

export const routeVisibilityRules: Record<
  string,
  TierVisibilityRules | undefined
> = {
  '/record-session': {
    minTier: 'free',
    visibleOn: ['desktop', 'tablet'],
  },
  '/sessions': {
    minTier: 'free',
    visibleOn: ['desktop', 'tablet', 'mobile'],
  },
}
