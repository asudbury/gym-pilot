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
      className={`text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight text-slate-900 transition-colors dark:text-slate-100 ${className}`.trim()}
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
      className={`text-xl sm:text-2xl lg:text-3xl font-semibold leading-tight text-slate-900 transition-colors dark:text-slate-100 ${className}`.trim()}
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
      className={`text-lg sm:text-xl font-semibold leading-snug text-slate-900 transition-colors dark:text-slate-100 ${className}`.trim()}
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
      className={`text-sm font-semibold tracking-[0.25em] text-slate-500 transition-colors dark:text-slate-400 ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  )
}

export function UpperCaseParagraph({
  as,
  children,
  className = '',
  ...props
}: HeadingProps) {
  const Component = as ?? 'p'

  return (
    <Component
      className={`text-sm font-semibold uppercase tracking-[0.25em] text-slate-500 transition-colors dark:text-slate-400 ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  )
}
