import type { AuthUser } from './authTypes'
import { isUserAccessBlocked } from './authTypes'

export function resolveIsAuthenticated(user: AuthUser | null | undefined, isBypassEnabled: boolean) {
  return isBypassEnabled || Boolean(user && !isUserAccessBlocked(user))
}

export function resolvePersistedUserId(user: AuthUser | null | undefined, isBypassEnabled: boolean) {
  if (isBypassEnabled) {
    return 'mvp-bypass'
  }

  return user?.id ?? null
}
