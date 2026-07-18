import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { getToneClass } from '../toneClasses'

type DashboardWidgetProps = {
  title: string
  description?: string
  to?: string
  tone?: 'blue' | 'default' | 'emerald' | 'orange' | 'rose' | 'white'
  children?: ReactNode
}

export function DashboardWidget({ title, description, to, tone = 'default', children }: DashboardWidgetProps) {
  const content = (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      {description ? <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p> : null}
      {children ? <div className="pt-2">{children}</div> : null}
    </div>
  )

  const baseClassName = getToneClass(tone, 'rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md')

  if (!to) {
    return <div className={baseClassName}>{content}</div>
  }

  return (
    <NavLink to={to} className={baseClassName}>
      {content}
    </NavLink>
  )
}
