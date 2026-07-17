import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { User, UserRole } from '@gym-pilot/types'
import { getSupabaseClient, loadJsonRecord, loadSupabaseProfileName, normalizeUserRoles, saveJsonRecord, saveSupabaseProfileName, signOutFromSupabase, usePlan } from '@gym-pilot/shared'

const SESSION_STORAGE_KEY = 'gym-pilot-auth-session'
const BYPASS_STORAGE_KEY = 'gym-pilot-auth-bypass'
const CURRENT_USER_ID_STORAGE_KEY = 'gym-pilot-current-user-id'
const LOGOUT_PENDING_STORAGE_KEY = 'gym-pilot-auth-logout-pending'
const THEME_STORAGE_KEY = 'gym-pilot-theme-preference'

type AuthUser = Pick<User, 'id' | 'name' | 'slug' | 'role' | 'roles'> & { email?: string | null }

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  isBypassEnabled: boolean
  themePreference: 'light' | 'dark'
  login: (userId: string) => boolean
  enableBypass: () => void
  disableBypass: () => void
  logout: () => void
  updateProfileName: (friendlyName: string) => Promise<void>
  setThemePreference: (theme: 'light' | 'dark') => void
  hasAccess: (requiredRole: UserRole | UserRole[]) => boolean
}

