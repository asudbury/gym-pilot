import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { UserRole } from '@gym-pilot/types'
import { logger, usePlan } from '@gym-pilot/shared'
import { getHashHomeUrl } from '../utils/appUtils'
import { useAuthModule } from '../features/auth/hooks/useAuthModule'
import type { AuthUser } from '../features/auth/domain/authTypes'
import { isUserAccessBlocked } from '../features/auth/domain/authTypes'
import {
  persistShowVersion,
  persistThemePreference,
  readStoredShowVersion,
  readStoredThemePreference,
  type ThemePreference,
} from '../features/auth/domain/uiPreferences'

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  themePreference: 'light' | 'dark'
  showVersion: boolean
  login: (userId: string) => boolean
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
    hydrateSession,
    refreshSupabaseSession,
    persistAuthState,
    login,
    hasAccess,
    logout: logoutFromModule,
    updateProfileName: updateProfileNameInModule,
    updateApplicationName: updateApplicationNameInModule,
    updateGymBrand: updateGymBrandInModule,
    updateGymName: updateGymNameInModule,
  } = useAuthModule(users)
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(
    () => readStoredThemePreference(),
  )
  const [showVersion, setShowVersionState] = useState<boolean>(() =>
    readStoredShowVersion(),
  )

  useEffect(() => {
    const handleAuthStateChanged = () => {
      void refreshSupabaseSession()
    }

    window.addEventListener('gym-pilot-auth-updated', handleAuthStateChanged)

    void hydrateSession()
    void refreshSupabaseSession()

    return () => {
      window.removeEventListener(
        'gym-pilot-auth-updated',
        handleAuthStateChanged,
      )
    }
  }, [hydrateSession, refreshSupabaseSession])

  useEffect(() => {
    void persistAuthState()
  }, [persistAuthState])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    document.documentElement.classList.toggle(
      'dark',
      themePreference === 'dark',
    )
    document.documentElement.style.colorScheme = themePreference
    persistThemePreference(themePreference)
  }, [themePreference])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    persistShowVersion(showVersion)
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

  const logout = () => {
    logger.info('[Auth] Logout requested')
    void logoutFromModule(getHashHomeUrl())
  }

  const updateProfileName = async (friendlyName: string) => {
    if (!user) {
      return
    }

    await updateProfileNameInModule(friendlyName)
    notifyAuthStateChanged()
  }

  const updateApplicationName = async (applicationName: string) => {
    if (!user) {
      return
    }

    await updateApplicationNameInModule(applicationName)
    notifyAuthStateChanged()
  }

  const updateGymBrand = async (gymBrand: string) => {
    if (!user) {
      return
    }

    await updateGymBrandInModule(gymBrand)
    notifyAuthStateChanged()
  }

  const updateGymName = async (gymName: string, gymBrand?: string | null) => {
    if (!user) {
      return
    }

    await updateGymNameInModule(gymName, gymBrand)
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
      isAuthenticated: Boolean(user && !isUserAccessBlocked(user)),
      themePreference,
      showVersion,
      login: handleLogin,
      logout,
      updateProfileName,
      updateApplicationName,
      updateGymBrand,
      updateGymName,
      setThemePreference,
      setShowVersion,
      hasAccess,
    }),
    [user, themePreference, showVersion, users],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
