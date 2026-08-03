import { useEffect, useState } from 'react'
import { loadSupabaseProfileFlag } from '@gym-pilot/shared'
import { useAuth } from '../../../auth/AuthContext'

export function useMustChangePassword() {
  const { user } = useAuth()
  const [mustChangePassword, setMustChangePassword] = useState(false)

  useEffect(() => {
    let isActive = true

    if (!user?.id) {
      setMustChangePassword(false)
      return
    }

    void (async () => {
      try {
        const flag = await loadSupabaseProfileFlag(
          'must_change_password',
          user.id,
        )
        if (!isActive) return
        setMustChangePassword(Boolean(flag))
      } catch {
        if (isActive) setMustChangePassword(false)
      }
    })()

    return () => {
      isActive = false
    }
  }, [user?.id])

  return { mustChangePassword }
}
