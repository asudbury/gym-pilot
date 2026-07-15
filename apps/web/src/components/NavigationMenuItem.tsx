import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

type NavigationMenuItemProps = {
  to: string
  children: ReactNode
  onClick?: () => void
  className?: string
}

export function NavigationMenuItem({ to, children, onClick, className }: NavigationMenuItemProps) {
  return (
    <NavLink to={to} onClick={onClick} className={className}>
      {children}
    </NavLink>
  )
}
