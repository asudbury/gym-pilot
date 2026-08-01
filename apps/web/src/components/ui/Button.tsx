import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'
import { getToneClass, type ToneName } from '../toneClasses'
import { SpinnerIcon } from './icons' // Import the SpinnerIcon component

type ButtonProps<T extends ElementType = 'button'> = {
  type?: 'button' | 'submit' | 'reset'
  as?: T
  tone?: ToneName
  className?: string
  defaultClassName?: string
  children: ReactNode
  isLoading?: boolean
  loadingLabel?: string
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className' | 'type'>

export function Button<T extends ElementType = 'button'>({
  as,
  type = 'button',
  tone = 'default', // Removed loginError from this line
  className = '',
  defaultClassName = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400/20 dark:focus:ring-slate-500/20 disabled:pointer-events-none disabled:opacity-50',
  children,
  isLoading = false,
  loadingLabel,
  ...props
}: ButtonProps<T>) {
  const Component = as ?? 'button'
  const defaultProps = as ? {} : { type: 'button' as const }
  const combinedClassName = [defaultClassName, className]
    .filter(Boolean)
    .join(' ')

  const content = isLoading ? (
    <span className="inline-flex items-center gap-2">
      <SpinnerIcon className="h-4 w-4" /> {/* Use the imported SpinnerIcon */}
      <span>{loadingLabel ?? 'Loading…'}</span>
    </span>
  ) : (
    children
  )

  return (
    <Component
      className={getToneClass(tone, combinedClassName)}
      {...defaultProps}
      {...props}
    >
      {content}
    </Component>
  )
}
