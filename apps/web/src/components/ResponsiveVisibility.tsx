import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

type Breakpoint = 'mobile' | 'tablet' | 'desktop'

type ResponsiveVisibilityProps<T extends ElementType = 'div'> = {
  as?: T
  children: ReactNode
  className?: string
  visibleOn?: Breakpoint
  hiddenOn?: Breakpoint
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>

const breakpointClasses: Record<Breakpoint, string> = {
  mobile: 'block sm:hidden',
  tablet: 'hidden sm:block lg:hidden',
  desktop: 'hidden lg:block',
}

const hiddenBreakpointClasses: Record<Breakpoint, string> = {
  mobile: 'hidden sm:block',
  tablet: 'block sm:hidden lg:block',
  desktop: 'block lg:hidden',
}

export function ResponsiveVisibility<T extends ElementType = 'div'>({
  as,
  children,
  className = '',
  visibleOn,
  hiddenOn,
  ...props
}: ResponsiveVisibilityProps<T>) {
  const Component = as ?? 'div'

  const responsiveClass = visibleOn ? breakpointClasses[visibleOn] : ''
  const hiddenClass = hiddenOn ? hiddenBreakpointClasses[hiddenOn] : ''

  return (
    <Component className={[responsiveClass, hiddenClass, className].filter(Boolean).join(' ')} {...props}>
      {children}
    </Component>
  )
}
