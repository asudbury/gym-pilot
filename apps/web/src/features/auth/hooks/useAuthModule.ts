import { useCallback, useMemo, useState } from 'react'
import type { User, UserRole } from '@gym-pilot/types'
import {
  logger,
  recordSupabaseUserActivity,
  signOutFromSupabase,
} from '@gym-pilot/shared'
import type { AuthUser } from '../domain/authTypes'
import {
  resolveIsAuthenticated,
  resolvePersistedUserId,
} from '../domain/authState'
import {
  resolveAuthAccessState,
  resolveAuthUserApplicationNameUpdate,
  resolveAuthUserGymBrandUpdate,
  resolveAuthUserGymNameUpdate,
  resolveAuthUserProfileNameUpdate,
  resolveLoginAuthUser,
} from '../domain/authTransitions'
import {
  persistCurrentUserId,
  persistLogoutPending,
  persistSession,
  readLogoutPending,
  readStoredSession,
} from '../services/authStorage'
import {
  resolveSupabaseAuthUser,
  updateApplicationNameOnSupabase,
  updateGymBrandOnSupabase,
  updateGymNameOnSupabase,
  updateProfileNameOnSupabase,
} from '../services/authSession'

export function useAuthModule(users: User[]) {
  const [user, setUser] = useState<AuthUser | null>(null)

  const hydrateSession = useCallback(async () => {
    const storedUser = await readStoredSession()
    setUser(storedUser)
    persistCurrentUserId(storedUser?.id ?? null)
  }, [])

  const refreshSupabaseSession = useCallback(async () => {
    if (readLogoutPending()) {
      logger.info(
        '[Auth] Skipping Supabase session sync while logout is pending',
      )
      return
    }

    const supabaseUser = await resolveSupabaseAuthUser(users)

    if (supabaseUser) {
      setUser(supabaseUser)
      persistCurrentUserId(supabaseUser.id)
    }
  }, [users])

  const persistAuthState = useCallback(async () => {
    await persistSession(user)
  }, [user])

  const login = useCallback(
    (userId: string) => {
      const nextUser = resolveLoginAuthUser(users, userId)

      if (!nextUser) {
        return false
      }

      persistCurrentUserId(resolvePersistedUserId(nextUser))
      setUser(nextUser)

      return true
    },
    [users],
  )

  const hasAccess = useCallback(
    (requiredRole: UserRole | UserRole[]) => {
      const accessState = resolveAuthAccessState(user, requiredRole)
      return accessState.hasAccess
    },
    [user],
  )

  const isAuthenticated = useMemo(() => resolveIsAuthenticated(user), [user])

  const logout = useCallback(
    async (redirectTo?: string) => {
      const currentUserId = user?.id
      const currentFriendlyName = user?.name

      persistLogoutPending(true)
      persistCurrentUserId(null)
      setUser(null)

      if (currentUserId) {
        await recordSupabaseUserActivity(
          'logout',
          {},
          currentUserId,
          currentFriendlyName,
        )
      }

      await signOutFromSupabase()
      persistLogoutPending(false)

      if (redirectTo) {
        window.location.assign(redirectTo)
      }
    },
    [user],
  )

  const updateProfileName = useCallback(
    async (friendlyName: string) => {
      const nextState = resolveAuthUserProfileNameUpdate(user, friendlyName)

      if (!nextState) {
        return
      }

      setUser(nextState.user)
      persistCurrentUserId(nextState.persistedUserId)
      await updateProfileNameOnSupabase(nextState.user, friendlyName)
    },
    [user],
  )

  const updateApplicationName = useCallback(
    async (applicationName: string) => {
      const nextState = resolveAuthUserApplicationNameUpdate(
        user,
        applicationName,
      )

      if (!nextState) {
        return
      }

      setUser(nextState.user)
      persistCurrentUserId(nextState.persistedUserId)
      await updateApplicationNameOnSupabase(nextState.user, applicationName)
    },
    [user],
  )

  const updateGymBrand = useCallback(
    async (gymBrand: string) => {
      const nextState = resolveAuthUserGymBrandUpdate(user, gymBrand)

      if (!nextState) {
        return
      }

      setUser(nextState.user)
      persistCurrentUserId(nextState.persistedUserId)
      await updateGymBrandOnSupabase(nextState.user, gymBrand)
      if (nextState.isVirginBrand) {
        await updateGymNameOnSupabase(
          nextState.user,
          nextState.previousGymName ?? '',
          gymBrand,
        )
      }
    },
    [user],
  )

  const updateGymName = useCallback(
    async (gymName: string, gymBrand?: string | null) => {
      const nextState = resolveAuthUserGymNameUpdate(user, gymName, gymBrand)

      if (!nextState) {
        return
      }

      setUser(nextState.user)
      persistCurrentUserId(nextState.persistedUserId)
      await updateGymNameOnSupabase(
        nextState.user,
        gymName,
        gymBrand ?? nextState.user.gymBrand ?? null,
      )
    },
    [user],
  )

  return {
    user,
    setUser,
    isAuthenticated,
    hydrateSession,
    refreshSupabaseSession,
    persistAuthState,
    login,
    hasAccess,
    logout,
    updateProfileName,
    updateApplicationName,
    updateGymBrand,
    updateGymName,
  }
}
