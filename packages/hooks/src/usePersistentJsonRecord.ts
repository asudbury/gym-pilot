import { useEffect, useRef, useState } from 'react'
import { loadJsonRecord, saveJsonRecord } from '@gym-pilot/shared'

export function usePersistentJsonRecord<T>(
  key: string,
  fallback: T,
) {
  const [value, setValue] = useState<T>(fallback)
  const hydrated = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const stored = await loadJsonRecord<T>(key, fallback)

      if (cancelled) {
        return
      }

      setValue(stored)
      hydrated.current = true
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [key])

  useEffect(() => {
    if (!hydrated.current) {
      return
    }

    void saveJsonRecord(key, value)
  }, [key, value])

  return [value, setValue] as const
}