import { useCallback, useMemo, useState } from 'react'
import type { User, UserRole } from '@gym-pilot/types'
import { logger, recordSupabaseUserActivity, signOutFromSupabase } from '@gym-pilot/shared'
import type { AuthUser } from '../domain/authTypes'
import { hasAccessToRole } from '../domain/authTypes'
import { toAuthUser, toAuthUserFromBypass } from '../domain/authMapping'
import { resolveIsAuthenticated, resolvePersistedUserId } from '../domain/authState'
import { persistBypassFlag, persistCurrentUserId, persistLogoutPending, persistSession, readBypassFlag, readLogoutPending, readStoredSession } from '../services/authStorage'
import { resolveSupabaseAuthUser, updateApplicationNameOnSupabase, updateGymBrandOnSupabase, updateGymNameOnSupabase, updateProfileNameOnSupabase } from '../services/authSession'

export function useAuthModule(users: User[]) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isBypassEnabled, setIsBypassEnabled] = useState(false)

  const hydrateSession = useCallback(async () => {
    const storedUser = await readStoredSession()
    setUser(storedUser)
    persistCurrentUserId(storedUser?.id ?? null)
  }, [])

  const hydrateBypass = useCallback(async () => {
    const storedFlag = await readBypassFlag()
    setIsBypassEnabled(storedFlag)
  }, [])

  const refreshSupabaseSession = useCallback(async () => {
    if (readLogoutPending()) {
      logger.info('[Auth] Skipping Supabase session sync while logout is pending')
      return
    }

    const supabaseUser = await resolveSupabaseAuthUser(users)

    if (supabaseUser) {
      setUser(supabaseUser)
      setIsBypassEnabled(false)
      persistCurrentUserId(supabaseUser.id)
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

    const nextUser = toAuthUser(selectedUser)
    persistCurrentUserId(resolvePersistedUserId(nextUser, false))
    setUser(nextUser)

    return true
  }, [users])

  const enableBypass = useCallback(() => {
    const nextUser = toAuthUserFromBypass()
    persistCurrentUserId(resolvePersistedUserId(nextUser, true))
    setIsBypassEnabled(true)
    setUser(nextUser)
  }, [])

  const disableBypass = useCallback(() => {
    persistCurrentUserId(resolvePersistedUserId(null, false))
    setIsBypassEnabled(false)
    setUser(null)
  }, [])

  const hasAccess = useCallback((requiredRole: UserRole | UserRole[]) => hasAccessToRole(user, requiredRole, isBypassEnabled), [user, isBypassEnabled])

  const isAuthenticated = useMemo(() => resolveIsAuthenticated(user, isBypassEnabled), [user, isBypassEnabled])

  const logout = useCallback(async (redirectTo?: string) => {
    const currentUserId = user?.id

    persistLogoutPending(true)
    persistCurrentUserId(null)
    setUser(null)
    setIsBypassEnabled(false)

    if (currentUserId) {
      await recordSupabaseUserActivity('logout', {}, currentUserId)
    }

    await signOutFromSupabase()
    persistLogoutPending(false)

    if (redirectTo) {
      window.location.assign(redirectTo)
    }
  }, [user])

  const updateProfileName = useCallback(async (friendlyName: string) => {
    const trimmedName = friendlyName.trim()

    if (!user) {
      return
    }

    const nextName = trimmedName
    const slug = nextName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') || 'user'

    setUser((currentUser) => {
      if (!currentUser) {
        return currentUser
      }

      return {
        ...currentUser,
        name: nextName,
        slug,
      }
    })

    await updateProfileNameOnSupabase(user, friendlyName)
  }, [user])

  const updateApplicationName = useCallback(async (applicationName: string) => {
    const trimmedName = applicationName.trim()

    if (!user) {
      return
    }

    setUser((currentUser) => {
      if (!currentUser) {
        return currentUser
      }

      return {
        ...currentUser,
        applicationName: trimmedName || null,
      }
    })

    await updateApplicationNameOnSupabase(user, applicationName)
  }, [user])

  const updateGymBrand = useCallback(async (gymBrand: string) => {
    const trimmedValue = gymBrand.trim()

    if (!user) {
      return
    }

    const previousGymName = user.gymName ?? null
    const isVirginBrand = trimmedValue.toLowerCase() === 'virgin'

    setUser((currentUser) => {
      if (!currentUser) {
        return currentUser
      }

      return {
        ...currentUser,
        gymBrand: trimmedValue || null,
        gymName: isVirginBrand ? currentUser.gymName ?? previousGymName : null,
      }
    })

    await updateGymBrandOnSupabase(user, gymBrand)
    if (isVirginBrand) {
      await updateGymNameOnSupabase(user, previousGymName ?? '', gymBrand)
    }
  }, [user])

  const updateGymName = useCallback(async (gymName: string, gymBrand?: string | null) => {
    const trimmedValue = gymName.trim()
    const resolvedBrand = (gymBrand ?? user?.gymBrand ?? '').trim().toLowerCase()
    const isVirginBrand = resolvedBrand === 'virgin'

    if (!user) {
      return
    }

    setUser((currentUser) => {
      if (!currentUser) {
        return currentUser
      }

      return {
        ...currentUser,
        gymName: isVirginBrand && trimmedValue ? trimmedValue : null,
      }
    })

    await updateGymNameOnSupabase(user, gymName, gymBrand ?? user.gymBrand ?? null)
  }, [user])

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
    logout,
    updateProfileName,
    updateApplicationName,
    updateGymBrand,
    updateGymName,
  }
}
