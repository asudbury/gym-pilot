import type { AuthUser } from './authTypes'
import { isUserAccessBlocked } from './authTypes'

export function resolveIsAuthenticated(user: AuthUser | null | undefined) {
  return Boolean(user && !isUserAccessBlocked(user))
}

export function resolvePersistedUserId(user: AuthUser | null | undefined) {
  return user?.id ?? null
}
