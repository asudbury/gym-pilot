import type { User, UserRole } from '@gym-pilot/types'
import type { AuthUser } from './authTypes'
import { hasAccessToRole } from './authTypes'
import { toAuthUser } from './authMapping'
import { resolvePersistedUserId } from './authState'

export function resolveLoginAuthUser(users: User[], userId: string) {
  const selectedUser = users.find((item) => item.id === userId)
  return selectedUser ? toAuthUser(selectedUser) : null
}

export function resolveAuthUserProfileNameUpdate(user: AuthUser | null, friendlyName: string) {
  if (!user) {
    return null
  }

  const trimmedName = friendlyName.trim()
  const slug = trimmedName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') || 'user'

  return {
    user: {
      ...user,
      name: trimmedName,
      slug,
    },
    persistedUserId: resolvePersistedUserId(user),
  }
}

export function resolveAuthUserApplicationNameUpdate(user: AuthUser | null, applicationName: string) {
  if (!user) {
    return null
  }

  const trimmedName = applicationName.trim()

  return {
    user: {
      ...user,
      applicationName: trimmedName || null,
    },
    persistedUserId: resolvePersistedUserId(user),
  }
}

export function resolveAuthUserGymBrandUpdate(user: AuthUser | null, gymBrand: string) {
  if (!user) {
    return null
  }

  const trimmedValue = gymBrand.trim()
  const previousGymName = user.gymName ?? null
  const isVirginBrand = trimmedValue.toLowerCase() === 'virgin'

  return {
    user: {
      ...user,
      gymBrand: trimmedValue || null,
      gymName: isVirginBrand ? user.gymName ?? previousGymName : null,
    },
    persistedUserId: resolvePersistedUserId(user),
    isVirginBrand,
    previousGymName,
  }
}

export function resolveAuthUserGymNameUpdate(user: AuthUser | null, gymName: string, gymBrand?: string | null) {
  if (!user) {
    return null
  }

  const trimmedValue = gymName.trim()
  const resolvedBrand = (gymBrand ?? user?.gymBrand ?? '').trim().toLowerCase()
  const isVirginBrand = resolvedBrand === 'virgin'

  return {
    user: {
      ...user,
      gymName: isVirginBrand && trimmedValue ? trimmedValue : null,
    },
    persistedUserId: resolvePersistedUserId(user),
  }
}

export function resolveAuthAccessState(user: AuthUser | null, requiredRole: UserRole | UserRole[]) {
  return {
    isAuthenticated: user !== null,
    hasAccess: hasAccessToRole(user, requiredRole, false),
  }
}
