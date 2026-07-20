import type { UserRole } from '@gym-pilot/types'

export type CreateUserProfilePayload = {
  user_id: string
  friendly_name: string
  trainer_id: string | null
  gym_brand: string | null
  gym_club_id?: string | null
  account_tier: string
  access_ends_at: string | null
  is_frozen: boolean
  must_change_password: boolean
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
  userId: string
  displayName: string
  roles: UserRole[]
  selectedTrainerId: string
  accountTier?: string | null
  accessEndsAt?: string | null
  isFrozen?: boolean
  mustChangePassword?: boolean
  gymBrand?: string | null
  gymClubId?: string | null
}): CreateUserProfilePayload {
  return {
    user_id: values.userId,
    friendly_name: values.displayName,
    trainer_id: values.roles.includes('client')
      ? values.selectedTrainerId || null
      : null,
    gym_brand: typeof values.gymBrand === 'string' ? values.gymBrand : null,
    gym_club_id: values.gymClubId ?? null,
    account_tier: values.accountTier ?? 'free',
    access_ends_at: values.accessEndsAt ?? null,
    is_frozen: Boolean(values.isFrozen),
    must_change_password: values.mustChangePassword ?? true,
  }
}
