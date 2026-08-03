import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { UserRole } from '@gym-pilot/types'
import { useAuth } from './AuthContext'
import { isPublicRoute } from './publicAccess'
import { AUTH_PROTECTION_ENABLED } from './config'
import { useRequireAuthGuards } from './useRequireAuthGuards'

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
  const { termsAccepted, mustChangePassword, isChecking } =
    useRequireAuthGuards()

  if (!AUTH_PROTECTION_ENABLED) {
    return <Outlet />
  }

  if (isPublicRoute(location.pathname)) {
    return <Outlet />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (user?.id && location.pathname !== '/welcome' && !isChecking) {
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
  if (
    user?.id &&
    mustChangePassword &&
    location.pathname !== '/reset-password'
  ) {
    return <Navigate to="/reset-password" replace state={{ from: location }} />
  }

  if (user?.id && isChecking) {
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
