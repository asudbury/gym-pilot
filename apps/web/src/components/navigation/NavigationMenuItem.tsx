import { NavLink } from 'react-router-dom'
import type { NavigationMenuItemProps } from '../../utils/navigationUtils'

export function NavigationMenuItem({
  to,
  children,
  onClick,
  className,
}: NavigationMenuItemProps) {
  return (
    <NavLink to={to} onClick={onClick} className={className}>
      {children}
    </NavLink>
  )
}
