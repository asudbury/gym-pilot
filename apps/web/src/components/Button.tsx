import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'
import { getToneClass, type ToneName } from '../components/toneClasses'

type ButtonProps<T extends ElementType = 'button'> = {
  as?: T
  tone?: ToneName
  className?: string
  defaultClassName?: string
  children: ReactNode
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>

export function Button<T extends ElementType = 'button'>({
  as,
  tone = 'default',
  className = '',
  defaultClassName = 'rounded-full text-sm font-medium',
  children,
  ...props
}: ButtonProps<T>) {
  const Component = as ?? 'button'
  const defaultProps = as ? {} : { type: 'button' as const }
  const combinedClassName = [defaultClassName, className].filter(Boolean).join(' ')

  return (
    <Component className={getToneClass(tone, combinedClassName)} {...defaultProps} {...props}>
      {children}
    </Component>
  )
}
