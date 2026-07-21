import type { ReactNode } from 'react'
import type { UserRole } from '@gym-pilot/types'
import type { DecorativeIconProps } from '../components/ui/DecorativeIcon'
import { getExercisePath, getExerciseSlug } from './exerciseRouteUtils'
import { exercises, exercisesSchema } from '@gym-pilot/shared'
import { navigationMeta } from './navigationMeta'
import { isVisibleForTierAndDevice } from '../features/visibility/domain/tierDeviceVisibility'
import type { DeviceType } from '../features/visibility/domain/tierDeviceVisibility'

export type NavigationMenuItemProps = {
  to: string
  children: ReactNode
  onClick?: () => void
  className?: string
  icon?: DecorativeIconProps['icon']
}

export type NavigationMenuListItem = {
  to: string
  label: ReactNode
  onClick?: () => void
  className?: string
  icon?: DecorativeIconProps['icon']
}

export type NavigationMenuListProps = {
  items: NavigationMenuListItem[]
  className?: string
}

export type BuildNavigationMenuItemsOptions = {
  plansCount: number
  assignmentsCount: number
  onItemClick?: () => void
  itemClassName?: string
  isAuthenticated?: boolean
  showTimetable?: boolean
  userRoles?: UserRole[]
  tier?: string | null
  deviceType?: DeviceType
}

export function buildNavigationMenuItems({
  onItemClick,
  itemClassName,
  isAuthenticated = false,
  showTimetable = true,
  userRoles = [],
  tier = 'free',
  deviceType = 'desktop',
}: BuildNavigationMenuItemsOptions): NavigationMenuListItem[] {
  const items: NavigationMenuListItem[] = []

  for (const meta of navigationMeta) {
    if (meta.requireAuth && !isAuthenticated) continue

    if (!isVisibleForTierAndDevice(tier, deviceType, meta.visibility)) continue

    if (meta.requiredRole) {
      const required = Array.isArray(meta.requiredRole)
        ? meta.requiredRole
        : [meta.requiredRole]
      const has =
        Array.isArray(userRoles) && required.some((r) => userRoles.includes(r))
      if (!has) continue
    }

    if (meta.requireClubId && !showTimetable) continue

    items.push({
      to: meta.to,
      label: meta.label,
      onClick: onItemClick,
      className: itemClassName,
      icon: meta.icon as any,
    })
  }

  return items
}

export async function copyExerciseLinkToClipboard(
  exerciseId: string,
): Promise<void> {
  const parsedExercises = exercisesSchema.parse(exercises)
  const exercise = parsedExercises.find((item) => item.id === exerciseId)
  const slug = exercise ? getExerciseSlug(exercise) : exerciseId
  const path = exercise ? getExercisePath(exercise) : `/exercise/${slug}`
  const baseUrl = new URL(
    import.meta.env.BASE_URL || '/',
    window.location.origin,
  )
  baseUrl.hash = path
  const shareUrl = baseUrl.toString()

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(shareUrl)
      return
    } catch {
      // Fall back to the legacy clipboard path below.
    }
  }

  const textArea = document.createElement('textarea')
  textArea.value = shareUrl
  textArea.setAttribute('readonly', '')
  textArea.style.position = 'fixed'
  textArea.style.top = '-9999px'
  textArea.style.left = '-9999px'
  document.body.appendChild(textArea)
  textArea.select()
  document.execCommand('copy')
  document.body.removeChild(textArea)
}
