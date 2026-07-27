import clsx from 'clsx'
import { useMemo } from 'react'
import { logger } from '@gym-pilot/shared'

// Define a type that StatusMessageNotification can gracefully handle
export type DisplayableError = string | Error | { message: string; code?: string; details?: unknown; hint?: unknown } | unknown | null;
type StatusTone = 'default' | 'error' | 'success' | 'info'

interface StatusMessageNotificationProps {
  message: DisplayableError
  tone?: StatusTone
  className?: string
}

export function StatusMessageNotification({
  message,
  tone = 'default',
  className,
}: StatusMessageNotificationProps) {
  const resolvedMessage = useMemo(() => {
    if (message === null || message === undefined) {
      return null
    }

    if (typeof message === 'string') {
      return message
    }

    if (message instanceof Error) {
      return message.message
    }

    // Handle objects with a 'message' property (like the one you provided)
    if (typeof message === 'object' && message !== null && 'message' in message && typeof (message as { message: unknown }).message === 'string') {
      return (message as { message: string }).message
    }

    // Fallback for other objects, try to stringify for more info than '[object Object]'
    if (typeof message === 'object' && message !== null) {
      try {
        return `An unexpected error occurred: ${JSON.stringify(message)}`
      } catch (jsonError) {
        logger.warn('Failed to JSON.stringify error object in StatusMessage:', jsonError)
      }
    }

    // Final fallback for primitives or other unexpected types
    return `An unexpected error occurred: ${String(message)}`
  }, [message])

  if (!resolvedMessage) {
    return null
  }

  const toneClasses = {
    error: 'border-rose-200 bg-rose-50 text-rose-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    info: 'border-blue-200 bg-blue-50 text-blue-700',
    default: 'border-slate-200 bg-slate-50 text-slate-600',
  }

  return (
    <div
      className={clsx(
        'mt-4 rounded-2xl border px-4 py-3 text-sm',
        toneClasses[tone],
        className,
      )}
    >
      {resolvedMessage}
    </div>
  )
}
