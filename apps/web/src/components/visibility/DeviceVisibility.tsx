import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'
import { ResponsiveVisibility } from '../ResponsiveVisibility'

type DeviceVisibilityProps<T extends ElementType = 'div'> = {
  as?: T
  children: ReactNode
  className?: string
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>

export function DesktopOnly<T extends ElementType = 'div'>(
  props: DeviceVisibilityProps<T>,
) {
  return <ResponsiveVisibility {...props} visibleOn="desktop" />
}

export function TabletOnly<T extends ElementType = 'div'>(
  props: DeviceVisibilityProps<T>,
) {
  return <ResponsiveVisibility {...props} visibleOn="tablet" />
}

export function MobileOnly<T extends ElementType = 'div'>(
  props: DeviceVisibilityProps<T>,
) {
  return <ResponsiveVisibility {...props} visibleOn="mobile" />
}

export function NotOnDesktop<T extends ElementType = 'div'>(
  props: DeviceVisibilityProps<T>,
) {
  return <ResponsiveVisibility {...props} hiddenOn="desktop" />
}