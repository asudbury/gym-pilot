import type { UserRole } from '@gym-pilot/types'
import { getDisplayRoles } from './adminUtils'
import type { AdminProfileRow } from './adminUtils'

export type AdminProfileRowLike = AdminProfileRow

export type ProfileDraft = {
  name: string
  applicationName: string
  gymBrand: string
  gymName: string
  gymClubId?: string
  email?: string
  accountTier: string
  accessEndsAt: string
  isFrozen: boolean
  roles: UserRole[]
  trainerId: string | null
  mustChangePassword: boolean
}

export function createInitialProfileDraft(
  profile: AdminProfileRowLike,
): ProfileDraft {
  return {
    name: profile.name,
    email: profile.email ?? '',
    applicationName: profile.applicationName ?? '',
    gymBrand: profile.gymBrand ?? '',
    gymName: profile.gymName ?? '',
    gymClubId: profile.gymName ?? undefined,
    accountTier: profile.accountTier ?? 'free',
    accessEndsAt: profile.accessEndsAt ?? '',
    isFrozen: profile.isFrozen,
    roles: [...profile.roles] as UserRole[],
    trainerId: profile.trainerId ?? null,
    mustChangePassword: profile.mustChangePassword,
  }
}

export function mapProfileRow(
  row: Record<string, unknown>,
  emailLookup: Map<string, string | null>,
): AdminProfileRowLike {
  const friendlyNameValue = row.friendly_name
  const emailValue = (row as Record<string, unknown>).email

  return {
    id: String(row.user_id ?? ''),
    name:
      typeof friendlyNameValue === 'string' && friendlyNameValue.trim()
        ? friendlyNameValue.trim()
        : String(row.user_id ?? ''),
    roles: getDisplayRoles(Array.isArray(row.roles) ? row.roles : undefined),
    applicationName:
      typeof row.application_name === 'string' ? row.application_name : null,
    gymBrand: typeof row.gym_brand === 'string' ? row.gym_brand : null,
    gymName:
      typeof row.gym_club_id === 'number' ? String(row.gym_club_id) : null,
    accountTier:
      typeof row.account_tier === 'string' ? row.account_tier : 'free',
    accessEndsAt:
      typeof row.access_ends_at === 'string' ? row.access_ends_at : null,
    isFrozen: Boolean(row.is_frozen),
    email:
      typeof emailValue === 'string' && emailValue.trim()
        ? emailValue.trim()
        : (emailLookup.get(String(row.user_id ?? '')) ?? null),
    trainerId: typeof row.trainer_id === 'string' ? row.trainer_id : null,
    mustChangePassword: Boolean(row.must_change_password),
    lastLoggedInAt:
      typeof row.last_logged_in_at === 'string' ? row.last_logged_in_at : null,
    previousLastLoggedInAt:
      typeof row.previous_last_logged_in_at === 'string'
        ? row.previous_last_logged_in_at
        : null,
  }
}

export function resolveTrainerOptions(
  profile: AdminProfileRowLike,
  users: Array<{ id: string; name: string; roles: string[] }>,
) {
  const baseOptions = users.filter((user) => user.roles.includes('trainer'))

  if (!profile.roles.includes('trainer')) {
    return baseOptions
  }

  const alreadyHasSelfOption = baseOptions.some(
    (trainer) => trainer.id === profile.id,
  )

  if (alreadyHasSelfOption) {
    return baseOptions
  }

  return [{ id: profile.id, name: profile.name }, ...baseOptions]
}

export function toggleRoleSelection(currentRoles: UserRole[], role: UserRole) {
  return currentRoles.includes(role)
    ? currentRoles.filter((value) => value !== role)
    : [...currentRoles, role]
}
