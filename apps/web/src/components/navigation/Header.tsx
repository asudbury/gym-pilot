import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { FavouriteLinksMenu } from './FavouriteLinksMenu'
import { NavigationMenuList } from './NavigationMenuList'
import type { NavigationMenuListItem } from '../../utils/navigationUtils'
import { ResponsiveVisibility } from '../ResponsiveVisibility'
import { DecorativeIcon } from '../ui/DecorativeIcon'
import { getToneClass } from '../toneClasses'
import { Button } from '../Button'
import {
  navigationItemBaseClassName,
  navigationItemIconClassName,
} from './navigationItemStyles'

type HeaderProps = {
  appName: string
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
  mustChangePassword?: boolean
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
  favorites,
  homeFilters,
  desktopMenuItems,
  tabletMenuItems,
  mobileMenuItems,
  showAuthButton,
  user,
  mustChangePassword,
  folders,
  onFavoritesChange,
  onFoldersChange,
  onHomeFiltersChange,
  onAuthClick,
  mobileMenuOpen,
  onToggleMobileMenu,
}: HeaderProps) {
  const menuContainerRef = useRef<HTMLDivElement | null>(null)
  const headerUser =
    user && typeof user === 'object' && 'name' in user
      ? String((user as { name?: string }).name)
      : ''
  const headerUserEmail =
    user && typeof user === 'object' && 'email' in user
      ? String((user as { email?: string }).email)
      : ''
  const headerUserLabel = headerUser || headerUserEmail || 'Signed in'
  const showRestrictedBadge = Boolean(mustChangePassword)
  const showUserBadge = Boolean(headerUser || headerUserEmail)

  const handleAuthAction = () => {
    onAuthClick()
  }

  const menuLinkClassName = navigationItemBaseClassName

  useEffect(() => {
    if (!mobileMenuOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(event.target as Node)
      ) {
        onToggleMobileMenu()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [mobileMenuOpen, onToggleMobileMenu])

  return (
    <nav className="sticky top-0 z-30 h-16 border-b border-slate-200 bg-white text-slate-900 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <NavLink
              to="/"
              className="text-lg font-semibold text-slate-900 transition-colors dark:text-slate-100"
            >
              <span>{appName}</span>
            </NavLink>
          </div>
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
                {!showRestrictedBadge ? (
                  <NavigationMenuList
                    className="flex items-center gap-2"
                    items={desktopMenuItems}
                  />
                ) : null}
                {showAuthButton || Boolean(user) ? (
                  <button
                    type="button"
                    onClick={handleAuthAction}
                    className={menuLinkClassName}
                  >
                    <span className={navigationItemIconClassName}>
                      <DecorativeIcon
                        icon={user ? 'lock' : 'user'}
                        className="h-4 w-4"
                      />
                    </span>
                    <span className="leading-none">
                      {user ? 'Log out' : 'Login'}
                    </span>
                  </button>
                ) : null}
              </div>
              {showRestrictedBadge ? (
                <div className="mt-1 text-xs font-medium text-rose-700">
                  Password reset required
                </div>
              ) : null}
            </div>
          </ResponsiveVisibility>

          <ResponsiveVisibility visibleOn="tablet">
            <div className="relative">
              <Button
                type="button"
                onClick={onToggleMobileMenu}
                className={getToneClass(
                  'default',
                  'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium',
                )}
              >
                <DecorativeIcon icon="grid" className="h-4 w-4" />
                <span>Menu</span>
              </Button>
              {mobileMenuOpen ? (
                <div
                  ref={menuContainerRef}
                  className="fixed inset-x-3 top-16 z-40 max-h-[min(75vh,32rem)] overflow-y-auto rounded-2xl border border-white/70 bg-white/75 p-3 shadow-xl backdrop-blur-xl sm:absolute sm:right-0 sm:left-auto sm:top-full sm:mt-2 sm:w-80 sm:max-w-[calc(100vw-2rem)]"
                >
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
                          className={menuLinkClassName}
                        >
                          <span className={navigationItemIconClassName}>
                            <DecorativeIcon
                              icon={user ? 'lock' : 'user'}
                              className="h-4 w-4"
                            />
                          </span>
                          <span className="leading-none">
                            {user ? 'Logout' : 'Login'}
                          </span>
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
              <Button
                type="button"
                onClick={onToggleMobileMenu}
                className={getToneClass(
                  'default',
                  'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium',
                )}
              >
                <DecorativeIcon icon="grid" className="h-4 w-4" />
                <span>Menu</span>
              </Button>
              {mobileMenuOpen ? (
                <div
                  ref={menuContainerRef}
                  className="fixed inset-x-3 top-16 z-40 max-h-[min(75vh,32rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-lg sm:absolute sm:right-0 sm:left-auto sm:top-full sm:mt-2 sm:w-80 sm:max-w-[calc(100vw-2rem)]"
                >
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
                          className={menuLinkClassName}
                        >
                          <span className={navigationItemIconClassName}>
                            <DecorativeIcon
                              icon={user ? 'lock' : 'user'}
                              className="h-4 w-4"
                            />
                          </span>
                          <span className="leading-none">
                            {user ? 'Logout' : 'Login'}
                          </span>
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
