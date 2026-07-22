import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import {
  getSupabaseAdminClient,
  listSupabaseAuthUsers,
  saveSupabaseProfile,
  loadSupabaseProfileRoles,
  logger,
  saveSupabaseProfileRoles,
  usePlan,
  getSupabaseClient,
} from '@gym-pilot/shared'
import type { UserRole } from '@gym-pilot/types'
import { AdminSectionShell } from '../../components/admin/AdminSectionShell'
import {
  getDisplayEmail,
  type AdminProfileRow,
} from '../../features/admin/domain/adminUtils'
import {
  createInitialProfileDraft,
  mapProfileRow,
  type ProfileDraft,
} from '../../features/admin/domain/userProfiles'
import { renderDashboardTimestamp } from '../../utils/appUtils'
import { NotificationPill } from '../../components/NotificationPill'
import { UserProfileForm } from './UserProfileForm'

const formatStoredTimestamp = (value?: string | null) => {
  if (!value) {
    return 'Not recorded yet'
  }

  return renderDashboardTimestamp(value) ?? 'Invalid date'
}

export function AdminUserProfilesPage() {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()
  const { users } = usePlan()
  const [profileRows, setProfileRows] = useState<AdminProfileRow[]>([])
  const [drafts, setDrafts] = useState<Record<string, ProfileDraft>>({})
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(
    userId ?? null,
  )
  const [statusMessage, setStatusMessage] = useState('')
  const [statusType, setStatusType] = useState<'info' | 'error' | 'success'>(
    'info',
  )
  const [savingProfileId, setSavingProfileId] = useState<string | null>(null)
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null)

  const refreshProfiles = async () => {
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
      .select('*')

    if (error) {
      logger.error('[AdminUserProfiles] Could not load profile rows', error)
      setStatusMessage(`Could not load profile users: ${error.message}`)
      setStatusType('error')
      return
    }

    const authUsers = await listSupabaseAuthUsers()
    const emailLookup = new Map(
      authUsers.map((user) => [user.id, user.email ?? null]),
    )

    const userIds = (data ?? []).map((row) => row.user_id)
    const rolesLookup = new Map<string, UserRole[]>()
    for (const userId of userIds) {
      // eslint-disable-next-line no-await-in-loop
      const roles = await loadSupabaseProfileRoles(userId)
      rolesLookup.set(userId, roles)
    }

    const nextRows = (data ?? []).map((row) =>
      mapProfileRow(
        { ...row, roles: rolesLookup.get(row.user_id) ?? [] },
        emailLookup,
      ),
    )

    setProfileRows(nextRows)
    setDrafts((current) => {
      const nextDrafts: Record<string, ProfileDraft> = { ...current }

      nextRows.forEach((row) => {
        nextDrafts[row.id] = createInitialProfileDraft(row)
      })

      return nextDrafts
    })
  }

  useEffect(() => {
    void refreshProfiles()
  }, [])

  const selectedProfile =
    profileRows.find(
      (profile) => profile.id === (userId ?? localSelectedId ?? ''),
    ) ?? profileRows[0]

  const selectedDraft = useMemo(() => {
    if (!selectedProfile) return null
    return drafts[selectedProfile.id] ?? null
  }, [selectedProfile, drafts])
  const updateDraft = (profileId: string, patch: Partial<ProfileDraft>) => {
    setDrafts((current) => ({
      ...current,
      [profileId]: {
        name: current[profileId]?.name ?? '',
        applicationName: current[profileId]?.applicationName ?? '',
        gymBrand: current[profileId]?.gymBrand ?? '',
        gymName: current[profileId]?.gymName ?? '',
        gymClubId: current[profileId]?.gymClubId ?? undefined,
        accountTier: current[profileId]?.accountTier ?? 'free',
        accessEndsAt: current[profileId]?.accessEndsAt ?? '',
        isFrozen: current[profileId]?.isFrozen ?? false,
        roles: current[profileId]?.roles ?? [],
        trainerId: current[profileId]?.trainerId ?? null,
        mustChangePassword: current[profileId]?.mustChangePassword ?? false,
        ...patch,
      },
    }))
  }

  const handleSaveProfile = async (profile: AdminProfileRow) => {
    const draft = drafts[profile.id]

    if (!draft) {
      return
    }

    const trimmedName = draft.name.trim()

    if (!trimmedName) {
      setStatusMessage('Display name cannot be empty.')
      setStatusType('error')
      return
    }

    try {
      setSavingProfileId(profile.id)

      const profilePayload = {
        friendly_name: trimmedName,
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

      // Ensure the corresponding auth user exists before saving roles.
      const adminClient = getSupabaseAdminClient()
      let authUserExists = false
      if (adminClient) {
        const { data } = await adminClient.auth.admin.getUserById(profile.id)
        if (data?.user) {
          authUserExists = true
        }
      }

      if (!authUserExists) {
        // Avoid attempting the insert which would violate FK constraints.
        setStatusMessage(
          `Cannot save roles: no auth user with id ${profile.id} exists. Create the auth user first via the Admin Create User page.`,
        )
        setStatusType('error')
        setSavingProfileId(null)
        return
      }

      try {
        await saveSupabaseProfileRoles(draft.roles, profile.id)
      } catch (err) {
        logger.error('[AdminUserProfiles] Could not save profile roles', err)
        setStatusMessage('Could not save roles: database constraint error.')
        setStatusType('error')
        setSavingProfileId(null)
        return
      }
      await refreshProfiles()
      setStatusMessage(`Profile updated for ${trimmedName}.`)
      setStatusType('success')
      navigate('/admin/users', { replace: true })
    } catch (err) {
      logger.error('[AdminUserProfiles] Could not save profile', err)
      setStatusMessage('Could not save the profile changes.')
      setStatusType('error')
    } finally {
      setSavingProfileId(null)
    }
  }

  const selectedTitle = selectedProfile
    ? `User profile: ${selectedProfile.name}`
    : 'User profile'

  return (
    <AdminSectionShell
      title={selectedTitle}
      subtitle="Manage profile details for the selected user"
      backTo="/admin/users"
      backLabel="Back to user admin"
      className="max-w-5xl"
    >
      <div className="space-y-2 p-0 md:space-y-4 md:rounded-2xl md:border md:border-slate-200 md:bg-slate-50 md:p-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          {profileRows.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">
              No profiles available yet.
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-1 space-y-2">
                {profileRows.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLocalSelectedId(p.id)
                        navigate(`/admin/users/profiles/${p.id}`)
                      }}
                      className={`w-full text-left rounded-2xl border px-4 py-3 ${
                        selectedProfile?.id === p.id
                          ? 'border-slate-400 bg-slate-100'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="text-sm font-semibold text-slate-800">
                        {p.name}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        {getDisplayEmail(p.email)}
                      </div>
                      <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                        {p.roles.join(', ')}
                      </div>
                    </button>

                    <Button
                      type="button"
                      onClick={() => {
                        setLocalSelectedId(p.id)
                        navigate(`/admin/users/profiles/${p.id}`)
                      }}
                      className="ml-1 rounded-full px-1 text-sm leading-none text-slate-500 hover:text-slate-700"
                      aria-label={`Edit ${p.name}`}
                    >
                      ✎
                    </Button>
                  </div>
                ))}
              </div>
              <div className="col-span-2">
                {selectedProfile ? (
                  <>
                    <div className="min-w-0 flex-1">
                      <label className="block text-sm font-medium text-slate-700">
                        Email address
                        <p className="mt-1 text-lg font-semibold text-slate-700">
                          {getDisplayEmail(selectedProfile.email)}
                        </p>
                      </label>

                      {selectedDraft ? (
                        <UserProfileForm
                          profile={selectedProfile}
                          draft={selectedDraft}
                          users={users}
                          onUpdate={(patch) =>
                            updateDraft(selectedProfile.id, patch)
                          }
                        />
                      ) : null}

                      <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                        <p className="text-sm font-medium text-slate-700">
                          Login activity
                        </p>
                        <div className="mt-2 space-y-1 text-sm text-slate-600">
                          <p>
                            <span className="font-medium text-slate-700">
                              Last login:
                            </span>{' '}
                            {formatStoredTimestamp(
                              selectedProfile.lastLoggedInAt,
                            )}
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
                            const email = selectedProfile.email?.trim()
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
                              await navigator.clipboard.writeText(
                                inviteUrl.toString(),
                              )
                              setCopiedUserId(selectedProfile.id)
                              window.setTimeout(
                                () =>
                                  setCopiedUserId((current) =>
                                    current === selectedProfile.id
                                      ? null
                                      : current,
                                  ),
                                1500,
                              )
                            } catch {
                              setStatusMessage(
                                'Could not copy the invite link. Please try again.',
                              )
                              setStatusType('error')
                            }
                          }}
                          className="px-3 py-1.5"
                        >
                          {copiedUserId === selectedProfile.id
                            ? 'Invite link copied'
                            : 'Copy invite link'}
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

                    </div>

                    <div className="flex flex-col items-start gap-2">
                      <div className="flex flex-col items-start gap-2">
                        <Button
                          tone="blue"
                          onClick={() =>
                            void handleSaveProfile(selectedProfile)
                          }
                          className="px-4 py-2"
                          disabled={savingProfileId === selectedProfile.id}
                        >
                          {savingProfileId === selectedProfile.id
                            ? 'Saving…'
                            : 'Save profile'}
                        </Button>
                        {statusMessage ? (
                          <NotificationPill
                            message={{ text: statusMessage, tone: statusType }}
                            className="mt-2"
                          />
                        ) : null}
                      </div>
                    </div>
                  </>
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
            </div>
          )}
        </div>
      </div>
    </AdminSectionShell>
  )
}
