import type { ReactNode } from 'react'

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
}

export function buildNavigationMenuItems({
  onItemClick,
  itemClassName,
}: BuildNavigationMenuItemsOptions): NavigationMenuListItem[] {
  return [
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
    {
      to: '/admin',
      label: 'Admin',
      onClick: onItemClick,
      className: itemClassName,
    },
    {
      to: '/help',
      label: 'Help',
      onClick: onItemClick,
      className: itemClassName,
    },
  ]
}

export async function copyExerciseLinkToClipboard(exerciseId: string): Promise<void> {

    const url = `${window.location.origin}/exercise/${exerciseId}`

    try {
      await navigator.clipboard.writeText(url)
    } catch {
    }
}