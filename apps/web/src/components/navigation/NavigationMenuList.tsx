import { NavigationMenuItem } from './NavigationMenuItem'
import type { NavigationMenuListProps } from '../../utils/navigationUtils'

export function NavigationMenuList({
  items,
  className,
}: NavigationMenuListProps) {
  return (
    <div className={className}>
      {items.map((item: NavigationMenuListProps['items'][number]) => (
        <NavigationMenuItem
          key={item.to}
          to={item.to}
          onClick={item.onClick}
          className={item.className}
          icon={item.icon}
        >
          {item.label}
        </NavigationMenuItem>
      ))}
    </div>
  )
}
