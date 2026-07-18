import { getDisplayEmail, getDisplayRoles } from '../../../utils/adminUtils'
import type { UserRole } from '@gym-pilot/types'

export type UserActivityRowViewModel = {
  id: string
  eventType: string
  createdAt: string
  eventData: Record<string, unknown>
}

export type UserActivityProfileViewModel = {
  id: string
  name: string
  email: string | null
  roles: UserRole[]
  lastLoggedInAt: string | null
  previousLastLoggedInAt: string | null
}

export function resolveUserActivityViewModel(
  profileRow: Record<string, unknown> | null | undefined,
  activityRows: Array<Record<string, unknown>>,
  emailLookup: Map<string, string | null>,
) {
  const profile = profileRow
    ? {
        id: String(profileRow.user_id ?? ''),
        name: typeof profileRow.friendly_name === 'string' && profileRow.friendly_name.trim()
          ? profileRow.friendly_name.trim()
          : String(profileRow.user_id ?? ''),
        email: emailLookup.get(String(profileRow.user_id ?? '')) ?? null,
        roles: getDisplayRoles(Array.isArray(profileRow.roles) ? profileRow.roles : undefined),
        lastLoggedInAt: typeof profileRow.last_logged_in_at === 'string' ? profileRow.last_logged_in_at : null,
        previousLastLoggedInAt: typeof profileRow.previous_last_logged_in_at === 'string' ? profileRow.previous_last_logged_in_at : null,
      }
    : null

  return {
    profile,
    activityRows: activityRows.map((row) => ({
      id: String(row.id ?? ''),
      eventType: typeof row.event_type === 'string' ? row.event_type : 'activity',
      createdAt: typeof row.created_at === 'string' ? row.created_at : '',
      eventData: (row.event_data && typeof row.event_data === 'object' && !Array.isArray(row.event_data))
        ? row.event_data as Record<string, unknown>
        : {},
    })),
    profileEmailLabel: profile ? getDisplayEmail(profile.email) : null,
  }
}
