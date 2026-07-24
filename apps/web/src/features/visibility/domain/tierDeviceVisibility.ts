export type DeviceType = 'mobile' | 'tablet' | 'desktop'

export type TierVisibilityRules = {
  minTier?: string
  allowedTiers?: string[]
  visibleOn?: DeviceType[]
}

const tierRank: Record<string, number> = {
  free: 0,
  bronze: 1,
  silver: 2,
  gold: 3,
}

export function getDeviceType(width?: number): DeviceType {
  const resolvedWidth = width ?? window.innerWidth

  if (resolvedWidth < 640) {
    return 'mobile'
  }

  if (resolvedWidth < 1024) {
    return 'tablet'
  }

  return 'desktop'
}

export function isVisibleForTierAndDevice(
  tier: string | null | undefined,
  device: DeviceType,
  rules: TierVisibilityRules = {},
) {
  const normalizedTier = (tier ?? 'free').toLowerCase()
  const minTier = rules.minTier?.toLowerCase()
  const allowedTiers = rules.allowedTiers?.map((value) => value.toLowerCase())

  if (minTier && (tierRank[normalizedTier] ?? 0) < (tierRank[minTier] ?? 0)) {
    return false
  }

  if (allowedTiers && !allowedTiers.includes(normalizedTier)) {
    return false
  }

  if (rules.visibleOn && rules.visibleOn.length > 0) {
    return rules.visibleOn.includes(device)
  }

  return true
}
