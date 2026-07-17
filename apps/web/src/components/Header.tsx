import { NavLink } from 'react-router-dom'
import { FavouriteLinksMenu } from './FavouriteLinksMenu'
import { NavigationMenuList } from './NavigationMenuList'
import type { NavigationMenuListItem } from '../utils/navigationUtils'
import { ResponsiveVisibility } from './ResponsiveVisibility'
import { getToneClass } from './toneClasses'

type HeaderProps = {
  appVersion: string
  favorites: Array<{ id: string; label: string; path: string }>
  homeFilters: {
    searchTerm: string
    selectedCategory: string | null
    showImages: boolean
  }
  desktopMenuItems: NavigationMenuListItem[]
  tabletMenuItems: NavigationMenuListItem[]
  mobileMenuItems: NavigationMenuListItem[]
  showAuthButton: boolean
  user: unknown
  onFavoritesChange: (favorites: Array<{ id: string; label: string; path: string }>) => void
  onHomeFiltersChange: (filters: { searchTerm: string; selectedCategory: string | null; showImages: boolean }) => void
  onAuthClick: () => void
  mobileMenuOpen: boolean
  onToggleMobileMenu: () => void
}

export function Header({
  appVersion,
  favorites,
  homeFilters,
  desktopMenuItems,
  tabletMenuItems,
  mobileMenuItems,
  showAuthButton,
  user,
  onFavoritesChange,
  onHomeFiltersChange,
  onAuthClick,
  mobileMenuOpen,
  onToggleMobileMenu,
}: HeaderProps) {
  const headerUser = user && typeof user === 'object' && 'name' in user ? String((user as { name?: string }).name) : ''
  const headerUserRole = user && typeof user === 'object' && 'role' in user ? String((user as { role?: string }).role) : ''
  const showUserBadge = Boolean(headerUser)

  const handleAuthAction = () => {
    if (user) {
      const confirmed = window.confirm('Are you sure you want to log out?')
      if (!confirmed) {
        return
      }
    }

    onAuthClick()
  }

  return (
    <nav className="sticky top-0 z-30 h-16 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col">
          <NavLink to="/" className="text-lg font-semibold text-slate-900">
            GymPilot
            {' '}
            <span className="text-[11px] font-medium tracking-[0.2em] text-slate-500">
              {`(v${appVersion})`}
            </span>
          </NavLink>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ResponsiveVisibility visibleOn="desktop">
            <div className="flex items-center gap-2">
              <FavouriteLinksMenu
                favorites={favorites}
                homeFilters={homeFilters}
                variant="header"
                onFavoritesChange={onFavoritesChange}
                onHomeFiltersChange={onHomeFiltersChange}
              />
              <NavigationMenuList className="flex items-center gap-2" items={desktopMenuItems} />
              {showUserBadge ? (
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700">
                  <span>{headerUser}</span>
                  {headerUserRole ? <span className="ml-2 text-xs uppercase tracking-wide text-slate-500">{headerUserRole}</span> : null}
                </div>
              ) : null}
              {(showAuthButton || Boolean(user)) ? (
                <button type="button" onClick={handleAuthAction} className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}>
                  {user ? 'Sign out' : 'Login'}
                </button>
              ) : null}
            </div>
          </ResponsiveVisibility>

          <ResponsiveVisibility visibleOn="tablet">
            <div className="relative">
              <button type="button" onClick={onToggleMobileMenu} className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}>
                Menu
              </button>
              {mobileMenuOpen ? (
                <div className="fixed inset-x-3 top-16 z-40 max-h-[min(75vh,32rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-xl sm:absolute sm:right-0 sm:left-auto sm:top-full sm:mt-2 sm:w-80 sm:max-w-[calc(100vw-2rem)]">
                  <div className="flex flex-col gap-2">
                    <FavouriteLinksMenu
                      favorites={favorites}
                      homeFilters={homeFilters}
                      onFavoritesChange={onFavoritesChange}
                      onHomeFiltersChange={onHomeFiltersChange}
                    />
                    <NavigationMenuList className="flex flex-col gap-2" items={tabletMenuItems} />
                    {(showAuthButton || Boolean(user)) ? (
                      <button type="button" onClick={handleAuthAction} className="rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                        {user ? 'Logout' : 'Login'}
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </ResponsiveVisibility>

          <ResponsiveVisibility visibleOn="mobile">
            <div className="relative">
              <button type="button" onClick={onToggleMobileMenu} className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}>
                Menu
              </button>
              {mobileMenuOpen ? (
                <div className="fixed inset-x-3 top-16 z-40 max-h-[min(75vh,32rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-xl sm:absolute sm:right-0 sm:left-auto sm:top-full sm:mt-2 sm:w-80 sm:max-w-[calc(100vw-2rem)]">
                  <div className="flex flex-col gap-2">
                    <FavouriteLinksMenu
                      favorites={favorites}
                      homeFilters={homeFilters}
                      onFavoritesChange={onFavoritesChange}
                      onHomeFiltersChange={onHomeFiltersChange}
                    />
                    <NavigationMenuList className="flex flex-col gap-2" items={mobileMenuItems} />
                    {(showAuthButton || Boolean(user)) ? (
                      <button type="button" onClick={handleAuthAction} className="rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                        {user ? 'Logout' : 'Login'}
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </ResponsiveVisibility>
        </div>
      </div>
    </nav>
  )
}
