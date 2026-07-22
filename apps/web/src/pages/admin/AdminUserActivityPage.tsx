import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { AdminSectionShell } from '../../components/admin/AdminSectionShell'
import {
  getSupabaseClient,
  listSupabaseAuthUsers,
  loadSupabaseProfileRoles,
  logger,
} from '@gym-pilot/shared'
import { getDisplayEmail } from '../../features/admin/domain/adminUtils'
import {
  resolveUserActivityViewModel,
  type UserActivityProfileViewModel,
  type UserActivityRowViewModel,
} from '../../features/admin/domain/userActivity'
import { renderDashboardTimestamp } from '../../utils/appUtils'

const formatStoredTimestamp = (value?: string | null) => {
  if (!value) {
    return 'Not recorded yet'
  }

  return renderDashboardTimestamp(value) ?? 'Invalid date'
}

export function AdminUserActivityPage() {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()
  const [profile, setProfile] = useState<UserActivityProfileViewModel | null>(
    null,
  )
  const [activityRows, setActivityRows] = useState<UserActivityRowViewModel[]>(
    [],
  )
  const [statusMessage, setStatusMessage] = useState('')
  const [statusType, setStatusType] = useState<'info' | 'error' | 'success'>(
    'info',
  )
  const [isLoading, setIsLoading] = useState(false)
  const [friendlyNameFilter, setFriendlyNameFilter] = useState('')

  const refreshProfileAndActivity = async (profileId: string) => {
    setIsLoading(true)
    setStatusMessage('')

    const client = getSupabaseClient()

    if (!client) {
      setStatusMessage('Supabase is not configured for this session.')
      setStatusType('error')
      setIsLoading(false)
      return
    }

    const { data: profileData, error: profileError } = await client
      .from('gym_pilot_profile')
      .select('*')
      .eq('user_id', profileId)
      .maybeSingle()

    if (profileError) {
      logger.error(
        '[AdminUserActivity] Could not load profile summary',
        profileError,
      )
      setStatusMessage(`Could not load profile: ${profileError.message}`)
      setStatusType('error')
      setIsLoading(false)
      return
    }

    const authUsers = await listSupabaseAuthUsers()
    const emailLookup = new Map(
      authUsers.map((item) => [item.id, item.email ?? null]),
    )
    const profileRoles = await loadSupabaseProfileRoles(profileId)
    const viewModel = resolveUserActivityViewModel(
      profileData ? { ...profileData, roles: profileRoles } : profileData,
      [],
      emailLookup,
    )
    const nextProfile = viewModel.profile

    setProfile(nextProfile)

    if (!nextProfile) {
      setActivityRows([])
      setIsLoading(false)
      return
    }

    const { data: activityData, error: activityError } = await client
      .from('gym_pilot_user_activity')
      .select('id, event_type, event_data, created_at')
      .eq('user_id', nextProfile.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (activityError) {
      logger.error(
        '[AdminUserActivity] Could not load user activity',
        activityError,
      )
      setStatusMessage(`Could not load activity: ${activityError.message}`)
      setStatusType('error')
      setActivityRows([])
      setIsLoading(false)
      return
    }

    const nextActivityRows = resolveUserActivityViewModel(
      profileData ? { ...profileData, roles: profileRoles } : profileData,
      activityData ?? [],
      emailLookup,
    ).activityRows

    setActivityRows(nextActivityRows)
    setIsLoading(false)
  }

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      setActivityRows([])
      return
    }

    void refreshProfileAndActivity(userId)
  }, [userId])

  const selectedTitle = profile ? `Activity: ${profile.name}` : 'User activity'

  const filteredActivityRows = activityRows.filter((activity) => {
    const normalizedFilter = friendlyNameFilter.trim().toLowerCase()

    if (!normalizedFilter) {
      return true
    }

    const activityText = [
      profile?.name ?? '',
      activity.eventType,
      Object.entries(activity.eventData ?? {})
        .filter(([key]) => !['email', 'source'].includes(key))
        .map(
          ([key, value]) =>
            `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`,
        )
        .join(' '),
    ]
      .join(' ')
      .toLowerCase()

    return activityText.includes(normalizedFilter)
  })

  return (
    <AdminSectionShell
      title={selectedTitle}
      subtitle="Review login history and recent activity for the selected user"
      backTo={userId ? `/admin/users/profiles/${userId}` : '/admin/users'}
      backLabel="Back to profile"
      className="max-w-5xl"
    >
      <div className="space-y-2 p-0 md:space-y-4 md:rounded-2xl md:border md:border-slate-200 md:bg-slate-50 md:p-4">
        {statusMessage ? (
          <p
            className={`text-sm ${statusType === 'error' ? 'text-rose-600' : 'text-slate-600'}`}
          >
            {statusMessage}
          </p>
        ) : null}

        {profile ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Profile</p>
                <p className="text-xl font-semibold text-slate-900">
                  {profile.name}
                </p>
                <p className="text-sm text-slate-600">
                  {getDisplayEmail(profile.email)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {profile.roles.map((role) => (
                    <span
                      key={role}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
              <Button
                tone="blue"
                onClick={() => navigate(`/admin/users/profiles/${profile.id}`)}
                className="px-3 py-1.5"
              >
                View profile
              </Button>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-medium text-slate-700">
                Login history
              </p>
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                <p>
                  <span className="font-medium text-slate-700">
                    Your last login:
                  </span>{' '}
                  {formatStoredTimestamp(profile.lastLoggedInAt)}
                </p>
                <p>
                  <span className="font-medium text-slate-700">
                    Your previous login:
                  </span>{' '}
                  {formatStoredTimestamp(profile.previousLastLoggedInAt)}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-slate-700">
                  User activity
                </p>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="font-medium">Friendly name</span>
                  <input
                    type="text"
                    value={friendlyNameFilter}
                    onChange={(event) =>
                      setFriendlyNameFilter(event.target.value)
                    }
                    placeholder="Filter activities"
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm"
                  />
                </label>
              </div>

              {isLoading ? (
                <p className="mt-2 text-sm text-slate-500">Loading activity…</p>
              ) : activityRows.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  No activity logged yet.
                </p>
              ) : filteredActivityRows.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  No activity matches this filter.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {filteredActivityRows.map((activity) => {
                    const activityDetails = Object.entries(
                      activity.eventData ?? {},
                    )
                      .filter(([key]) => !['email', 'source'].includes(key))
                      .slice(0, 3)
                      .map(([key, value]) => {
                        const serializedValue =
                          typeof value === 'string'
                            ? value
                            : JSON.stringify(value)
                        return `${key}: ${serializedValue}`
                      })
                      .join(' • ')

                    return (
                      <li
                        key={activity.id}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-2"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-900 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                            {activity.eventType}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatStoredTimestamp(activity.createdAt)}
                          </span>
                        </div>
                        {activityDetails ? (
                          <p className="mt-2 text-sm text-slate-600">
                            {activityDetails}
                          </p>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            Select a user profile to review their activity.
          </p>
        )}
      </div>
    </AdminSectionShell>
  )
}
