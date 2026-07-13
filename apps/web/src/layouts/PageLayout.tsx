import type { ReactNode } from 'react'
import { appTokens } from '../styles/tokens'

type PageLayoutProps = {
  children: ReactNode
  className?: string
}

export function PageLayout({ children, className = '' }: PageLayoutProps) {
  return (
    <main className={appTokens.pageShell}>
      <div className={`mx-auto flex max-w-6xl flex-col gap-6 ${className}`.trim()}>
        {children}
      </div>
    </main>
  )
}
