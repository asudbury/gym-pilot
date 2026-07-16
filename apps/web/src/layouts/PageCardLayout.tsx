import type { ReactNode } from 'react'
import { PageCard } from '../components/PageCard'

type PageCardLayoutProps = {
  title?: ReactNode
  description?: ReactNode
  children?: ReactNode
  className?: string
}

export function PageCardLayout({ title, description, children, className = '' }: PageCardLayoutProps) {
  return (
    <PageCard className={className}>
      <div className="space-y-4">
        {title ? <div>{title}</div> : null}
        {description ? <div>{description}</div> : null}
        {children ? <div className="flex flex-col gap-4">{children}</div> : null}
      </div>
    </PageCard>
  )
}
