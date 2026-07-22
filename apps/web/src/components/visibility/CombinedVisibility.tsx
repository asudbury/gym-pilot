import type { ReactNode } from 'react'
import { DesktopOnly, MobileOnly, TabletOnly } from './DeviceVisibility'
import {
  BronzeTierOrHigher,
  GoldTierOrHigher,
  PaidTierOnly,
  SilverTierOrHigher,
} from './TierVisibility'

type CombinedVisibilityProps = {
  children: ReactNode
  tier?: string | null
}

export function GoldDesktopOnly(props: CombinedVisibilityProps) {
  return (
    <GoldTierOrHigher tier={props.tier}>
      <DesktopOnly>{props.children}</DesktopOnly>
    </GoldTierOrHigher>
  )
}

export function SilverDesktopOnly(props: CombinedVisibilityProps) {
  return (
    <SilverTierOrHigher tier={props.tier}>
      <DesktopOnly>{props.children}</DesktopOnly>
    </SilverTierOrHigher>
  )
}

export function BronzeDesktopOnly(props: CombinedVisibilityProps) {
  return (
    <BronzeTierOrHigher tier={props.tier}>
      <DesktopOnly>{props.children}</DesktopOnly>
    </BronzeTierOrHigher>
  )
}

export function PaidTierDesktopOnly(props: CombinedVisibilityProps) {
  return (
    <PaidTierOnly tier={props.tier}>
      <DesktopOnly>{props.children}</DesktopOnly>
    </PaidTierOnly>
  )
}

export function PaidTierTabletOnly(props: CombinedVisibilityProps) {
  return (
    <PaidTierOnly tier={props.tier}>
      <TabletOnly>{props.children}</TabletOnly>
    </PaidTierOnly>
  )
}

export function PaidTierMobileOnly(props: CombinedVisibilityProps) {
  return (
    <PaidTierOnly tier={props.tier}>
      <MobileOnly>{props.children}</MobileOnly>
    </PaidTierOnly>
  )
}