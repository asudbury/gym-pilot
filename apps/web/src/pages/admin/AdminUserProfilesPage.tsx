import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import {
  getSupabaseClient,
  listSupabaseAuthUsers,
  logger,
  saveSupabaseProfileRoles,
  usePlan,
} from '@gym-pilot/shared'
import type { UserRole } from '@gym-pilot/types'
import { AdminSectionShell } from '../../components/admin/AdminSectionShell'
import { GymClubSelector } from '../../components/GymClubSelector'
import {
  availableAdminRoles,
  getDisplayEmail,
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

export function AdminUserProfilesPage() {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()
  const { users, deleteUser } = usePlan()
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
      .select(
        'user_id, friendly_name, trainer_id, application_name, gym_brand, gym_club_id, account_tier, access_ends_at, is_frozen, must_change_password, last_logged_in_at, previous_last_logged_in_at',
      )

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

    const nextRows = (data ?? []).map((row) => mapProfileRow(row, emailLookup))

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

  const userLookup = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  )

  const getTrainerOptionsForProfile = (profile: AdminProfileRow) =>
    resolveTrainerOptions(profile as AdminProfileRow, users)

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
        showVersion: current[profileId]?.showVersion ?? true,
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
      const client = getSupabaseClient()

      if (!client) {
        throw new Error('Supabase is not configured for this session.')
      }

      const profilePayload = {
        user_id: profile.id,
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

      const { error } = await client
        .from('gym_pilot_profile')
        .upsert(profilePayload, { onConflict: 'user_id' })

      if (
        error &&
        /trainer_id|roles|does not exist|column .* does not exist|schema cache/i.test(
          error.message,
        )
      ) {
        const { error: fallbackError } = await client
          .from('gym_pilot_profile')
          .upsert(
            {
              user_id: profile.id,
              friendly_name: trimmedName,
              application_name: draft.applicationName.trim() || null,
              gym_brand: draft.gymClubId
                ? 'Virgin'
                : draft.gymBrand.trim() || null,
              gym_club_id:
                draft.gymClubId && /^\d+$/.test(String(draft.gymClubId))
                  ? Number(draft.gymClubId)
                  : null,
              account_tier: draft.accountTier || 'free',
              access_ends_at: draft.accessEndsAt
                ? new Date(draft.accessEndsAt).toISOString()
                : null,
              is_frozen: draft.isFrozen,
              must_change_password: draft.mustChangePassword,
            },
            { onConflict: 'user_id' },
          )

        if (fallbackError) {
          throw fallbackError
        }
      } else if (error) {
        throw error
      }

      // Ensure the corresponding auth user exists before saving roles.
      const authUsers = await listSupabaseAuthUsers()
      const authUserExists = authUsers.some((u) => u.id === profile.id)

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
        {statusMessage ? (
          <p
            className={`text-sm ${
              statusType === 'error'
                ? 'text-rose-600'
                : statusType === 'success'
                  ? 'text-emerald-600'
                  : 'text-slate-600'
            }`}
          >
            {statusMessage}
          </p>
        ) : null}

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

                      <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                        <p className="text-sm font-medium text-slate-700">
                          Roles
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {availableAdminRoles.map((role) => {
                            const checked =
                              drafts[selectedProfile.id]?.roles.includes(
                                role,
                              ) ?? selectedProfile.roles.includes(role)

                            return (
                              <label
                                key={role}
                                className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-base font-medium text-slate-700"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    const nextRoles = (drafts[
                                      selectedProfile.id
                                    ]?.roles ??
                                      selectedProfile.roles) as UserRole[]
                                    updateDraft(selectedProfile.id, {
                                      roles: toggleRoleSelection(
                                        nextRoles,
                                        role,
                                      ),
                                    })
                                  }}
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
                          value={
                            drafts[selectedProfile.id]?.name ??
                            selectedProfile.name
                          }
                          onChange={(event) =>
                            updateDraft(selectedProfile.id, {
                              name: event.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                        />
                      </label>

                      <label className="mt-3 block text-sm font-medium text-slate-700">
                        Application name
                        <input
                          type="text"
                          value={
                            drafts[selectedProfile.id]?.applicationName ?? ''
                          }
                          onChange={(event) =>
                            updateDraft(selectedProfile.id, {
                              applicationName: event.target.value,
                            })
                          }
                          placeholder="Enter a custom app name"
                          className="mt-1 w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                        />
                      </label>

                      <label className="mt-3 block text-sm font-medium text-slate-700">
                        Gym club (optional)
                        <div className="mt-1">
                          <GymClubSelector
                            value={
                              drafts[selectedProfile.id]?.gymClubId ??
                              drafts[selectedProfile.id]?.gymName ??
                              ''
                            }
                            onChange={(nextValue) =>
                              updateDraft(selectedProfile.id, {
                                gymClubId: nextValue,
                                gymBrand: nextValue
                                  ? 'Virgin'
                                  : (drafts[selectedProfile.id]?.gymBrand ??
                                    ''),
                                gymName:
                                  nextValue ||
                                  (drafts[selectedProfile.id]?.gymName ?? ''),
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
                          value={
                            drafts[selectedProfile.id]?.accountTier ?? 'free'
                          }
                          onChange={(event) =>
                            updateDraft(selectedProfile.id, {
                              accountTier: event.target.value,
                            })
                          }
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
                          value={drafts[selectedProfile.id]?.accessEndsAt ?? ''}
                          onChange={(event) =>
                            updateDraft(selectedProfile.id, {
                              accessEndsAt: event.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                        />
                      </label>

                      <label className="mt-3 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={
                            drafts[selectedProfile.id]?.isFrozen ?? false
                          }
                          onChange={(event) =>
                            updateDraft(selectedProfile.id, {
                              isFrozen: event.target.checked,
                            })
                          }
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

                      {(drafts[selectedProfile.id]?.roles.includes('client') ??
                      selectedProfile.roles.includes('client')) ? (
                        <label className="mt-3 block text-sm font-medium text-slate-700">
                          Assigned trainer
                          <select
                            value={
                              drafts[selectedProfile.id]?.trainerId ??
                              selectedProfile.trainerId ??
                              ''
                            }
                            onChange={(event) =>
                              updateDraft(selectedProfile.id, {
                                trainerId: event.target.value || null,
                              })
                            }
                            className="mt-1 w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                          >
                            <option value="">No trainer assigned</option>
                            {getTrainerOptionsForProfile(selectedProfile).map(
                              (trainer) => (
                                <option key={trainer.id} value={trainer.id}>
                                  {trainer.name}
                                </option>
                              ),
                            )}
                          </select>
                        </label>
                      ) : null}
                    </div>

                    <div className="flex flex-col items-start gap-2">
                      <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={
                            drafts[selectedProfile.id]?.mustChangePassword ??
                            selectedProfile.mustChangePassword
                          }
                          onChange={(event) =>
                            updateDraft(selectedProfile.id, {
                              mustChangePassword: event.target.checked,
                            })
                          }
                        />
                        <span>Must change password</span>
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          tone="blue"
                          onClick={() =>
                            void handleSaveProfile(selectedProfile)
                          }
                          className="px-3 py-1.5"
                          disabled={savingProfileId === selectedProfile.id}
                        >
                          {savingProfileId === selectedProfile.id
                            ? 'Saving…'
                            : 'Save profile'}
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
                  </>
                ) : (
                  <p className="text-sm text-slate-600">No profile selected.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminSectionShell>
  )
}
