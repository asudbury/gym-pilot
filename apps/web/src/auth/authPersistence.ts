import type { AuthUser } from '../features/auth/domain/authTypes'

export function shouldPersistAuthSession(
  hasHydrated: boolean,
  user: AuthUser | null,
  hadAuthenticatedUser: boolean,
) {
  if (!hasHydrated) {
    return false
  }

  return Boolean(user) || hadAuthenticatedUser
}
