import type { ReactNode } from 'react'

type PageActionRowProps = {
  children: ReactNode
  className?: string
}

export function PageActionRow({
  children,
  className = '',
}: PageActionRowProps) {
  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`.trim()}
    >
      {children}
    </div>
  )
}

export function PageActionGroup({
  children,
  className = '',
}: PageActionRowProps) {
  return (
    <div
      className={`flex flex-col gap-2 sm:flex-row sm:flex-wrap ${className}`.trim()}
    >
      {children}
    </div>
  )
}

export function ModalShell({ children, className = '' }: PageActionRowProps) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 ${className}`.trim()}
    >
      {children}
    </div>
  )
}

export function ModalPanel({ children, className = '' }: PageActionRowProps) {
  return <div className={`w-full max-w-md ${className}`.trim()}>{children}</div>
}