type AuthProviderProps = {
  children: ReactNode
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function readStoredSession(): Promise<AuthUser | null> {
  const stored = await loadJsonRecord<Partial<AuthUser> | null>(SESSION_STORAGE_KEY, null)

if (!stored?.id || !stored?.name || !stored?.slug) {
    return null
  }

  return stored as AuthUser
}

async function readBypassFlag(): Promise<boolean> {
  return loadJsonRecord<boolean>(BYPASS_STORAGE_KEY, false)
}

async function resolveSupabaseAuthUser(users: User[] = []): Promise<AuthUser | null> {
  const client = getSupabaseClient()

  if (!client) {
    return null
  }

  try {
    const { data: { session }, error } = await client.auth.getSession()

    if (error) {
      console.warn('[Auth] Could not read Supabase session', error)
      return null
    }

    const supabaseUser = session?.user

    if (!supabaseUser) {
      return null
    }

    const storedProfileName = await loadSupabaseProfileName()
    const displayName = storedProfileName || supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email || 'Supabase user'
    const slug = displayName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') || 'supabase-user'
    const matchingProfileUser = users.find((user) => user.id === supabaseUser.id)
    const resolvedRoles = normalizeUserRoles(matchingProfileUser?.roles, matchingProfileUser?.role)
    const resolvedRole = (matchingProfileUser?.role ?? resolvedRoles[0] ?? 'client') as UserRole

    await saveSupabaseProfileName(displayName)

    return {
      id: supabaseUser.id,
      name: matchingProfileUser?.name || displayName,
      slug: matchingProfileUser?.slug || slug,
      role: resolvedRole,
      roles: resolvedRoles,
      email: supabaseUser.email ?? null,
    }
  } catch (error) {
    console.warn('[Auth] Supabase session lookup failed', error)
    return null
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { users } = usePlan()

  const [user, setUser] = useState<AuthUser | null>(null)
  const [isBypassEnabled, setIsBypassEnabled] = useState(false)
  const [themePreference, setThemePreferenceState] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') {
      return 'light'
    }

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    return storedTheme === 'dark' ? 'dark' : 'light'
  })

  const sessionHydrated = useRef(false)
  const bypassHydrated = useRef(false)

  useEffect(() => {
    let isActive = true

    async function loadSession() {
      console.log('[Auth] Hydrating session from persistence')
      const storedUser = await readStoredSession()
      const resolvedUser = storedUser

      if (!isActive) {
        return
      }

      console.log('[Auth] Resolved auth state', { storedUserPresent: Boolean(storedUser), resolvedUser })

      if (resolvedUser) {
        window.sessionStorage.setItem(CURRENT_USER_ID_STORAGE_KEY, resolvedUser.id)
      } else {
        window.sessionStorage.removeItem(CURRENT_USER_ID_STORAGE_KEY)
      }

      setUser(resolvedUser)
      sessionHydrated.current = true
    }

    async function loadBypass() {
      const storedFlag = await readBypassFlag()

      if (!isActive) {
        return
      }

      setIsBypassEnabled(storedFlag)
      bypassHydrated.current = true
    }

    async function syncSupabaseSession() {
      if (window.sessionStorage.getItem(LOGOUT_PENDING_STORAGE_KEY) === 'true') {
        console.log('[Auth] Skipping Supabase session sync while logout is pending')
        return
      }

      const supabaseUser = await resolveSupabaseAuthUser(users)

      if (!isActive) {
        return
      }

      if (supabaseUser) {
        console.log('[Auth] Synced Supabase auth state', { user: supabaseUser })
        setUser(supabaseUser)
        setIsBypassEnabled(false)
        window.sessionStorage.setItem(CURRENT_USER_ID_STORAGE_KEY, supabaseUser.id)
      }
    }

    const handleAuthStateChanged = () => {
      void syncSupabaseSession()
    }

    window.addEventListener('gym-pilot-auth-updated', handleAuthStateChanged)

    void loadSession()
    void loadBypass()
    void syncSupabaseSession()

    return () => {
      isActive = false
      window.removeEventListener('gym-pilot-auth-updated', handleAuthStateChanged)
    }
  }, [users])

  useEffect(() => {
    if (!sessionHydrated.current) {
      return
    }

    console.log('[Auth] Persisting session state', { user })
    void saveJsonRecord(SESSION_STORAGE_KEY, user)
  }, [user])

  useEffect(() => {
    if (!bypassHydrated.current) {
      return
    }

    console.log('[Auth] Persisting bypass state', { isBypassEnabled })
    void saveJsonRecord(BYPASS_STORAGE_KEY, isBypassEnabled)
  }, [isBypassEnabled])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    document.documentElement.classList.toggle('dark', themePreference === 'dark')
    document.documentElement.style.colorScheme = themePreference
    window.localStorage.setItem(THEME_STORAGE_KEY, themePreference)
  }, [themePreference])

  const notifyAuthStateChanged = () => {
    window.dispatchEvent(new Event('gym-pilot-auth-updated'))
  }

  const login = (userId: string) => {
    console.log('[Auth] Login requested', { userId })
    const selectedUser = users.find((item) => item.id === userId)

    if (!selectedUser) {
      return false
    }

    window.sessionStorage.setItem(CURRENT_USER_ID_STORAGE_KEY, selectedUser.id)
    notifyAuthStateChanged()
    console.log('[Auth] Login succeeded', { selectedUser })

    setUser({
      id: selectedUser.id,
      name: selectedUser.name,
      slug: selectedUser.slug,
      role: selectedUser.role ?? (selectedUser.roles[0] ?? 'client'),
      roles: selectedUser.roles,
      email: null,
    })

    return true
  }

  const enableBypass = () => {
    console.log('[Auth] Bypass enabled')
    window.sessionStorage.setItem(CURRENT_USER_ID_STORAGE_KEY, 'mvp-bypass')
    notifyAuthStateChanged()
    setIsBypassEnabled(true)

    setUser({
      id: 'mvp-bypass',
      name: 'MVP Admin',
      slug: 'mvp-admin',
      role: 'admin',
      roles: ['admin'],
      email: null,
    })
  }

  const disableBypass = () => {
    console.log('[Auth] Bypass disabled')
    window.sessionStorage.removeItem(CURRENT_USER_ID_STORAGE_KEY)
    notifyAuthStateChanged()
    setIsBypassEnabled(false)
    setUser(null)
  }

  const logout = () => {
    console.log('[Auth] Logout requested')
    window.sessionStorage.setItem(LOGOUT_PENDING_STORAGE_KEY, 'true')
    window.sessionStorage.removeItem(CURRENT_USER_ID_STORAGE_KEY)
    setUser(null)
    setIsBypassEnabled(false)

    void signOutFromSupabase().finally(() => {
      window.sessionStorage.removeItem(LOGOUT_PENDING_STORAGE_KEY)
      if (typeof window !== 'undefined') {
        window.location.assign('/')
      }
    })
  }

  const updateProfileName = async (friendlyName: string) => {
    const trimmedName = friendlyName.trim()

    if (!user) {
      return
    }

    const nextName = trimmedName || user.name
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

    await saveSupabaseProfileName(nextName)
  }

  const setThemePreference = (theme: 'light' | 'dark') => {
    setThemePreferenceState(theme)
  }

  const hasAccess = (requiredRole: UserRole | UserRole[]) => {
    if (isBypassEnabled) {
      return true
    }

    if (!user) {
      return false
    }

    const userRoles = Array.isArray(user.roles) && user.roles.length > 0
      ? user.roles.filter((role): role is UserRole => ['admin', 'trainer', 'client', 'guest'].includes(role))
      : user.role
        ? [user.role]
        : []

    if (userRoles.includes('admin')) {
      return true
    }

    const requiredRoles = Array.isArray(requiredRole)
      ? requiredRole
      : [requiredRole]

    return requiredRoles.some((role) => userRoles.includes(role))
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: isBypassEnabled || Boolean(user),
      isBypassEnabled,
      themePreference,
      login,
      enableBypass,
      disableBypass,
      logout,
      updateProfileName,
      setThemePreference,
      hasAccess,
    }),
    [user, isBypassEnabled, users],
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