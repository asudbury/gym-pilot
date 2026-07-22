import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import {
  getSupabaseClient,
  getSupabaseAdminClient,
  loadSupabaseProfileRoles,
  saveSupabaseProfile,
  saveSupabaseProfileRoles,
  usePlan,
} from '@gym-pilot/shared'
import { AdminSectionShell } from '../../components/admin/AdminSectionShell'
import { logger } from '@gym-pilot/shared'
import { type AdminProfileRow } from '../../features/admin/domain/adminUtils'
import {
  createInitialProfileDraft,
  mapProfileRow,
  type ProfileDraft,
} from '../../features/admin/domain/userProfiles'
import { renderDashboardTimestamp } from '../../utils/appUtils'
import { NotificationPill } from '../../components/NotificationPill'
import { UserProfileForm } from './UserProfileForm'
import { useCopyToClipboard } from './useCopyToClipboard'

const formatStoredTimestamp = (value?: string | null) => {
  if (!value) {
    return 'Not recorded yet'
  }

  return renderDashboardTimestamp(value) ?? 'Invalid date'
}

export function AdminEditUserPage() {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()
  const { users } = usePlan()
  const [profile, setProfile] = useState<AdminProfileRow | null>(null)
  const [draft, setDraft] = useState<ProfileDraft | null>(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusType, setStatusType] = useState<'info' | 'error' | 'success'>(
    'info',
  )
  const [saving, setSaving] = useState(false)
  const { copy, copied: linkCopied, error: copyError } = useCopyToClipboard()
  const [isLoading, setIsLoading] = useState(true)

  const refreshProfile = async () => {
    if (!userId) return

    setStatusMessage('')
    setStatusType('info')

    setIsLoading(true)
    const client = getSupabaseClient()

    if (!client) {
      setStatusMessage('Supabase is not configured for this session.')
      setStatusType('error')
      return
    }

    try {
      const { data, error } = await client
        .from('gym_pilot_profile')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        logger.error('[AdminEditUser] Could not load profile row', error)
        setStatusMessage(`Could not load profile user: ${error.message}`)
        setStatusType('error')
        return
      }

      const emailLookup = new Map<string, string | null>()
      const adminClient = getSupabaseAdminClient()
      if (adminClient) {
        const { data: authData } = await adminClient.auth.admin.getUserById(
          userId,
        )
        if (authData.user) {
          emailLookup.set(authData.user.id, authData.user.email ?? null)
        }
      }

      const roles = await loadSupabaseProfileRoles(userId)
      const next = mapProfileRow(
        { ...(data ?? {}), user_id: userId, roles },
        emailLookup,
      )

      setProfile(next)
      setDraft(createInitialProfileDraft(next))
    } catch (err) {
      logger.error('[AdminEditUser] Failed to refresh profile', err)
      setStatusMessage('An unexpected error occurred while loading the profile.')
      setStatusType('error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refreshProfile()
  }, [userId])

  useEffect(() => {
    if (copyError) {
      setStatusMessage(copyError)
      setStatusType('error')
    }
  }, [copyError])

  const updateDraft = (patch: Partial<ProfileDraft>) => {
    setDraft((current) => ({ ...(current ?? ({} as ProfileDraft)), ...patch }))
  }

  const handleSave = async () => {
    if (!profile || !draft) return

    const trimmedName = draft.name.trim()
    if (!trimmedName) {
      setStatusMessage('Display name cannot be empty.')
      setStatusType('error')
      return
    }

    try {
      setSaving(true)
      const profilePayload = {
        friendly_name: trimmedName,
        email: draft?.email ?? profile.email,
        application_name: draft.applicationName.trim() || null,
        gym_brand: draft.gymClubId ? 'Virgin' : draft.gymBrand.trim() || null,
        gym_club_id:
          draft.gymClubId && /^\d+$/.test(String(draft.gymClubId))
            ? Number(draft.gymClubId)
            : null,
        account_tier: draft.accountTier || 'free',
        access_ends_at: draft.accessEndsAt
          ? new Date(draft.accessEndsAt).toISOString()
          : null,
        is_frozen: draft.isFrozen,
        trainer_id: draft.trainerId ?? null,
        must_change_password: draft.mustChangePassword,
      }

      await saveSupabaseProfile(profilePayload, profile.id)

      await saveSupabaseProfileRoles(draft.roles, profile.id)

      navigate('/admin/users', {
        state: { statusMessage: `Profile for ${trimmedName} updated.` },
      })
    } catch (err) {
      logger.error('[AdminEditUser] Could not save profile', err)
      setStatusMessage('Could not save the profile changes.')
      setStatusType('error')
    } finally {
      setSaving(false)
    }
  }

  const selectedProfile = profile

  return (
    <AdminSectionShell
      title={
        selectedProfile ? `Edit user: ${selectedProfile.name}` : 'Edit user'
      }
      subtitle="Edit user details"
      backTo="/admin/users"
      backLabel="Back to user admin"
      className="max-w-3xl"
    >
      <div className="space-y-2 p-0 md:space-y-4 md:rounded-2xl md:border md:border-slate-200 md:bg-slate-50 md:p-4">
        {isLoading ? (
          <p className="p-4 text-sm text-slate-600">Loading profile...</p>
        ) : statusType === 'error' && !profile ? (
          <p className="p-4 text-sm text-rose-600">{statusMessage}</p>
        ) : selectedProfile ? (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
            <label className="block text-sm font-medium text-slate-700">
              Email address
              <input
                type="email"
                value={draft?.email ?? selectedProfile.email ?? ''}
                disabled
                readOnly
                placeholder="No email available"
                className="mt-1 w-full rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700 disabled:opacity-100"
              />
            </label>

            {draft && (
              <UserProfileForm
                profile={selectedProfile}
                draft={draft}
                users={users}
                onUpdate={updateDraft}
              />
            )}

            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-sm font-medium text-slate-700">
                Login activity
              </p>
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                <p>
                  <span className="font-medium text-slate-700">
                    Last login:
                  </span>{' '}
                  {formatStoredTimestamp(selectedProfile.lastLoggedInAt)}
                </p>
                <p>
                  <span className="font-medium text-slate-700">
                    Previous login:
                  </span>{' '}
                  {formatStoredTimestamp(
                    selectedProfile.previousLastLoggedInAt,
                  )}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                tone="emerald"
                onClick={() => {
                  const email =
                    draft?.email?.trim() ?? selectedProfile.email?.trim()
                  if (!email) {
                    setStatusMessage(
                      'This user does not have an email address to generate an invite link for.',
                    )
                    setStatusType('error')
                    return
                  }
                  const basePath =
                    import.meta.env.BASE_URL === '/'
                      ? ''
                      : import.meta.env.BASE_URL
                  const inviteUrl = new URL(
                    `${window.location.origin}${basePath}#${encodeURIComponent('/login')}`,
                  )
                  inviteUrl.hash = `#/login?email=${encodeURIComponent(email)}`
                  void copy(inviteUrl.toString())
                }}
                className="px-3 py-1.5"
              >
                {linkCopied ? 'Invite link copied' : 'Copy invite link'}
              </Button>

              <Button
                tone="blue"
                onClick={() =>
                  navigate(
                    `/admin/users/profiles/${selectedProfile.id}/activity`,
                  )
                }
                className="px-3 py-1.5"
              >
                View activity
              </Button>
            </div>

            <div className="flex flex-col items-start gap-2 mt-4">
              <div className="flex items-center gap-2">
                <Button
                  tone="blue"
                  onClick={handleSave}
                  className="px-4 py-2"
                  disabled={saving}
                  isLoading={saving}
                  loadingLabel="Saving…"
                >
                  Save profile
                </Button>
                <Button
                  tone="default"
                  onClick={() => navigate('/admin/users')}
                  className="px-3 py-1.5"
                >
                  Cancel
                </Button>
              </div>
            </div>
              <div>
              {statusMessage ? (
                  <NotificationPill
                    message={{ text: statusMessage, tone: statusType }}
                    className="mt-2"
                  />
                ) : null}
            </div>
          </div>
        ) : (
          <NotificationPill
            message={{
              text: 'No profile found',
              tone: 'error',
            }}
            className="mt-2"
          />
        )}
      </div>
    </AdminSectionShell>
  )
}

export default AdminEditUserPage
