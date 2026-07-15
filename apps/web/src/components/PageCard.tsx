import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'
import { appTokens } from '../constants/tokens'

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
    default: 'p-5 sm:p-8',
    compact: 'p-4 sm:p-5',
    spacious: 'p-6 sm:p-8',
    centered: 'p-6 text-center sm:p-8',
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
