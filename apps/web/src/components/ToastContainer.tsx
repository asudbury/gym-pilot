import { useEffect, useState } from 'react'

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
      window.removeEventListener('gym-pilot-notification', handler as EventListener)
  }, [])

  if (!toasts.length) return null

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`max-w-xs rounded-lg px-3 py-2 text-sm shadow ${
            t.tone === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-100'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
          }`}
        >
          {t.text}
        </div>
      ))}
    </div>
  )
}
