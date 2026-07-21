import { useEffect, useState } from 'react'
import { appTokens } from '../constants/tokens'

type Toast = { id: number; text: string; tone?: 'success' | 'error' }

type NotificationPillProps = {
  text: string
  tone?: 'success' | 'error'
}

function NotificationPill({ text, tone }: NotificationPillProps) {
  const isError = tone === 'error'

  return (
    <div
      className={`max-w-xs rounded-full border px-4 py-2 text-sm font-medium shadow-sm ${
        isError
          ? 'border-rose-200 bg-rose-50 text-rose-700'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      } ${appTokens.pill}`}
    >
      {text}
    </div>
  )
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent
      const detail = custom?.detail ?? { text: String(event) }
      const id = Date.now()
      setToasts((t) => [...t, { id, text: detail.text, tone: detail.tone }])
      window.setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id))
      }, 3000)
    }

    window.addEventListener('gym-pilot-notification', handler as EventListener)
    return () =>
      window.removeEventListener(
        'gym-pilot-notification',
        handler as EventListener,
      )
  }, [])

  if (!toasts.length) return null

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2">
      {toasts.map((t) => (
        <NotificationPill key={t.id} text={t.text} tone={t.tone} />
      ))}
    </div>
  )
}
