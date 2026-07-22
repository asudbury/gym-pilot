import type {
  DeviceType,
  TierVisibilityRules,
} from '../features/visibility/domain/tierDeviceVisibility'

export type TierDeviceRules = TierVisibilityRules & {
  requireDevice?: DeviceType[]
}

export function isVisibleForTierDeviceRules(
  tier: string | null | undefined,
  deviceType: DeviceType,
  rules: TierDeviceRules = {},
) {
  const normalizedTier = (tier ?? 'free').toLowerCase()
  const minTier = rules.minTier?.toLowerCase()
  const allowedTiers = rules.allowedTiers?.map((value) => value.toLowerCase())
  const tierRank: Record<string, number> = {
    free: 0,
    bronze: 1,
    silver: 2,
    gold: 3,
  }

  if (minTier && (tierRank[normalizedTier] ?? 0) < (tierRank[minTier] ?? 0)) {
    return false
  }

  if (allowedTiers && !allowedTiers.includes(normalizedTier)) {
    return false
  }

  if (rules.visibleOn && rules.visibleOn.length > 0) {
    return rules.visibleOn.includes(deviceType)
  }

  if (rules.requireDevice && rules.requireDevice.length > 0) {
    return rules.requireDevice.includes(deviceType)
  }

  return true
}
