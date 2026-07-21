import { appTokens } from '../constants/tokens'

export type NotificationTone = 'success' | 'error' | 'info'

type NotificationMessage =
  string | { text: string; tone?: NotificationTone } | null | undefined

type NotificationPillProps = {
  message?: NotificationMessage
  tone?: NotificationTone
  className?: string
}

export function NotificationPill({
  message,
  tone = 'info',
  className = '',
}: NotificationPillProps) {
  const resolvedMessage =
    typeof message === 'string' ? message : (message?.text ?? '')

  const resolvedTone =
    typeof message === 'object' && message?.tone ? message.tone : tone

  const toneClasses =
    resolvedTone === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : resolvedTone === 'success'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : 'border-slate-200 bg-slate-50 text-slate-700'

  return (
    <div
      className={`inline-flex max-w-full items-center rounded-full border px-4 py-2 text-sm font-medium shadow-sm ${toneClasses} ${appTokens.pill} ${className}`.trim()}
    >
      {resolvedMessage}
    </div>
  )
}
