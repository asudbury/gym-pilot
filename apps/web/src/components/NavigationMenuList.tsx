import type { ReactNode } from 'react'
import { NavigationMenuItem } from './NavigationMenuItem'

export type NavigationMenuListItem = {
  to: string
  label: ReactNode
  onClick?: () => void
  className?: string
}

type NavigationMenuListProps = {
  items: NavigationMenuListItem[]
  className?: string
}

type BuildNavigationMenuItemsOptions = {
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
  ]
}

export function NavigationMenuList({ items, className }: NavigationMenuListProps) {
  return (
    <div className={className}>
      {items.map((item) => (
        <NavigationMenuItem key={item.to} to={item.to} onClick={item.onClick} className={item.className}>
          {item.label}
        </NavigationMenuItem>
      ))}
    </div>
  )
}
