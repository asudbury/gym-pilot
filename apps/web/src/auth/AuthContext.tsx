import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { User, UserRole } from '@gym-pilot/types'
import { loadJsonRecord, saveJsonRecord, usePlan } from '@gym-pilot/shared'

const SESSION_STORAGE_KEY = 'gym-pilot-auth-session'
const BYPASS_STORAGE_KEY = 'gym-pilot-auth-bypass'
const CURRENT_USER_ID_STORAGE_KEY = 'gym-pilot-current-user-id'

function isDummyAuthEnabled() {
  return import.meta.env?.VITE_FEATURE_DUMMY_AUTH_ENABLED === 'true'
}

function getDummyAuthUser(): AuthUser | null {
  if (!isDummyAuthEnabled()) {
    return null
  }

  return {
    id: import.meta.env?.VITE_DUMMY_AUTH_USER_ID || 'dummy-user',
    name: import.meta.env?.VITE_DUMMY_AUTH_USER_NAME || 'Demo User',
    slug: import.meta.env?.VITE_DUMMY_AUTH_USER_SLUG || 'dummy-user',
    role: (import.meta.env?.VITE_DUMMY_AUTH_USER_ROLE as UserRole | undefined) || 'client',
  }
}

type AuthUser = Pick<User, 'id' | 'name' | 'slug' | 'role'>

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  isBypassEnabled: boolean
  login: (userId: string) => boolean
  enableBypass: () => void
  disableBypass: () => void
  logout: () => void
  hasAccess: (requiredRole: UserRole | UserRole[]) => boolean
}

type AuthProviderProps = {
  children: ReactNode
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function readStoredSession(): Promise<AuthUser | null> {
  const stored = await loadJsonRecord<Partial<AuthUser> | null>(SESSION_STORAGE_KEY, null)

  if (!stored?.id || !stored?.name || !stored?.slug || !stored?.role) {
    return null
  }

  return stored as AuthUser
}

async function readBypassFlag(): Promise<boolean> {
  return loadJsonRecord<boolean>(BYPASS_STORAGE_KEY, false)
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { users } = usePlan()

  const [user, setUser] = useState<AuthUser | null>(null)
  const [isBypassEnabled, setIsBypassEnabled] = useState(false)

  const sessionHydrated = useRef(false)
  const bypassHydrated = useRef(false)

  useEffect(() => {
    let isActive = true

    async function loadSession() {
      console.log('[Auth] Hydrating session from persistence')
      const storedUser = await readStoredSession()
      const dummyUser = getDummyAuthUser()
      const resolvedUser = storedUser ?? dummyUser

      if (!isActive) {
        return
      }

      console.log('[Auth] Resolved auth state', { storedUserPresent: Boolean(storedUser), dummyUserPresent: Boolean(dummyUser), resolvedUser })

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

    void loadSession()
    void loadBypass()

    return () => {
      isActive = false
    }
  }, [])

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
      role: selectedUser.role,
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
    window.sessionStorage.removeItem(CURRENT_USER_ID_STORAGE_KEY)
    notifyAuthStateChanged()
    setUser(null)
    setIsBypassEnabled(false)
  }

  const hasAccess = (requiredRole: UserRole | UserRole[]) => {
    if (isBypassEnabled) {
      return true
    }

    if (!user) {
      return false
    }

    if (user.role === 'admin') {
      return true
    }

    const requiredRoles = Array.isArray(requiredRole)
      ? requiredRole
      : [requiredRole]

    return requiredRoles.includes(user.role)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: isBypassEnabled || Boolean(user),
      isBypassEnabled,
      login,
      enableBypass,
      disableBypass,
      logout,
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