import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { AdminSectionShell } from '../../components/admin/AdminSectionShell'
import { getSupabaseClient, listSupabaseAuthUsers, logger } from '@gym-pilot/shared'
import { getDisplayEmail, getDisplayRoles } from '../../utils/adminUtils'

type UserActivityRow = {
  id: string
  eventType: string
  createdAt: string
  eventData: Record<string, unknown>
}

type UserProfileSummary = {
  id: string
  name: string
  email: string | null
  roles: Array<'admin' | 'trainer' | 'client' | 'guest'>
  lastLoggedInAt: string | null
  previousLastLoggedInAt: string | null
}

const formatStoredTimestamp = (value?: string | null) => {
  if (!value) {
    return 'Not recorded yet'
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Invalid date'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate)
}

export function AdminUserActivityPage() {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()
  const [profile, setProfile] = useState<UserProfileSummary | null>(null)
  const [activityRows, setActivityRows] = useState<UserActivityRow[]>([])
  const [statusMessage, setStatusMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const refreshProfileAndActivity = async (profileId: string) => {
    setIsLoading(true)
    setStatusMessage('')

    const client = getSupabaseClient()

    if (!client) {
      setStatusMessage('Supabase is not configured for this session.')
      setIsLoading(false)
      return
    }

    const { data: profileData, error: profileError } = await client
      .from('gym_pilot_profiles')
      .select('user_id, friendly_name, roles, last_logged_in_at, previous_last_logged_in_at')
      .eq('user_id', profileId)
      .maybeSingle()

    if (profileError) {
      logger.error('[AdminUserActivity] Could not load profile summary', profileError)
      setStatusMessage(`Could not load profile: ${profileError.message}`)
      setIsLoading(false)
      return
    }

    const authUsers = await listSupabaseAuthUsers()
    const emailLookup = new Map(authUsers.map((item) => [item.id, item.email ?? null]))

    const nextProfile: UserProfileSummary | null = profileData
      ? {
          id: profileData.user_id,
          name: typeof profileData.friendly_name === 'string' && profileData.friendly_name.trim()
            ? profileData.friendly_name.trim()
            : profileData.user_id,
          email: emailLookup.get(profileData.user_id) ?? null,
          roles: getDisplayRoles(profileData.roles),
          lastLoggedInAt: typeof profileData.last_logged_in_at === 'string' ? profileData.last_logged_in_at : null,
          previousLastLoggedInAt: typeof profileData.previous_last_logged_in_at === 'string' ? profileData.previous_last_logged_in_at : null,
        }
      : null

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
      logger.error('[AdminUserActivity] Could not load user activity', activityError)
      setStatusMessage(`Could not load activity: ${activityError.message}`)
      setActivityRows([])
      setIsLoading(false)
      return
    }

    const nextActivityRows = (activityData ?? []).map((row) => ({
      id: row.id,
      eventType: typeof row.event_type === 'string' ? row.event_type : 'activity',
      createdAt: typeof row.created_at === 'string' ? row.created_at : '',
      eventData: (row.event_data && typeof row.event_data === 'object' && !Array.isArray(row.event_data))
        ? row.event_data as Record<string, unknown>
        : {},
    }))

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

  return (
    <AdminSectionShell
      title={selectedTitle}
      subtitle="Review login history and recent activity for the selected user"
      backTo={userId ? `/admin/users/profiles/${userId}` : '/admin/users'}
      backLabel="Back to profile"
      className="max-w-5xl"
    >
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        {statusMessage ? (
          <p className="text-sm text-slate-600">{statusMessage}</p>
        ) : null}

        {profile ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Profile</p>
                <p className="text-xl font-semibold text-slate-900">{profile.name}</p>
                <p className="text-sm text-slate-600">{getDisplayEmail(profile.email)}</p>
                <div className="flex flex-wrap gap-2">
                  {profile.roles.map((role) => (
                    <span key={role} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
              <Button tone="blue" onClick={() => navigate(`/admin/users/profiles/${profile.id}`)} className="px-3 py-1.5">
                View profile
              </Button>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-medium text-slate-700">Login history</p>
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                <p><span className="font-medium text-slate-700">Your last login:</span>{' '}{formatStoredTimestamp(profile.lastLoggedInAt)}</p>
                <p><span className="font-medium text-slate-700">Your previous login:</span>{' '}{formatStoredTimestamp(profile.previousLastLoggedInAt)}</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-700">User activity</p>
                <span className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Recent</span>
              </div>

              {isLoading ? (
                <p className="mt-2 text-sm text-slate-500">Loading activity…</p>
              ) : activityRows.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No activity logged yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {activityRows.map((activity) => {
                    const activityDetails = Object.entries(activity.eventData ?? {})
                      .filter(([key]) => !['email', 'source'].includes(key))
                      .slice(0, 3)
                      .map(([key, value]) => {
                        const serializedValue = typeof value === 'string' ? value : JSON.stringify(value)
                        return `${key}: ${serializedValue}`
                      }).join(' • ')

                    return (
                      <li key={activity.id} className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-900 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                            {activity.eventType}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatStoredTimestamp(activity.createdAt)}
                          </span>
                        </div>
                        {activityDetails ? (
                          <p className="mt-2 text-sm text-slate-600">{activityDetails}</p>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600">Select a user profile to review their activity.</p>
        )}
      </div>
    </AdminSectionShell>
  )
}
