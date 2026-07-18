import type { ReactNode } from 'react'
import { getExercisePath, getExerciseSlug } from './exerciseRouteUtils'
import { exercises, exercisesSchema } from '@gym-pilot/shared'

export type NavigationMenuItemProps = {
  to: string
  children: ReactNode
  onClick?: () => void
  className?: string
}

export type NavigationMenuListItem = {
  to: string
  label: ReactNode
  onClick?: () => void
  className?: string
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
}

export function buildNavigationMenuItems({
  onItemClick,
  itemClassName,
  isAuthenticated = false,
}: BuildNavigationMenuItemsOptions): NavigationMenuListItem[] {
  const protectedItems: NavigationMenuListItem[] = isAuthenticated
    ? [
        {
          to: '/exercises',
          label: 'Exercises',
          onClick: onItemClick,
          className: itemClassName,
        },
        {
          to: '/plans',
          label: 'Plans',
          onClick: onItemClick,
          className: itemClassName,
        },
        {
          to: '/assignments',
          label: 'Assignments',
          onClick: onItemClick,
          className: itemClassName,
        },
      ]
    : []

  const adminItem: NavigationMenuListItem[] = isAuthenticated
    ? [{
        to: '/admin',
        label: 'Admin',
        onClick: onItemClick,
        className: itemClassName,
      }]
    : []

  return [
    ...protectedItems,
    ...adminItem,
    {
      to: '/help',
      label: 'Help',
      onClick: onItemClick,
      className: itemClassName,
    },
  ]
}

export async function copyExerciseLinkToClipboard(exerciseId: string): Promise<void> {
  const parsedExercises = exercisesSchema.parse(exercises)
  const exercise = parsedExercises.find((item) => item.id === exerciseId)
  const slug = exercise ? getExerciseSlug(exercise) : exerciseId
  const path = exercise ? getExercisePath(exercise) : `/exercise/${slug}`
  const baseUrl = new URL(import.meta.env.BASE_URL || '/', window.location.origin)
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