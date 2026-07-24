import type { ReactNode } from 'react'
import { PageCard } from '../components/PageCard'
import { Heading1, UpperCaseParagraph } from '../components/Typography'
import { DecorativeIcon } from '../components/ui/DecorativeIcon'
import type { DecorativeIconProps } from '../components/ui/DecorativeIcon'
import { DesktopOnly } from '../components/visibility/DeviceVisibility'

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

  // More specific matches first
  if (normalized.includes('welcome') || normalized.includes('terms')) {
    return 'document' as const
  }

  if (normalized.includes('template')) {
    return 'clipboard' as const
  }

  if (normalized.includes('preferences')) {
    return 'preferences' as const
  }

  // General categories
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
  const resolvedIcon =
    icon === undefined ? resolveLayoutIcon(title, subtitle) : icon

  return (
    <PageCard className={className}>
      <div className="space-y-1 sm:space-y-4">
        <div className="flex flex-col items-start gap-1 sm:gap-2">
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <div className="shrink-0">
              <DecorativeIcon icon={resolvedIcon} className="h-5 w-5" />
            </div>
            <UpperCaseParagraph>{title}</UpperCaseParagraph>
          </div>
          <DesktopOnly>
            <div className="flex flex-col items-start">
              {subtitle ? (
                <Heading1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl md:text-3xl dark:text-slate-100">
                  {subtitle}
                </Heading1>
              ) : null}
              {description ? (
                <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {description}
                </p>
              ) : null}
            </div>
          </DesktopOnly>
        </div>
        {children ? (
          <div className="flex flex-col gap-4">{children}</div>
        ) : null}
      </div>
    </PageCard>
  )
}
