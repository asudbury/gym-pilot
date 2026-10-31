import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { CallToAction } from '../../layouts/CallToAction'
import { Button } from '../ui/Button'
import { DecorativeIcon, type DecorativeIconProps } from '../ui/DecorativeIcon'
import type { ToneName } from '../toneClasses'

type DashboardWidgetTone = Extract<
  ToneName,
  'blue' | 'default' | 'emerald' | 'orange' | 'rose' | 'white'
>

type DashboardWidgetProps = {
  title: string
  description?: string
  to?: string
  tone?: DashboardWidgetTone
  children?: ReactNode
  icon?: DecorativeIconProps['icon']
}

export function DashboardWidget({
  title,
  description,
  to,
  tone = 'default',
  icon,
  children,
}: DashboardWidgetProps) {
  const actionTone: ToneName = tone === 'default' ? 'blue' : tone

  const action = to ? (
    <Button
      as={NavLink}
      to={to}
      tone={actionTone}
      className="flex w-full items-center justify-center rounded-lg px-4 py-3 text-base font-medium sm:w-auto sm:py-2 sm:text-sm"
    >
      Open
    </Button>
  ) : null

  const cardContent = (
    <>
      {description ? (
        <div className="text-sm text-slate-600 dark:text-slate-300">
          {description}
        </div>
      ) : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </>
  )

  const card = (
    <div className="h-full transition hover:-translate-y-0.5 hover:shadow-sm">
      <CallToAction
        title={title}
        description={cardContent}
        action={action}
        className="h-full"
        icon={
          icon ? <DecorativeIcon icon={icon} className="h-5 w-5" /> : undefined
        }
      />
    </div>
  )

  if (!to) {
    return card
  }

  return <div className="h-full">{card}</div>
}
