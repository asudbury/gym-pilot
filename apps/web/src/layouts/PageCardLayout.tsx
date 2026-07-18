import type { ReactNode } from 'react'
import { PageCard } from '../components/PageCard'
import { Heading1, Paragraph } from '../components/Typography'
import { DecorativeIcon } from '../components/ui/DecorativeIcon'
import type { DecorativeIconProps } from '../components/ui/DecorativeIcon'

type PageCardLayoutProps = {
  title?: string
  subtitle?: string
  description?: string
  children?: ReactNode
  className?: string
  icon?: DecorativeIconProps['icon']
}

function resolveLayoutIcon(title?: string, subtitle?: string) {
  const normalized = `${title ?? ''} ${subtitle ?? ''}`.toLowerCase()

  if (normalized.includes('admin')) {
    return 'shield' as const
  }

  if (normalized.includes('plan')) {
    return 'clipboard' as const
  }

  if (normalized.includes('assign')) {
    return 'tasks' as const
  }

  if (normalized.includes('favour')) {
    return 'heart' as const
  }

  if (normalized.includes('help')) {
    return 'help' as const
  }

  if (normalized.includes('timetable')) {
    return 'calendar' as const
  }

  if (normalized.includes('dashboard')) {
    return 'grid' as const
  }

  return 'spark' as const
}

export function PageCardLayout({
  title,
  subtitle,
  description,
  children,
  className = '',
  icon,
}: PageCardLayoutProps) {
  const resolvedIcon = icon ?? resolveLayoutIcon(title, subtitle)

  return (
    <PageCard className={className}>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <DecorativeIcon icon={resolvedIcon} />
          <div className="space-y-2">
            {title ? <Paragraph>{title}</Paragraph> : null}
            {subtitle ? <Heading1 className="mt-2">{subtitle}</Heading1> : null}
            {description ? <div>{description}</div> : null}
          </div>
        </div>
        {children ? (
          <div className="flex flex-col gap-4">{children}</div>
        ) : null}
      </div>
    </PageCard>
  )
}
