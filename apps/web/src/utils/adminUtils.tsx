import type { UserRole } from '@gym-pilot/types'
import { normalizeUserRoles } from '@gym-pilot/shared'

export type AdminProfileRow = {
  id: string
  name: string
  applicationName?: string | null
  roles: UserRole[]
  email?: string | null
  trainerId?: string | null
  mustChangePassword: boolean
  lastLoggedInAt?: string | null
  previousLastLoggedInAt?: string | null
}

export type AdminActionCard = {
  title: string
  description: string
  href: string
  label: string
}

export const adminCards: AdminActionCard[] = [
  {
    title: 'Preferences',
    description: 'Manage your preferences.',
    href: '/admin/preferences',
    label: 'Preferences',
  },
  {
    title: 'Manage users',
    description: 'Add, edit, or remove users from the application.',
    href: '/admin/users',
    label: 'Manage users',
  },
  {
    title: 'Database',
    description: "Manage the application's database.",
    href: '/admin/database',
    label: 'Database',
  },
]

export const availableAdminRoles: UserRole[] = ['admin', 'trainer', 'client']

export function getDisplayEmail(email?: string | null): string {
  return email?.trim() ? email.trim() : 'No email available'
}

export function getDisplayRoles(roles?: Array<UserRole | string> | null, fallbackRole?: UserRole): UserRole[] {
  return normalizeUserRoles(roles, fallbackRole)
}

export function mapAdminProfileRows(rows: Array<{
  user_id: string
  friendly_name: string | null
  roles?: unknown
  trainer_id?: string | null
  application_name?: string | null
  must_change_password?: boolean
  last_logged_in_at?: string | null
  previous_last_logged_in_at?: string | null
}>, emailLookup: Map<string, string | null>): AdminProfileRow[] {
  return rows.map((row) => ({
    id: row.user_id,
    name: typeof row.friendly_name === 'string' && row.friendly_name.trim() ? row.friendly_name.trim() : row.user_id,
    roles: getDisplayRoles(Array.isArray(row.roles) ? row.roles : undefined),
    applicationName: typeof row.application_name === 'string' ? row.application_name : null,
    email: emailLookup.get(row.user_id) ?? null,
    trainerId: typeof row.trainer_id === 'string' ? row.trainer_id : null,
    mustChangePassword: Boolean(row.must_change_password),
    lastLoggedInAt: typeof row.last_logged_in_at === 'string' ? row.last_logged_in_at : null,
    previousLastLoggedInAt: typeof row.previous_last_logged_in_at === 'string' ? row.previous_last_logged_in_at : null,
  }))
}
