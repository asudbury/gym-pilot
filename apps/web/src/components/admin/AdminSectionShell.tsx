import { Link } from 'react-router-dom'
import { getToneClass } from '../toneClasses'
import { PageCard } from '../PageCard'
import { PageLayout } from '../../layouts/PageLayout'
import { Heading1, Paragraph } from '../Typography'
import { DecorativeIcon } from '../ui/DecorativeIcon'

type AdminSectionShellProps = {
  title: string
  subtitle: string
  backTo?: string
  backLabel?: string
  children: React.ReactNode
  className?: string
  icon?: React.ComponentProps<typeof DecorativeIcon>['icon']
}

export function AdminSectionShell({
  title,
  subtitle,
  backTo = '/admin',
  backLabel = 'Back to admin',
  children,
  className,
  icon = 'shield',
}: AdminSectionShellProps) {
  return (
    <PageLayout className={className}>
      <PageCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <DecorativeIcon icon={icon} />
            <div>
              <Paragraph>Admin</Paragraph>
              <Heading1 className="mt-2">{title}</Heading1>
              {subtitle ? (
                <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
              ) : null}
            </div>
          </div>
          <Link
            to={backTo}
            className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}
          >
            {backLabel}
          </Link>
        </div>

        <div className="mt-6">{children}</div>
      </PageCard>
    </PageLayout>
  )
}
