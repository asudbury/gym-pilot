import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'
import { getToneClass, type ToneName } from '../components/toneClasses'

type ButtonProps<T extends ElementType = 'button'> = {
  as?: T
  tone?: ToneName
  className?: string
  defaultClassName?: string
  children: ReactNode
  isLoading?: boolean
  loadingLabel?: string
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>

export function Button<T extends ElementType = 'button'>({
  as,
  tone = 'default',
  className = '',
  defaultClassName = 'inline-flex items-center justify-center sm:justify-start rounded-full font-medium',
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
      <svg
        className="h-4 w-4 animate-spin"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.25"
        />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
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
