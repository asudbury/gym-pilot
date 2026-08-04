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
    default: 'px-4 py-5 sm:px-8 sm:py-8',
    compact: 'px-4 py-4 sm:px-5 sm:py-5',
    spacious: 'px-4 py-6 sm:px-8 sm:py-8',
    centered: 'px-4 py-6 text-center sm:px-8 sm:py-8',
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
