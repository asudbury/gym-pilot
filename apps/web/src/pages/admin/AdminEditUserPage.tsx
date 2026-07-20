import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import {
  getSupabaseClient,
  listSupabaseAuthUsers,
  logger,
  saveSupabaseProfileRoles,
  saveSupabaseProfileName,
  saveSupabaseProfileEmail,
  saveSupabaseProfileLastLoggedIn,
  usePlan,
} from '@gym-pilot/shared'
import { AdminSectionShell } from '../../components/admin/AdminSectionShell'
import { GymClubSelector } from '../../components/GymClubSelector'
import {
  availableAdminRoles,
  type AdminProfileRow,
} from '../../features/admin/domain/adminUtils'
import {
  createInitialProfileDraft,
  mapProfileRow,
  resolveTrainerOptions,
  toggleRoleSelection,
  type ProfileDraft,
} from '../../features/admin/domain/userProfiles'
import { renderDashboardTimestamp } from '../../utils/appUtils'

const formatStoredTimestamp = (value?: string | null) => {
  if (!value) {
    return 'Not recorded yet'
  }

  return renderDashboardTimestamp(value) ?? 'Invalid date'
}

export function AdminEditUserPage() {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()
  const { users, deleteUser } = usePlan()
  const [profile, setProfile] = useState<AdminProfileRow | null>(null)
  const [draft, setDraft] = useState<ProfileDraft | null>(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusType, setStatusType] = useState<'info' | 'error' | 'success'>(
    'info',
  )
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const refreshProfile = async () => {
    if (!userId) return

    setStatusMessage('')
    setStatusType('info')

    const client = getSupabaseClient()

    if (!client) {
      setStatusMessage('Supabase is not configured for this session.')
      setStatusType('error')
      return
    }

    const { data, error } = await client
      .from('gym_pilot_profile')
      .select(
        'user_id, friendly_name, email, trainer_id, application_name, gym_brand, gym_club_id, account_tier, access_ends_at, is_frozen, must_change_password, last_logged_in_at, previous_last_logged_in_at',
      )
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      logger.error('[AdminEditUser] Could not load profile row', error)
      setStatusMessage(`Could not load profile user: ${error.message}`)
      setStatusType('error')
      return
    }

    const authUsers = await listSupabaseAuthUsers()
    const emailLookup = new Map(authUsers.map((u) => [u.id, u.email ?? null]))

    const next = mapProfileRow(data ?? { user_id: userId }, emailLookup)

    setProfile(next)
    setDraft(createInitialProfileDraft(next))
  }

  useEffect(() => {
    void refreshProfile()
  }, [userId])

  const userLookup = useMemo(
    () => new Map(users.map((u) => [u.id, u])),
    [users],
  )

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
      const client = getSupabaseClient()
      if (!client)
        throw new Error('Supabase is not configured for this session.')

      const profilePayload = {
        user_id: profile.id,
        friendly_name: trimmedName,
        email: draft?.email ?? null,
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

      const { error } = await client
        .from('gym_pilot_profile')
        .upsert(profilePayload, { onConflict: 'user_id' })

      if (error) {
        throw error
      }

      // Ensure auth user exists before saving roles
      const authUsers = await listSupabaseAuthUsers()
      const authUserExists = authUsers.some((u) => u.id === profile.id)

      if (!authUserExists) {
        setStatusMessage(
          `Cannot save roles: no auth user with id ${profile.id} exists.`,
        )
        setStatusType('error')
        setSaving(false)
        return
      }

      await saveSupabaseProfileRoles(draft.roles, profile.id)
      // persist name and email using helpers
      await saveSupabaseProfileName(trimmedName)
      await saveSupabaseProfileEmail(draft?.email ?? null)
      await saveSupabaseProfileLastLoggedIn(profile.id)

      setStatusMessage('Profile updated.')
      setStatusType('success')
      void refreshProfile()
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
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        {statusMessage ? (
          <p
            className={`text-sm ${statusType === 'error' ? 'text-rose-600' : statusType === 'success' ? 'text-emerald-600' : 'text-slate-600'}`}
          >
            {statusMessage}
          </p>
        ) : null}

        {selectedProfile ? (
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

            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-sm font-medium text-slate-700">Roles</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {availableAdminRoles.map((role) => {
                  const checked =
                    draft?.roles.includes(role) ??
                    selectedProfile.roles.includes(role)
                  return (
                    <label
                      key={role}
                      className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-base font-medium text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          updateDraft({
                            roles: toggleRoleSelection(
                              draft?.roles ?? selectedProfile.roles,
                              role,
                            ),
                          })
                        }
                      />
                      <span className="capitalize">{role}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <label className="mt-3 block text-sm font-medium text-slate-700">
              Display name
              <input
                type="text"
                value={draft?.name ?? selectedProfile.name}
                onChange={(e) => updateDraft({ name: e.target.value })}
                className="mt-1 w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              />
            </label>

            <label className="mt-3 block text-sm font-medium text-slate-700">
              Application name
              <input
                type="text"
                value={draft?.applicationName ?? ''}
                onChange={(e) =>
                  updateDraft({ applicationName: e.target.value })
                }
                placeholder="Enter a custom app name"
                className="mt-1 w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              />
            </label>

            <label className="mt-3 block text-sm font-medium text-slate-700">
              Gym club (optional)
              <div className="mt-1">
                <GymClubSelector
                  value={draft?.gymClubId ?? draft?.gymName ?? ''}
                  onChange={(nextValue) =>
                    updateDraft({
                      gymClubId: nextValue,
                      gymBrand: nextValue ? 'Virgin' : (draft?.gymBrand ?? ''),
                      gymName: nextValue || (draft?.gymName ?? ''),
                    })
                  }
                  placeholder="Search for club (Virgin only)"
                  className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                />
              </div>
            </label>

            <label className="mt-3 block text-sm font-medium text-slate-700">
              Account tier
              <select
                value={draft?.accountTier ?? 'free'}
                onChange={(e) => updateDraft({ accountTier: e.target.value })}
                className="mt-1 w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              >
                <option value="free">Free</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
              </select>
            </label>

            <label className="mt-3 block text-sm font-medium text-slate-700">
              Access end date
              <input
                type="date"
                value={draft?.accessEndsAt ?? ''}
                onChange={(e) => updateDraft({ accessEndsAt: e.target.value })}
                className="mt-1 w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              />
            </label>

            <label className="mt-3 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={draft?.isFrozen ?? false}
                onChange={(e) => updateDraft({ isFrozen: e.target.checked })}
              />
              <span>Freeze account</span>
            </label>

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
                onClick={async () => {
                  const email =
                    draft?.email?.trim() ?? selectedProfile.email?.trim()
                  if (!email) {
                    setStatusMessage(
                      'This user does not have an email address to generate an invite link for.',
                    )
                    setStatusType('error')
                    return
                  }
                  try {
                    const basePath =
                      import.meta.env.BASE_URL === '/'
                        ? ''
                        : import.meta.env.BASE_URL
                    const inviteUrl = new URL(
                      `${window.location.origin}${basePath}#${encodeURIComponent('/login')}`,
                    )
                    inviteUrl.hash = `#/login?email=${encodeURIComponent(email)}`
                    await navigator.clipboard.writeText(inviteUrl.toString())
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1500)
                  } catch {
                    setStatusMessage(
                      'Could not copy the invite link. Please try again.',
                    )
                    setStatusType('error')
                  }
                }}
                className="px-3 py-1.5"
              >
                {copied ? 'Invite link copied' : 'Copy invite link'}
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

            {(draft?.roles.includes('client') ??
            selectedProfile.roles.includes('client')) ? (
              <label className="mt-3 block text-sm font-medium text-slate-700">
                Assigned trainer
                <select
                  value={draft?.trainerId ?? selectedProfile.trainerId ?? ''}
                  onChange={(e) =>
                    updateDraft({ trainerId: e.target.value || null })
                  }
                  className="mt-1 w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <option value="">No trainer assigned</option>
                  {resolveTrainerOptions(selectedProfile, users).map(
                    (trainer) => (
                      <option key={trainer.id} value={trainer.id}>
                        {trainer.name}
                      </option>
                    ),
                  )}
                </select>
              </label>
            ) : null}

            <div className="flex flex-col items-start gap-2 mt-4">
              <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={
                    draft?.mustChangePassword ??
                    selectedProfile.mustChangePassword
                  }
                  onChange={(e) =>
                    updateDraft({ mustChangePassword: e.target.checked })
                  }
                />
                <span>Must change password</span>
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  tone="blue"
                  onClick={handleSave}
                  className="px-3 py-1.5"
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save profile'}
                </Button>
                <Button
                  tone="rose"
                  onClick={() => {
                    const localUser = userLookup.get(selectedProfile.id)
                    if (localUser) deleteUser(localUser.id)
                  }}
                  className="px-3 py-1.5"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600">No profile found.</p>
        )}
      </div>
    </AdminSectionShell>
  )
}

export default AdminEditUserPage
