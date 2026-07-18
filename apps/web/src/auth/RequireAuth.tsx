import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { UserRole } from '@gym-pilot/types'
import { useAuth } from './AuthContext'
import { isPublicRoute } from './publicAccess'
import { AUTH_PROTECTION_ENABLED } from './config'

type RequireAuthProps = {
  requiredRole?: UserRole | UserRole[]
  requireClubId?: boolean
}

export function RequireAuth({ requiredRole, requireClubId = false }: RequireAuthProps) {
  const { isAuthenticated, hasAccess, user } = useAuth()
  const location = useLocation()

  if (!AUTH_PROTECTION_ENABLED) {
    return <Outlet />
  }

  if (isPublicRoute(location.pathname)) {
    return <Outlet />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
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
