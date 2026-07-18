import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

type HeadingProps<T extends ElementType = 'h1'> = {
  as?: T
  children: ReactNode
  className?: string
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>

export function Heading1({
  as,
  children,
  className = '',
  ...props
}: HeadingProps) {
  const Component = as ?? 'h1'

  return (
    <Component
      className={`text-3xl font-semibold text-slate-900 transition-colors dark:text-slate-100 ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  )
}

export function Heading2({
  as,
  children,
  className = '',
  ...props
}: HeadingProps) {
  const Component = as ?? 'h2'

  return (
    <Component
      className={`text-xl font-semibold text-slate-900 transition-colors dark:text-slate-100 ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  )
}

export function Heading3({
  as,
  children,
  className = '',
  ...props
}: HeadingProps) {
  const Component = as ?? 'h3'

  return (
    <Component
      className={`text-lg font-semibold text-slate-900 transition-colors dark:text-slate-100 ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  )
}

export function Paragraph({
  as,
  children,
  className = '',
  ...props
}: HeadingProps) {
  const Component = as ?? 'p'

  return (
    <Component
      className={`text-sm font-semibold uppercase tracking-[0.35em] text-slate-500 transition-colors dark:text-slate-400 ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  )
}
