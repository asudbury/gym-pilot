import type { ReactNode } from 'react'

type CallToActionProps = {
  title?: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function CallToAction({
  title,
  description,
  action,
  className = '',
}: CallToActionProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-slate-50 p-4 ${className}`.trim()}
    >
      <center>
        {title ? (
          <p className="text-lg font-semibold text-slate-900">{title}</p>
        ) : null}
        {description ? (
          <div className="mt-2 text-sm text-slate-600">{description}</div>
        ) : null}
        {action ? (
          <div className="mt-5 flex justify-center">{action}</div>
        ) : null}
      </center>
    </div>
  )
}
