import { type ReactNode } from 'react'
import ToastContainer from '../components/ToastContainer'
import { appTokens } from '../constants/tokens'

type PageLayoutProps = {
  children: ReactNode
  className?: string
}

export function PageLayout({ children, className = '' }: PageLayoutProps) {
  return (
    <main className={appTokens.pageShell}>
      <div className={`flex flex-col ${className}`.trim()}>
        <div className="flex flex-col gap-6">{children}</div>
      </div>
      <ToastContainer />
    </main>
  )
}
