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
