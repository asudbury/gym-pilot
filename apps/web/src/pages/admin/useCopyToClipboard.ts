import { useState, useCallback } from 'react'

export function useCopyToClipboard(timeout = 1500) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setError(null)
        setTimeout(() => setCopied(false), timeout)
      } catch (e) {
        setError('Could not copy text. Please try again.')
        setCopied(false)
      }
    },
    [timeout],
  )

  return { copy, copied, error }
}
