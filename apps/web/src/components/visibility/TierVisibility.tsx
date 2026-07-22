import type { ReactNode } from 'react'
import { TierDeviceVisibility } from './TierDeviceVisibility'

type TierVisibilityProps = {
  children: ReactNode
  fallback?: ReactNode
  tier?: string | null
}

export function FreeTierOnly(props: TierVisibilityProps) {
  return <TierDeviceVisibility {...props} allowedTiers={['free']} />
}

export function BronzeTierOrHigher(props: TierVisibilityProps) {
  return <TierDeviceVisibility {...props} minTier="bronze" />
}

export function SilverTierOrHigher(props: TierVisibilityProps) {
  return <TierDeviceVisibility {...props} minTier="silver" />
}

export function GoldTierOrHigher(props: TierVisibilityProps) {
  return <TierDeviceVisibility {...props} minTier="gold" />
}

export function PaidTierOnly(props: TierVisibilityProps) {
  return (
    <TierDeviceVisibility
      {...props}
      allowedTiers={['bronze', 'silver', 'gold']}
    />
  )
}

export function NotOnFreeTier(props: TierVisibilityProps) {
  return <PaidTierOnly {...props} />
}