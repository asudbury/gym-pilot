import type { ReactNode } from 'react'

type CallToActionProps = {
  title?: string
  description?: ReactNode
  action?: ReactNode
  className?: string
  icon?: ReactNode
}

export function CallToAction({
  title,
  description,
  action,
  className = '',
  icon,
}: CallToActionProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-slate-50 p-4 ${className}`.trim()}
    >
      <div className="flex flex-col items-center text-center">
        {icon ? (
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
            {icon}
          </div>
        ) : null}
        {title ? (
          <p className="text-lg font-semibold text-slate-900">{title}</p>
        ) : null}
        {description ? (
          <div className="mt-2 text-sm text-slate-600">{description}</div>
        ) : null}
        {action ? (
          <div className="mt-5 flex w-full justify-center sm:w-auto">{action}</div>
        ) : null}
      </div>
    </div>
  )
}
