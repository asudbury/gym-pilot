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
      <div
        className={`flex flex-col ${className} ${'mx-auto w-full max-w-6xl px-3 sm:px-6 lg:px-8'}`.trim()}
      >
        <div className="flex flex-col gap-6">{children}</div>
      </div>
      <ToastContainer />
    </main>
  )
}
