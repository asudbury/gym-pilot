import { NavLink } from 'react-router-dom'
import { FavouriteLinksMenu } from './FavouriteLinksMenu'
import { NavigationMenuList } from './NavigationMenuList'
import type { NavigationMenuListItem } from '../../utils/navigationUtils'
import { ResponsiveVisibility } from '../ResponsiveVisibility'
import { DecorativeIcon } from '../ui/DecorativeIcon'
import { getToneClass } from '../toneClasses'

type HeaderProps = {
  appName: string
  appVersion: string
  showVersion: boolean
  favorites: Array<{ id: string; label: string; path: string }>
  folders: string[]
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
  onFavoritesChange: (
    favorites: Array<{ id: string; label: string; path: string }>,
  ) => void
  onFoldersChange: (folders: string[]) => void
  onHomeFiltersChange: (filters: {
    searchTerm: string
    selectedCategory: string | null
    showImages: boolean
  }) => void
  onAuthClick: () => void
  mobileMenuOpen: boolean
  onToggleMobileMenu: () => void
}

export function Header({
  appName,
  appVersion,
  showVersion,
  favorites,
  homeFilters,
  desktopMenuItems,
  tabletMenuItems,
  mobileMenuItems,
  showAuthButton,
  user,
  folders,
  onFavoritesChange,
  onFoldersChange,
  onHomeFiltersChange,
  onAuthClick,
  mobileMenuOpen,
  onToggleMobileMenu,
}: HeaderProps) {
  const headerUser =
    user && typeof user === 'object' && 'name' in user
      ? String((user as { name?: string }).name)
      : ''
  const headerUserEmail =
    user && typeof user === 'object' && 'email' in user
      ? String((user as { email?: string }).email)
      : ''
  const headerUserLabel = headerUser || headerUserEmail || 'Signed in'
  const showUserBadge = Boolean(headerUser || headerUserEmail)

  const handleAuthAction = () => {
    onAuthClick()
  }

  return (
    <nav className="sticky top-0 z-30 h-16 border-b border-slate-200 bg-white text-slate-900 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col">
          <NavLink
            to="/"
            className="text-lg font-semibold text-slate-900 transition-colors dark:text-slate-100"
          >
            <span>{appName}</span>
            {showVersion ? (
              <span className="ml-2 text-[11px] font-medium tracking-[0.2em] text-slate-500">
                {`(v${appVersion})`}
              </span>
            ) : null}
          </NavLink>
          {showUserBadge ? (
            <div>
              <span>{headerUserLabel}</span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ResponsiveVisibility visibleOn="desktop">
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <FavouriteLinksMenu
                  favorites={favorites}
                  folders={folders}
                  homeFilters={homeFilters}
                  variant="header"
                  onFavoritesChange={onFavoritesChange}
                  onFoldersChange={onFoldersChange}
                  onHomeFiltersChange={onHomeFiltersChange}
                />
                <NavigationMenuList
                  className="flex items-center gap-2"
                  items={desktopMenuItems}
                />
                {showAuthButton || Boolean(user) ? (
                  <button
                    type="button"
                    onClick={handleAuthAction}
                    className={getToneClass(
                      'default',
                      'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium',
                    )}
                  >
                    <DecorativeIcon icon={user ? 'lock' : 'user'} className="h-4 w-4" />
                    <span>{user ? 'Log out' : 'Login'}</span>
                  </button>
                ) : null}
              </div>
            </div>
          </ResponsiveVisibility>

          <ResponsiveVisibility visibleOn="tablet">
            <div className="relative">
              <button
                type="button"
                onClick={onToggleMobileMenu}
                className={getToneClass(
                  'default',
                  'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium',
                )}
              >
                <DecorativeIcon icon="grid" className="h-4 w-4" />
                <span>Menu</span>
              </button>
              {mobileMenuOpen ? (
                <div className="fixed inset-x-3 top-16 z-40 max-h-[min(75vh,32rem)] overflow-y-auto rounded-2xl border border-white/70 bg-white/75 p-3 shadow-xl backdrop-blur-xl sm:absolute sm:right-0 sm:left-auto sm:top-full sm:mt-2 sm:w-80 sm:max-w-[calc(100vw-2rem)]">
                  <div className="flex flex-col gap-2">
                    <FavouriteLinksMenu
                      favorites={favorites}
                      folders={folders}
                      homeFilters={homeFilters}
                      onFavoritesChange={onFavoritesChange}
                      onFoldersChange={onFoldersChange}
                      onHomeFiltersChange={onHomeFiltersChange}
                    />
                    <NavigationMenuList
                      className="flex flex-col gap-2"
                      items={tabletMenuItems}
                    />
                    <div className="mt-2 flex flex-col gap-2 border-t border-slate-200 pt-3">
                      {showAuthButton || Boolean(user) ? (
                        <button
                          type="button"
                          onClick={handleAuthAction}
                          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          <DecorativeIcon icon={user ? 'lock' : 'user'} className="h-4 w-4" />
                          <span>{user ? 'Logout' : 'Login'}</span>
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </ResponsiveVisibility>

          <ResponsiveVisibility visibleOn="mobile">
            <div className="relative">
              <button
                type="button"
                onClick={onToggleMobileMenu}
                className={getToneClass(
                  'default',
                  'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium',
                )}
              >
                <DecorativeIcon icon="grid" className="h-4 w-4" />
                <span>Menu</span>
              </button>
              {mobileMenuOpen ? (
                <div className="fixed inset-x-3 top-16 z-40 max-h-[min(75vh,32rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-lg sm:absolute sm:right-0 sm:left-auto sm:top-full sm:mt-2 sm:w-80 sm:max-w-[calc(100vw-2rem)]">
                  <div className="flex flex-col gap-2">
                    <FavouriteLinksMenu
                      favorites={favorites}
                      folders={folders}
                      homeFilters={homeFilters}
                      onFavoritesChange={onFavoritesChange}
                      onFoldersChange={onFoldersChange}
                      onHomeFiltersChange={onHomeFiltersChange}
                    />
                    <NavigationMenuList
                      className="flex flex-col gap-2"
                      items={mobileMenuItems}
                    />
                    <div className="mt-2 flex flex-col gap-2 border-t border-slate-200 pt-3">
                      {showAuthButton || Boolean(user) ? (
                        <button
                          type="button"
                          onClick={handleAuthAction}
                          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          <DecorativeIcon icon={user ? 'lock' : 'user'} className="h-4 w-4" />
                          <span>{user ? 'Logout' : 'Login'}</span>
                        </button>
                      ) : null}
                    </div>
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
