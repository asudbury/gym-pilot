import { useEffect, useState, type ReactNode } from 'react'
import {
  getDeviceType,
  isVisibleForTierAndDevice,
  type DeviceType,
  type TierVisibilityRules,
} from '../../features/visibility/domain/tierDeviceVisibility'

type TierDeviceVisibilityProps = TierVisibilityRules & {
  children: ReactNode
  fallback?: ReactNode
  tier?: string | null
}

export function useDeviceType() {
  const [device, setDevice] = useState<DeviceType>(() => {
    if (typeof window === 'undefined') {
      return 'desktop'
    }

    return getDeviceType(window.innerWidth)
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const handleResize = () => {
      setDevice(getDeviceType(window.innerWidth))
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return device
}

export function TierDeviceVisibility({
  children,
  fallback = null,
  tier,
  ...rules
}: TierDeviceVisibilityProps) {
  const device = useDeviceType()
  const isVisible = isVisibleForTierAndDevice(tier, device, rules)

  return <>{isVisible ? children : fallback}</>
}
