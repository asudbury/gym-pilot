import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { UserRole } from '@gym-pilot/types'
import { logger, recordSupabaseUserActivity, signOutFromSupabase, usePlan } from '@gym-pilot/shared'
import { getHashHomeUrl } from '../utils/appUtils'
import { useAuthModule } from '../features/auth/hooks/useAuthModule'
import type { AuthUser } from '../features/auth/domain/authTypes'
import { isUserAccessBlocked } from '../features/auth/domain/authTypes'
import { updateApplicationNameOnSupabase, updateGymBrandOnSupabase, updateGymNameOnSupabase, updateProfileNameOnSupabase } from '../features/auth/services/authSession'

const CURRENT_USER_ID_STORAGE_KEY = 'gym-pilot-current-user-id'
const LOGOUT_PENDING_STORAGE_KEY = 'gym-pilot-auth-logout-pending'
const THEME_STORAGE_KEY = 'gym-pilot-theme-preference'
const SHOW_VERSION_STORAGE_KEY = 'gym-pilot-show-version'

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  isBypassEnabled: boolean
  themePreference: 'light' | 'dark'
  showVersion: boolean
  login: (userId: string) => boolean
  enableBypass: () => void
  disableBypass: () => void
  logout: () => void
  updateProfileName: (friendlyName: string) => Promise<void>
  updateApplicationName: (applicationName: string) => Promise<void>
  updateGymBrand: (gymBrand: string) => Promise<void>
  updateGymName: (gymName: string, gymBrand?: string | null) => Promise<void>
  setThemePreference: (theme: 'light' | 'dark') => void
  setShowVersion: (show: boolean) => void
  hasAccess: (requiredRole: UserRole | UserRole[]) => boolean
}

type AuthProviderProps = {
  children: ReactNode
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)


export function AuthProvider({ children }: AuthProviderProps) {
  const { users } = usePlan()
  const {
    user,
    setUser,
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
  } = useAuthModule(users)
  const [themePreference, setThemePreferenceState] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') {
      return 'light'
    }

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    return storedTheme === 'dark' ? 'dark' : 'light'
  })
  const [showVersion, setShowVersionState] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return true
    }

    const storedShowVersion = window.localStorage.getItem(SHOW_VERSION_STORAGE_KEY)
    return storedShowVersion === null ? true : storedShowVersion === 'true'
  })

  useEffect(() => {
    const handleAuthStateChanged = () => {
      void refreshSupabaseSession()
    }

    window.addEventListener('gym-pilot-auth-updated', handleAuthStateChanged)

    void hydrateSession()
    void hydrateBypass()
    void refreshSupabaseSession()

    return () => {
      window.removeEventListener('gym-pilot-auth-updated', handleAuthStateChanged)
    }
  }, [hydrateSession, hydrateBypass, refreshSupabaseSession])

  useEffect(() => {
    void persistAuthState()
  }, [persistAuthState])

  useEffect(() => {
    void persistBypassState()
  }, [persistBypassState])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    document.documentElement.classList.toggle('dark', themePreference === 'dark')
    document.documentElement.style.colorScheme = themePreference
    window.localStorage.setItem(THEME_STORAGE_KEY, themePreference)
  }, [themePreference])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(SHOW_VERSION_STORAGE_KEY, showVersion ? 'true' : 'false')
  }, [showVersion])

  const notifyAuthStateChanged = () => {
    window.dispatchEvent(new Event('gym-pilot-auth-updated'))
  }

  const handleLogin = (userId: string) => {
    logger.info('[Auth] Login requested', { userId })
    const success = login(userId)

    if (success) {
      logger.info('[Auth] Login succeeded', { userId })
      notifyAuthStateChanged()
    }

    return success
  }

  const handleEnableBypass = () => {
    logger.info('[Auth] Bypass enabled')
    enableBypass()
    notifyAuthStateChanged()
  }

  const handleDisableBypass = () => {
    logger.info('[Auth] Bypass disabled')
    disableBypass()
    notifyAuthStateChanged()
  }

  const logout = () => {
    logger.info('[Auth] Logout requested')
    const currentUserId = user?.id

    window.sessionStorage.setItem(LOGOUT_PENDING_STORAGE_KEY, 'true')
    window.sessionStorage.removeItem(CURRENT_USER_ID_STORAGE_KEY)
    setUser(null)
    disableBypass()

    if (currentUserId) {
      void recordSupabaseUserActivity('logout', {}, currentUserId)
    }

    void signOutFromSupabase().finally(() => {
      window.sessionStorage.removeItem(LOGOUT_PENDING_STORAGE_KEY)
      if (typeof window !== 'undefined') {
        window.location.assign(getHashHomeUrl())
      }
    })
  }

  const updateProfileName = async (friendlyName: string) => {
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
    notifyAuthStateChanged()
  }

  const updateApplicationName = async (applicationName: string) => {
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
    notifyAuthStateChanged()
  }

  const updateGymBrand = async (gymBrand: string) => {
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
    notifyAuthStateChanged()
  }

  const updateGymName = async (gymName: string, gymBrand?: string | null) => {
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
    notifyAuthStateChanged()
  }

  const setThemePreference = (theme: 'light' | 'dark') => {
    setThemePreferenceState(theme)
  }

  const setShowVersion = (show: boolean) => {
    setShowVersionState(show)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: isBypassEnabled || Boolean(user && !isUserAccessBlocked(user)),
      isBypassEnabled,
      themePreference,
      showVersion,
      login: handleLogin,
      enableBypass: handleEnableBypass,
      disableBypass: handleDisableBypass,
      logout,
      updateProfileName,
      updateApplicationName,
      updateGymBrand,
      updateGymName,
      setThemePreference,
      setShowVersion,
      hasAccess,
    }),
    [user, isBypassEnabled, themePreference, showVersion, users],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}