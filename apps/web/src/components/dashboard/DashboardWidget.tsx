import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { CallToAction } from '../../layouts/CallToAction'
import { getToneClass } from '../toneClasses'

type DashboardWidgetProps = {
  title: string
  description?: string
  to?: string
  tone?: 'blue' | 'default' | 'emerald' | 'orange' | 'rose' | 'white'
  children?: ReactNode
}

export function DashboardWidget({ title, description, to, tone = 'default', children }: DashboardWidgetProps) {
  const action = to ? (
    <NavLink
      to={to}
      className={getToneClass(tone === 'default' ? 'blue' : tone, 'inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium')}
    >
      Open
    </NavLink>
  ) : null

  const cardContent = (
    <>
      {description ? <div className="text-sm text-slate-600 dark:text-slate-300">{description}</div> : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </>
  )

  const card = (
    <div className="h-full transition hover:-translate-y-0.5 hover:shadow-sm">
      <CallToAction title={title} description={cardContent} action={action} className="h-full" />
    </div>
  )

  if (!to) {
    return card
  }

  return (
    <div className="h-full">
      {card}
    </div>
  )
}
