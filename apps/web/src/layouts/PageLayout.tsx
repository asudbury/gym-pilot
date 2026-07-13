import { NavLink, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { appTokens } from '../constants/tokens'
import { getToneClass } from '../components/toneClasses'

type PageLayoutProps = {
  children: ReactNode
  className?: string
}

export function PageLayout({ children, className = '' }: PageLayoutProps) {
  const location = useLocation()
  const isHomePage = location.pathname === '/'

  return (
    <main className={appTokens.pageShell}>
      <div className={`mx-auto flex max-w-6xl flex-col ${className}`.trim()}>
        {!isHomePage && (
          <div className="mb-4">
            <NavLink
              to="/"
              className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}
            >
              <span>Go Home</span>
            </NavLink>
          </div>
        )}
        <div className="flex flex-col gap-6">
          {children}
        </div>
      </div>
    </main>
  )
}
