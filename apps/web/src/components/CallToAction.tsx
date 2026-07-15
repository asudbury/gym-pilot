import type { ReactNode } from 'react'
import { PageCard } from './PageCard'

type CallToActionProps = {
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function CallToAction({ title, description, action, className = '' }: CallToActionProps) {
  return (
    <PageCard padding="centered" className={className}>
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      {description ? (
        <div className="mt-2 text-sm text-slate-600">{description}</div>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </PageCard>
  )
}
