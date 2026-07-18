import type { User, UserRole } from '@gym-pilot/types'
import type { AuthUser } from './authTypes'

export function toAuthUser(user: User | null | undefined): AuthUser | null {
  if (!user) {
    return null
  }

  return {
    id: user.id,
    name: user.name,
    slug: user.slug,
    role: (user.role ?? (user.roles?.[0] ?? 'client')) as UserRole,
    roles: (user.roles ?? []) as UserRole[],
    trainerId: user.trainerId ?? null,
    applicationName: user.applicationName ?? null,
    gymBrand: user.gymBrand ?? null,
    gymName: user.gymName ?? null,
    accountTier: user.accountTier ?? null,
    accessEndsAt: user.accessEndsAt ?? null,
    isFrozen: user.isFrozen ?? false,
    email: null,
  }
}

export function toAuthUserFromBypass(): AuthUser {
  return {
    id: 'mvp-bypass',
    name: 'MVP Admin',
    slug: 'mvp-admin',
    role: 'admin',
    roles: ['admin'],
    trainerId: null,
    applicationName: null,
    gymBrand: null,
    gymName: null,
    accountTier: null,
    accessEndsAt: null,
    isFrozen: false,
    email: null,
  }
}
