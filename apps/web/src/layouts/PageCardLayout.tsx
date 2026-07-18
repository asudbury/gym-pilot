import type { ReactNode } from 'react'
import { PageCard } from '../components/PageCard'
import { Heading1, Paragraph } from '../components/Typography'

type PageCardLayoutProps = {
  title?: string
  subtitle?: string
  description?: string
  children?: ReactNode
  className?: string
}

export function PageCardLayout({
  title,
  subtitle,
  description,
  children,
  className = '',
}: PageCardLayoutProps) {
  return (
    <PageCard className={className}>
      <div className="space-y-4">
        {title ? <Paragraph>{title}</Paragraph> : null}
        {subtitle ? <Heading1 className="mt-2">{subtitle}</Heading1> : null}
        {description ? <div>{description}</div> : null}
        {children ? (
          <div className="flex flex-col gap-4">{children}</div>
        ) : null}
      </div>
    </PageCard>
  )
}
