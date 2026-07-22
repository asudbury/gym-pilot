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
    role: (user.role ?? user.roles?.[0] ?? 'client') as UserRole,
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
