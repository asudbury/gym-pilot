import { useEffect, useState } from 'react'
import { StatusMessageNotification } from './ui/StatusMessageNotification'

type Toast = { id: number; text: string; tone?: 'success' | 'error' }

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
        // The `max-w-xs` and `mt-2` classes are added to maintain similar styling to the removed NotificationPill.
        <StatusMessageNotification
          key={t.id}
          message={t.text}
          tone={t.tone}
          className="max-w-xs mt-2"
        />
      ))}
    </div>
  )
}
