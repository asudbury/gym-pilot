import type { User, UserRole } from '@gym-pilot/types'

export type AuthUser = Pick<
  User,
  | 'id'
  | 'name'
  | 'slug'
  | 'role'
  | 'roles'
  | 'trainerId'
  | 'applicationName'
  | 'gymBrand'
  | 'gymName'
  | 'accountTier'
  | 'accessEndsAt'
  | 'isFrozen'
> & {
  email?: string | null
  lastLoggedInAt?: string | null
  previousLastLoggedInAt?: string | null
}

export type AuthUserRole = UserRole

export function isUserAccessBlocked(user: AuthUser | null | undefined) {
  if (!user) {
    return false
  }

  if (user.isFrozen) {
    return true
  }

  if (!user.accessEndsAt) {
    return false
  }

  const parsedDate = new Date(user.accessEndsAt)

  if (Number.isNaN(parsedDate.getTime())) {
    return false
  }

  return parsedDate.getTime() <= Date.now()
}

export function hasAccessToRole(
  user: AuthUser | null | undefined,
  requiredRole: UserRole | UserRole[],
  isBypassEnabled: boolean,
) {
  if (isBypassEnabled) {
    return true
  }

  if (!user || isUserAccessBlocked(user)) {
    return false
  }

  const userRoles =
    Array.isArray(user.roles) && user.roles.length > 0
      ? user.roles.filter((role): role is UserRole =>
          ['admin', 'trainer', 'client', 'guest'].includes(role),
        )
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
