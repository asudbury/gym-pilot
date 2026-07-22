import type { UserRole } from '@gym-pilot/types'
import type { SupabaseProfileUpdatePayload } from '@gym-pilot/shared'

export type CreateUserProfilePayload = SupabaseProfileUpdatePayload & {
  friendly_name: string
}

export type CreateUserFormValues = {
  displayName: string
  email: string
  tempPassword: string
  roles: UserRole[]
  selectedTrainerId: string
}

export function getCreateUserRoleOptions(): UserRole[] {
  return ['admin', 'trainer', 'client']
}

export function buildCreateUserProfilePayload(values: {
  userId?: string
  displayName: string
  roles: UserRole[]
  selectedTrainerId: string
  accountTier?: string | null
  accessEndsAt?: string | null
  isFrozen?: boolean
  mustChangePassword?: boolean
  gymBrand?: string | null
  gymClubId?: string | null
}): SupabaseProfileUpdatePayload {
  return {
    friendly_name: values.displayName,
    trainer_id: values.roles.includes('client')
      ? values.selectedTrainerId || null
      : null,
    gym_brand: typeof values.gymBrand === 'string' ? values.gymBrand : null,
    gym_club_id:
      values.gymClubId && /^\d+$/.test(values.gymClubId)
        ? Number(values.gymClubId)
        : null,
    account_tier: values.accountTier ?? 'free',
    access_ends_at: values.accessEndsAt ?? null,
    is_frozen: Boolean(values.isFrozen),
    must_change_password: values.mustChangePassword ?? true,
  }
}
