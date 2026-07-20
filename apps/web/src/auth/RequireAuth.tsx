import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { UserRole } from '@gym-pilot/types'
import { loadSupabaseProfileTermsAcceptance, loadSupabaseProfileFlag } from '@gym-pilot/shared'
import { useAuth } from './AuthContext'
import { isPublicRoute } from './publicAccess'
import { AUTH_PROTECTION_ENABLED } from './config'

type RequireAuthProps = {
  requiredRole?: UserRole | UserRole[]
  requireClubId?: boolean
}

export function RequireAuth({
  requiredRole,
  requireClubId = false,
}: RequireAuthProps) {
  const { isAuthenticated, hasAccess, user } = useAuth()
  const location = useLocation()
  const [termsAccepted, setTermsAccepted] = useState<boolean | null>(null)
  const [isCheckingTerms, setIsCheckingTerms] = useState(false)
  const [mustChangePassword, setMustChangePassword] = useState<boolean | null>(null)

  useEffect(() => {
    if (!user?.id || location.pathname === '/welcome') {
      setTermsAccepted(null)
      setIsCheckingTerms(false)
      return
    }

    let isActive = true

    setIsCheckingTerms(true)

    void (async () => {
      try {
        const accepted = await loadSupabaseProfileTermsAcceptance(user.id)

        if (!isActive) {
          return
        }

        setTermsAccepted(accepted)
      } catch {
        if (isActive) {
          setTermsAccepted(false)
        }
      } finally {
        if (isActive) {
          setIsCheckingTerms(false)
        }
      }
    })()

    return () => {
      isActive = false
    }
  }, [location.pathname, user?.id])

  useEffect(() => {
    if (!user?.id) {
      setMustChangePassword(null)
      return
    }

    let isActive = true

    void (async () => {
      try {
        const flag = await loadSupabaseProfileFlag('must_change_password', user.id)

        if (!isActive) return

        setMustChangePassword(flag)
      } catch {
        if (isActive) setMustChangePassword(false)
      }
    })()

    return () => {
      isActive = false
    }
  }, [user?.id])

  if (!AUTH_PROTECTION_ENABLED) {
    return <Outlet />
  }

  if (isPublicRoute(location.pathname)) {
    return <Outlet />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (user?.id && location.pathname !== '/welcome' && !isCheckingTerms) {
    if (termsAccepted === false) {
      const returnTo = `${location.pathname}${location.search}`
      return (
        <Navigate
          to={`/welcome?returnTo=${encodeURIComponent(returnTo)}`}
          replace
        />
      )
    }
  }

  // If the profile requires a password change, force the reset page.
  if (user?.id && mustChangePassword && location.pathname !== '/reset-password') {
    return <Navigate to="/reset-password" replace state={{ from: location }} />
  }

  if (user?.id && isCheckingTerms) {
    return null
  }

  if (requiredRole && !hasAccess(requiredRole)) {
    return <Navigate to="/" replace />
  }

  if (requireClubId) {
    const hasStoredClubId = Boolean(user?.gymName?.trim())

    if (!hasStoredClubId) {
      return <Navigate to="/" replace />
    }
  }

  return <Outlet />
}
