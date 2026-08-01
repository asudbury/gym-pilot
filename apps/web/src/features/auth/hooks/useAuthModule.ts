import {
  logger,
  recordSupabaseUserActivity,
  signInWithPassword,
  signOutFromSupabase,
} from '@gym-pilot/shared'
import type { User, UserRole } from '@gym-pilot/types'
import { useCallback, useMemo, useRef, useState } from 'react'
import { shouldPersistAuthSession } from '../../../auth/authPersistence'
import {
  resolveIsAuthenticated,
  resolvePersistedUserId, // This function is used for persisting the user ID
} from '../domain/authState' // Moved from authTransitions to authState
import {
  resolveAuthAccessState, // These functions are for resolving/transitioning auth state
  resolveAuthUserApplicationNameUpdate,
  resolveAuthUserGymBrandUpdate,
  resolveAuthUserGymNameUpdate,
  resolveAuthUserProfileNameUpdate,
} from '../domain/authTransitions' // Moved from authSession to authTransitions
import type { AuthUser } from '../domain/authTypes'
import {
  // These are correctly from authSession, dealing with Supabase interaction
  resolveSupabaseAuthUser,
  updateApplicationNameOnSupabase,
  updateGymBrandOnSupabase,
  updateGymNameOnSupabase,
  updateProfileNameOnSupabase,
} from '../services/authSession'
import {
  persistCurrentUserId,
  persistLogoutPending,
  persistSession,
  readLogoutPending,
  readStoredSession,
} from '../services/authStorage'

export function useAuthModule(users: User[]) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const userRef = useRef<AuthUser | null>(null)
  const hasHydratedSessionRef = useRef(false)
  const hadAuthenticatedUserRef = useRef(false)

  const hydrateSession = useCallback(async () => {
    const storedUser = await readStoredSession()

    if (storedUser) {
      userRef.current = storedUser
      setUser(storedUser)
      hadAuthenticatedUserRef.current = true
      persistCurrentUserId(storedUser.id)
      hasHydratedSessionRef.current = true
      return
    }

    const supabaseUser = await resolveSupabaseAuthUser(users)

    if (supabaseUser) {
      userRef.current = supabaseUser
      setUser(supabaseUser)
      hadAuthenticatedUserRef.current = true
      persistCurrentUserId(supabaseUser.id)
    }

    hasHydratedSessionRef.current = true
  }, [users])

  const refreshSupabaseSession = useCallback(async () => {
    if (readLogoutPending()) {
      logger.info(
        '[Auth] Skipping Supabase session sync while logout is pending',
      )
      return
    }

    const currentUser = userRef.current
    const supabaseUser = await resolveSupabaseAuthUser(users)

    if (supabaseUser) {
      userRef.current = supabaseUser
      setUser(supabaseUser)
      hadAuthenticatedUserRef.current = true
      persistCurrentUserId(supabaseUser.id)
      return
    }

    if (currentUser) {
      userRef.current = currentUser
      setUser(currentUser)
      persistCurrentUserId(currentUser.id)
    }
  }, [users])

  const persistAuthState = useCallback(async () => {
    if (
      !shouldPersistAuthSession(
        hasHydratedSessionRef.current,
        user,
        hadAuthenticatedUserRef.current,
      )
    ) {
      return
    }

    await persistSession(user)
  }, [user])

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        const response = await signInWithPassword(email, password)

        if (response.error) {
          logger.error('[AuthModule] Sign-in failed:', response.error)
          // Supabase errors often have a 'message' property
          throw new Error(response.error.message || 'Sign-in failed')
        }

        // After successful sign-in, resolve the AuthUser from the new session
        // resolveSupabaseAuthUser will fetch the current session and user from Supabase
        // and map it to our AuthUser type, also checking for access blocking.
        const nextUser = await resolveSupabaseAuthUser(users)

        if (!nextUser) {
          logger.error(
            '[AuthModule] Failed to resolve AuthUser after successful sign-in. This might indicate an issue with user data or access blocking.',
          )
          throw new Error('Failed to retrieve user information after login.')
        }

        userRef.current = nextUser
        hadAuthenticatedUserRef.current = true
        persistCurrentUserId(resolvePersistedUserId(nextUser))
        setUser(nextUser)

        void recordSupabaseUserActivity('login', {}, nextUser.id, nextUser.name)
        return true
      } catch (error: any) {
        // Catch any error from signInWithPassword or resolveSupabaseAuthUser
        logger.error('[AuthModule] Login process failed:', error)
        throw error // Re-throw the error so the calling component (LoginPage) can handle it
      }
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
      userRef.current = null
      setUser(null)
      hasHydratedSessionRef.current = true

      if (currentUserId) {
        await recordSupabaseUserActivity(
          'logout',
          {},
          currentUserId,
          currentFriendlyName,
        )
      }

      // Explicitly persist null session to trigger removal from IndexedDB and Supabase
      await persistSession(null)

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

      userRef.current = nextState.user
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

      userRef.current = nextState.user
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

      userRef.current = nextState.user
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
