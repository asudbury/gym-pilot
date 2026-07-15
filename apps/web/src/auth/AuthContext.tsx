import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User, UserRole } from '@gym-pilot/types'
import { loadJsonRecord, saveJsonRecord, usePlan } from '@gym-pilot/shared'

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

async function readStoredSession(): Promise<AuthUser | null> {
  const stored = await loadJsonRecord<Partial<AuthUser> | null>(SESSION_STORAGE_KEY, null)

  if (!stored?.id || !stored?.name || !stored?.slug || !stored?.role) {
    return null
  }

  return stored as AuthUser
}

async function readBypassFlag(): Promise<boolean> {
  return (await loadJsonRecord<boolean>(BYPASS_STORAGE_KEY, false))
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { users } = usePlan()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isBypassEnabled, setIsBypassEnabled] = useState(false)

  useEffect(() => {
    let isActive = true

    void readStoredSession().then((storedUser) => {
      if (isActive) {
        setUser(storedUser)
      }
    })

    void readBypassFlag().then((storedFlag) => {
      if (isActive) {
        setIsBypassEnabled(storedFlag)
      }
    })

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    if (user) {
      void saveJsonRecord(SESSION_STORAGE_KEY, user)
      return
    }

    void saveJsonRecord(SESSION_STORAGE_KEY, null)
  }, [user])

  useEffect(() => {
    void saveJsonRecord(BYPASS_STORAGE_KEY, isBypassEnabled)
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
