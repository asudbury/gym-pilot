import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User, UserRole } from '@gym-pilot/types'
import { usePlan } from '@gym-pilot/shared'

const SESSION_STORAGE_KEY = 'gym-pilot-auth-session'
const BYPASS_STORAGE_KEY = 'gym-pilot-auth-bypass'

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

function readStoredSession(): AuthUser | null {
  if (typeof window === 'undefined') {
    return null
  }

  const stored = window.localStorage.getItem(SESSION_STORAGE_KEY)

  if (!stored) {
    return null
  }

  try {
    const parsed = JSON.parse(stored) as Partial<AuthUser>

    if (!parsed?.id || !parsed?.name || !parsed?.slug || !parsed?.role) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY)
      return null
    }

    return parsed as AuthUser
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
    return null
  }
}

function readBypassFlag() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(BYPASS_STORAGE_KEY) === 'true'
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { users } = usePlan()
  const [user, setUser] = useState<AuthUser | null>(() => readStoredSession())
  const [isBypassEnabled, setIsBypassEnabled] = useState(readBypassFlag)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (user) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user))
      return
    }

    window.localStorage.removeItem(SESSION_STORAGE_KEY)
  }, [user])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(BYPASS_STORAGE_KEY, isBypassEnabled ? 'true' : 'false')
  }, [isBypassEnabled])

  const login = (userId: string) => {
    const selectedUser = users.find((item) => item.id === userId)

    if (!selectedUser) {
      return false
    }

    setUser({
      id: selectedUser.id,
      name: selectedUser.name,
      slug: selectedUser.slug,
      role: selectedUser.role,
    })
    return true
  }

  const enableBypass = () => {
    setIsBypassEnabled(true)
    setUser({
      id: 'mvp-bypass',
      name: 'MVP Admin',
      slug: 'mvp-admin',
      role: 'admin',
    })
  }

  const disableBypass = () => {
    setIsBypassEnabled(false)
    setUser(null)
  }

  const logout = () => {
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

    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]

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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
