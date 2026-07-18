import type { UserRole } from '@gym-pilot/types'

export type CreateUserProfilePayload = {
  user_id: string
  friendly_name: string
  roles: UserRole[]
  trainer_id: string | null
  gym_brand: string | null
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
}): CreateUserProfilePayload {
  return {
    user_id: values.userId,
    friendly_name: values.displayName,
    roles: values.roles,
    trainer_id: values.roles.includes('client') ? values.selectedTrainerId || null : null,
    gym_brand: null,
    account_tier: 'free',
    access_ends_at: null,
    is_frozen: false,
    must_change_password: true,
  }
}
