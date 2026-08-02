import { type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import ToastContainer from '../components/ToastContainer';
import { getToneClass } from '../components/toneClasses';
import { DecorativeIcon } from '../components/ui/DecorativeIcon';
import { DesktopOnly } from '../components/visibility/DeviceVisibility';
import { appTokens } from '../constants/tokens';

type PageLayoutProps = {
  children: ReactNode
  className?: string
  goHomeLink?: boolean
}

export function PageLayout({
  children,
  className = '',
  goHomeLink = true,
}: PageLayoutProps) {
  const location = useLocation()
  const isHomePage = location.pathname === '/'

  return (
    <main className={appTokens.pageShell}>
      <div
        className={`flex flex-col ${className} ${'mx-auto max-w-6xl'}`.trim()}
      >
        <DesktopOnly>
          {goHomeLink && !isHomePage && (
            <div className="mb-4 flex flex-wrap gap-2">
              <NavLink
                to="/"
                className={getToneClass(
                  'default',
                  'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium',
                )}
              >
                <DecorativeIcon icon="home" className="h-4 w-4" />
                <span>Go Home</span>
              </NavLink>
            </div>
          )}
        </DesktopOnly>

        <div className="flex flex-col gap-6">{children}</div>
      </div>
      <ToastContainer />
    </main>
  )
}
