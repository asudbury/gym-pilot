import type { HTMLAttributes, ReactNode } from 'react'

type PanelVariant = 'default' | 'muted' | 'white'
type PanelPadding = 'sm' | 'md' | 'lg'

type PanelProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode
  className?: string
  variant?: PanelVariant
  padding?: PanelPadding
}

export function Panel({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  ...props
}: PanelProps) {
  const variantClassName = variant === 'muted' ? 'bg-slate-50' : 'bg-white'
  const paddingClassName =
    padding === 'sm' ? 'p-3' : padding === 'lg' ? 'p-5' : 'p-4'

  return (
    <div
      className={`rounded-2xl border border-slate-200 ${variantClassName} ${paddingClassName} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  )
}
