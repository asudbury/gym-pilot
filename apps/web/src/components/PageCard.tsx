import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'
import { appTokens } from '../styles/tokens'

type PageCardProps<T extends ElementType = 'div'> = {
  as?: T
  children: ReactNode
  className?: string
  padding?: 'default' | 'compact' | 'spacious' | 'centered'
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>

export function PageCard<T extends ElementType = 'div'>({
  as,
  children,
  className = '',
  padding = 'default',
  ...props
}: PageCardProps<T>) {
  const Component = as ?? 'div'

  const paddingClass = {
    default: 'p-6 sm:p-8',
    compact: 'p-5',
    spacious: 'p-8',
    centered: 'p-8 text-center',
  }[padding]

  return (
    <Component
      className={`${appTokens.surface} ${paddingClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  )
}
