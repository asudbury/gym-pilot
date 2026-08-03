import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  loadSupabaseProfileTermsAcceptance,
  loadSupabaseProfileFlag,
} from '@gym-pilot/shared'
import { useAuth } from './AuthContext'

export function useRequireAuthGuards() {
  const { user } = useAuth()
  const location = useLocation()
  const [termsAccepted, setTermsAccepted] = useState<boolean | null>(null)
  const [mustChangePassword, setMustChangePassword] = useState<boolean | null>(
    null,
  )
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    if (!user?.id || location.pathname === '/welcome') {
      setTermsAccepted(null)
      setMustChangePassword(null)
      setIsChecking(false)
      return
    }

    let isActive = true
    setIsChecking(true)

    void (async () => {
      try {
        const [accepted, passwordFlag] = await Promise.all([
          loadSupabaseProfileTermsAcceptance(user.id),
          loadSupabaseProfileFlag('must_change_password', user.id),
        ])

        if (isActive) {
          setTermsAccepted(accepted)
          setMustChangePassword(passwordFlag)
        }
      } catch {
        if (isActive) {
          setTermsAccepted(false)
          setMustChangePassword(false)
        }
      } finally {
        if (isActive) {
          setIsChecking(false)
        }
      }
    })()

    return () => {
      isActive = false
    }
  }, [location.pathname, user?.id])

  return { termsAccepted, mustChangePassword, isChecking }
}
