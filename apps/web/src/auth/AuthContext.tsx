import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { UserRole } from '@gym-pilot/types'
import { logger, usePlan, DexiePersistence } from '@gym-pilot/shared'
import { getHashHomeUrl } from '../utils/appUtils'
import { useAuthModule } from '../features/auth/hooks/useAuthModule'
import type { AuthUser } from '../features/auth/domain/authTypes'
import { isUserAccessBlocked } from '../features/auth/domain/authTypes'
import {
  persistThemePreference,
  readStoredThemePreference,
  type ThemePreference,
} from '../features/auth/domain/uiPreferences'

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  themePreference: 'light' | 'dark'
  login: (userId: string) => boolean
  logout: () => void
  updateProfileName: (friendlyName: string) => Promise<void>
  updateApplicationName: (applicationName: string) => Promise<void>
  updateGymBrand: (gymBrand: string) => Promise<void>
  updateGymName: (gymName: string, gymBrand?: string | null) => Promise<void>
  setThemePreference: (theme: 'light' | 'dark') => void
  hasAccess: (requiredRole: UserRole | UserRole[]) => boolean
}

type AuthProviderProps = {
  children: ReactNode
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const persistence = new DexiePersistence();

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
    // Delete the profile record from IndexedDB
    if (user?.id) {
      const profileKey = `profile:${user.id}`;
      void persistence.remove(profileKey).then(() => {
        logger.info(`[Auth] Deleted profile record for user ${user.id}`);
      }).catch((error) => {
        logger.error(`[Auth] Failed to delete profile record for user ${user.id}`, error);
      });
    }
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

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user && !isUserAccessBlocked(user)),
      themePreference,
      login: handleLogin,
      logout,
      updateProfileName,
      updateApplicationName,
      updateGymBrand,
      updateGymName,
      setThemePreference,
      hasAccess,
    }),
    [user, themePreference, users],
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
