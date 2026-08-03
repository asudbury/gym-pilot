import { NavLink } from 'react-router-dom'
import { DecorativeIcon } from '../../../components/ui/DecorativeIcon'
import { MobileOnly } from '../../../components/visibility/DeviceVisibility'
import { useAppShell } from '../hooks/useAppShell'

export function BottomNavigation() {
  const useBottomNavigation = false // Set this to false to disable the bottom navigation
  const { bottomNavigationItems } = useAppShell()

  if (!useBottomNavigation) {
    return null
  }

  return (
    <MobileOnly>
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white shadow-t-md dark:border-slate-700 dark:bg-slate-950">
        <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
          {bottomNavigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex h-full w-full flex-col items-center justify-center gap-1 py-3.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-slate-900 dark:text-slate-50'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`
              }
              onClick={item.onClick}
            >
              <DecorativeIcon icon={item.icon} className="h-6 w-6" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </MobileOnly>
  )
}
