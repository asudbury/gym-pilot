import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import type { NavigationMenuListItem } from '../../utils/navigationUtils';
import { getToneClass } from '../toneClasses';
import { Button } from '../ui/Button';
import { DecorativeIcon } from '../ui/DecorativeIcon';
import { StatusMessageNotification } from '../ui/StatusMessageNotification';
import { ResponsiveVisibility } from '../visibility/ResponsiveVisibility';
import { FavouriteLinksMenu } from './FavouriteLinksMenu';
import { HomeButton } from './HomeButton';
import {
    navigationItemBaseClassName,
    navigationItemIconClassName,
} from './navigationItemStyles';
import { NavigationMenuList } from './NavigationMenuList';

type HeaderProps = {
  appName: string
  desktopMenuItems: NavigationMenuListItem[]
  tabletMenuItems: NavigationMenuListItem[]
  mobileMenuItems: NavigationMenuListItem[]
  mobileMenuOpen: boolean
  user: unknown
  mustChangePassword?: boolean
  onAuthClick: () => void
  onToggleMobileMenu: () => void
}

export function Header({
  appName,
  desktopMenuItems,
  tabletMenuItems,
  mobileMenuItems,
  mobileMenuOpen,
  user,
  mustChangePassword,
  onAuthClick,
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

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node | null

      if (!target || !(target instanceof Node)) {
        return
      }

      const isToggleTarget =
        target instanceof HTMLElement &&
        target.closest('[data-mobile-menu-toggle]')

      if (isToggleTarget) {
        return
      }

      if (
        menuContainerRef.current &&
        menuContainerRef.current.contains(target)
      ) {
        return
      }

      onToggleMobileMenu()
    }

    document.addEventListener('click', handleDocumentClick, true)

    return () => {
      document.removeEventListener('click', handleDocumentClick, true)
    }
  }, [mobileMenuOpen, onToggleMobileMenu])

  return (
    <nav className="sticky top-0 z-30 h-16 w-full max-w-full border-b border-slate-200 bg-white text-slate-900 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex h-full w-full min-w-0 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / user information */}
        <div className="flex min-w-0 flex-shrink flex-col">
          <div className="flex min-w-0 items-center gap-2">
            <NavLink
              to="/"
              className="block min-w-0 max-w-full truncate text-lg font-semibold text-slate-900 transition-colors dark:text-slate-100"
            >
              <span className="block truncate">{appName}</span>
            </NavLink>
          </div>

          {showUserBadge ? (
            <div className="min-w-0 max-w-full">
              <span className="block max-w-full truncate text-xs">
                {headerUserLabel}
              </span>
            </div>
          ) : null}
        </div>

        {/* Navigation */}
        <div className="flex min-w-0 flex-shrink flex-wrap items-center justify-end gap-2">
          {/* Desktop navigation */}
          <ResponsiveVisibility visibleOn="desktop">
            <div className="flex min-w-0 flex-wrap items-end justify-end gap-2">
              <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
                <HomeButton
                  variant="desktop"
                  onToggleMobileMenu={onToggleMobileMenu}
                />

                <FavouriteLinksMenu variant="header" />

                {!showRestrictedBadge ? (
                  <NavigationMenuList
                    className="flex min-w-0 flex-wrap items-center justify-end gap-2"
                    items={desktopMenuItems.filter(
                      (item) => item.to !== '/',
                    )}
                  />
                ) : null}

                <button
                  type="button"
                  onClick={handleAuthAction}
                  className={`${menuLinkClassName} max-w-full`}
                >
                  <span className={navigationItemIconClassName}>
                    <DecorativeIcon
                      icon={user ? 'lock' : 'user'}
                      className="h-4 w-4"
                    />
                  </span>

                  <span className="truncate leading-none">
                    {user ? 'Log out' : 'Login'}
                  </span>
                </button>
              </div>

              {showRestrictedBadge ? (
                <StatusMessageNotification
                  message="Password reset required"
                  tone="error"
                />
              ) : null}
            </div>
          </ResponsiveVisibility>

          {/* Tablet navigation */}
          <ResponsiveVisibility visibleOn="tablet">
            <div className="relative min-w-0">
              <HomeButton variant="tablet" />

              <Button
                data-mobile-menu-toggle
                onClick={onToggleMobileMenu}
                className={getToneClass(
                  'default',
                  'inline-flex max-w-full items-center gap-2 px-4 py-2 text-sm font-medium',
                )}
              >
                <DecorativeIcon icon="grid" className="h-4 w-4 shrink-0" />
                <span>Menu</span>
              </Button>

              {mobileMenuOpen ? (
                <div
                  ref={menuContainerRef}
                  className="fixed inset-x-3 top-16 z-40 box-border max-h-[min(75vh,32rem)] max-w-[calc(100vw-1.5rem)] overflow-x-hidden overflow-y-auto rounded-2xl border border-white/70 bg-white/75 p-3 shadow-xl backdrop-blur-xl sm:absolute sm:right-0 sm:left-auto sm:top-full sm:mt-2 sm:w-80 sm:max-w-[calc(100vw-2rem)] dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex min-w-0 flex-col gap-2">
                    <FavouriteLinksMenu />

                    <NavigationMenuList
                      className="flex min-w-0 flex-col gap-2"
                      items={tabletMenuItems.filter(
                        (item) => item.to !== '/',
                      )}
                    />

                    <div className="mt-2 flex min-w-0 flex-col gap-2 border-t border-slate-200 pt-3">
                      <button
                        type="button"
                        onClick={handleAuthAction}
                        className={`${menuLinkClassName} max-w-full`}
                      >
                        <span className={navigationItemIconClassName}>
                          <DecorativeIcon
                            icon={user ? 'lock' : 'user'}
                            className="h-4 w-4"
                          />
                        </span>

                        <span className="truncate leading-none">
                          {user ? 'Logout' : 'Login'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </ResponsiveVisibility>

          {/* Mobile navigation */}
          <ResponsiveVisibility visibleOn="mobile">
            <div className="relative min-w-0">
              <HomeButton variant="mobile" />

              <Button
                data-mobile-menu-toggle
                onClick={onToggleMobileMenu}
                className={getToneClass(
                  'default',
                  'inline-flex max-w-full items-center gap-2 px-4 py-2 text-sm font-medium',
                )}
              >
                <DecorativeIcon icon="grid" className="h-4 w-4 shrink-0" />
                <span>Menu</span>
              </Button>

              {mobileMenuOpen ? (
                <div
                  ref={menuContainerRef}
                  className="fixed inset-x-3 top-16 z-40 box-border max-h-[min(75vh,32rem)] max-w-[calc(100vw-1.5rem)] overflow-x-hidden overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-lg sm:absolute sm:right-0 sm:left-auto sm:top-full sm:mt-2 sm:w-80 sm:max-w-[calc(100vw-2rem)] dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex min-w-0 flex-col gap-2">
                    <FavouriteLinksMenu />

                    <NavigationMenuList
                      className="flex min-w-0 flex-col gap-2"
                      items={mobileMenuItems.filter(
                        (item) => item.to !== '/',
                      )}
                    />

                    <div className="mt-2 flex min-w-0 flex-col gap-2 border-t border-slate-200 pt-3">
                      <button
                        type="button"
                        onClick={handleAuthAction}
                        className={`${menuLinkClassName} max-w-full`}
                      >
                        <span className={navigationItemIconClassName}>
                          <DecorativeIcon
                            icon={user ? 'lock' : 'user'}
                            className="h-4 w-4"
                          />
                        </span>

                        <span className="truncate leading-none">
                          {user ? 'Logout' : 'Login'}
                        </span>
                      </button>
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