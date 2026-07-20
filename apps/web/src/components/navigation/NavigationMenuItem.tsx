import { NavLink } from 'react-router-dom'
import { DecorativeIcon } from '../ui/DecorativeIcon'
import type { NavigationMenuItemProps } from '../../utils/navigationUtils'

export function NavigationMenuItem({
  to,
  children,
  onClick,
  className,
  icon,
}: NavigationMenuItemProps) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={[
        'inline-flex items-center gap-0 rounded-lg border border-transparent px-2 py-1.5 transition-all duration-200 hover:border-slate-400 hover:bg-slate-100 hover:font-semibold hover:shadow-sm',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon ? (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-slate-500 dark:text-slate-400">
          <DecorativeIcon icon={icon} className="h-4 w-4" />
        </span>
      ) : null}
      <span className="leading-none">{children}</span>
    </NavLink>
  )
}
