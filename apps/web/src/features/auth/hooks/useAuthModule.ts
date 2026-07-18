import { useCallback, useMemo, useState } from 'react'
import type { User, UserRole } from '@gym-pilot/types'
import { logger } from '@gym-pilot/shared'
import type { AuthUser } from '../domain/authTypes'
import { hasAccessToRole, isUserAccessBlocked } from '../domain/authTypes'
import { toAuthUser, toAuthUserFromBypass } from '../domain/authMapping'
import { persistBypassFlag, persistSession, readBypassFlag, readStoredSession } from '../services/authStorage'
import { resolveSupabaseAuthUser } from '../services/authSession'

const CURRENT_USER_ID_STORAGE_KEY = 'gym-pilot-current-user-id'
const LOGOUT_PENDING_STORAGE_KEY = 'gym-pilot-auth-logout-pending'

export function useAuthModule(users: User[]) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isBypassEnabled, setIsBypassEnabled] = useState(false)

  const hydrateSession = useCallback(async () => {
    const storedUser = await readStoredSession()
    setUser(storedUser)

    if (storedUser) {
      window.sessionStorage.setItem(CURRENT_USER_ID_STORAGE_KEY, storedUser.id)
    } else {
      window.sessionStorage.removeItem(CURRENT_USER_ID_STORAGE_KEY)
    }
  }, [])

  const hydrateBypass = useCallback(async () => {
    const storedFlag = await readBypassFlag()
    setIsBypassEnabled(storedFlag)
  }, [])

  const refreshSupabaseSession = useCallback(async () => {
    if (window.sessionStorage.getItem(LOGOUT_PENDING_STORAGE_KEY) === 'true') {
      logger.info('[Auth] Skipping Supabase session sync while logout is pending')
      return
    }

    const supabaseUser = await resolveSupabaseAuthUser(users)

    if (supabaseUser) {
      setUser(supabaseUser)
      setIsBypassEnabled(false)
      window.sessionStorage.setItem(CURRENT_USER_ID_STORAGE_KEY, supabaseUser.id)
    }
  }, [users])

  const persistAuthState = useCallback(async () => {
    await persistSession(user)
  }, [user])

  const persistBypassState = useCallback(async () => {
    await persistBypassFlag(isBypassEnabled)
  }, [isBypassEnabled])

  const login = useCallback((userId: string) => {
    const selectedUser = users.find((item) => item.id === userId)

    if (!selectedUser) {
      return false
    }

    window.sessionStorage.setItem(CURRENT_USER_ID_STORAGE_KEY, selectedUser.id)
    setUser(toAuthUser(selectedUser))

    return true
  }, [users])

  const enableBypass = useCallback(() => {
    window.sessionStorage.setItem(CURRENT_USER_ID_STORAGE_KEY, 'mvp-bypass')
    setIsBypassEnabled(true)
    setUser(toAuthUserFromBypass())
  }, [])

  const disableBypass = useCallback(() => {
    window.sessionStorage.removeItem(CURRENT_USER_ID_STORAGE_KEY)
    setIsBypassEnabled(false)
    setUser(null)
  }, [])

  const hasAccess = useCallback((requiredRole: UserRole | UserRole[]) => hasAccessToRole(user, requiredRole, isBypassEnabled), [user, isBypassEnabled])

  const isAuthenticated = useMemo(() => isBypassEnabled || Boolean(user && !isUserAccessBlocked(user)), [user, isBypassEnabled])

  return {
    user,
    setUser,
    isAuthenticated,
    isBypassEnabled,
    hydrateSession,
    hydrateBypass,
    refreshSupabaseSession,
    persistAuthState,
    persistBypassState,
    login,
    enableBypass,
    disableBypass,
    hasAccess,
  }
}
