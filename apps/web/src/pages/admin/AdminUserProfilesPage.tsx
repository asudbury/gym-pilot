import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import {
  getSupabaseClient,
  listSupabaseAuthUsers,
  logger,
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
import { formatDashboardTimestamp } from '../../utils/appUtils'

const formatStoredTimestamp = (value?: string | null) => {
  if (!value) {
    return 'Not recorded yet'
  }

  return formatDashboardTimestamp(value) ?? 'Invalid date'
}

const formatLocalDateTimeInputValue = (value?: string | null) => {
  if (!value) {
    return ''
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return ''
  }

  const offsetMinutes = parsedDate.getTimezoneOffset()
  const localDate = new Date(parsedDate.getTime() - offsetMinutes * 60_000)
  return localDate.toISOString().slice(0, 16)
}

export function AdminUserProfilesPage() {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()
  const { users, deleteUser } = usePlan()
  const [profileRows, setProfileRows] = useState<AdminProfileRow[]>([])
  const [drafts, setDrafts] = useState<Record<string, ProfileDraft>>({})
  const [statusMessage, setStatusMessage] = useState('')
  const [savingProfileId, setSavingProfileId] = useState<string | null>(null)

  const refreshProfiles = async () => {
    setStatusMessage('')

    const client = getSupabaseClient()

    if (!client) {
      setStatusMessage('Supabase is not configured for this session.')
      return
    }

    const { data, error } = await client
      .from('gym_pilot_profile')
      .select(
        'user_id, friendly_name, roles, trainer_id, application_name, gym_brand, gym_club_id, account_tier, access_ends_at, is_frozen, must_change_password, last_logged_in_at, previous_last_logged_in_at',
      )

    if (error) {
      logger.error('[AdminUserProfiles] Could not load profile rows', error)
      setStatusMessage(`Could not load profile users: ${error.message}`)
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
    profileRows.find((profile) => profile.id === userId) ?? profileRows[0]

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
        gym_brand: draft.gymBrand.trim() || null,
        gym_club_id:
          draft.gymName.trim() && /^\d+$/.test(draft.gymName.trim())
            ? Number(draft.gymName.trim())
            : null,
        account_tier: draft.accountTier || 'free',
        access_ends_at: draft.accessEndsAt
          ? new Date(draft.accessEndsAt).toISOString()
          : null,
        is_frozen: draft.isFrozen,
        roles: draft.roles,
        trainer_id: draft.trainerId ?? null,
        must_change_password: draft.mustChangePassword,
      }

      const { error } = await client
        .from('gym_pilot_profile')
        .upsert(profilePayload, { onConflict: 'user_id' })

      if (
        error &&
        /trainer_id|does not exist|column .* does not exist/i.test(
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
              gym_brand: draft.gymBrand.trim() || null,
              gym_club_id:
                draft.gymName.trim() && /^\d+$/.test(draft.gymName.trim())
                  ? Number(draft.gymName.trim())
                  : null,
              account_tier: draft.accountTier || 'free',
              access_ends_at: draft.accessEndsAt
                ? new Date(draft.accessEndsAt).toISOString()
                : null,
              is_frozen: draft.isFrozen,
              roles: draft.roles,
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

      await refreshProfiles()
      setStatusMessage(`Profile updated for ${trimmedName}.`)
      navigate('/admin/users', { replace: true })
    } catch (error) {
      logger.error('[AdminUserProfiles] Could not save profile', error)
      setStatusMessage('Could not save the profile changes.')
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
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        {statusMessage ? (
          <p className="text-sm text-slate-600">{statusMessage}</p>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          {profileRows.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">
              No profiles available yet.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {profileRows.map((profile) => {
                const draft = drafts[profile.id]
                const trainerOptions = getTrainerOptionsForProfile(profile)

                return (
                  <div
                    key={profile.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-3">
                        <div className="min-w-0 flex-1">
                          <label className="block text-sm font-medium text-slate-700">
                            Email address
                            <p className="mt-1 text-lg font-semibold text-slate-700">
                              {getDisplayEmail(profile.email)}
                            </p>
                          </label>

                          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                            <p className="text-sm font-medium text-slate-700">
                              Roles
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {availableAdminRoles.map((role) => {
                                const checked =
                                  draft?.roles.includes(role) ??
                                  profile.roles.includes(role)

                                return (
                                  <label
                                    key={role}
                                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-base font-medium text-slate-700"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => {
                                        const nextRoles = (draft?.roles ??
                                          profile.roles) as UserRole[]
                                        updateDraft(profile.id, {
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
                              value={draft?.name ?? profile.name}
                              onChange={(event) =>
                                updateDraft(profile.id, {
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
                              value={draft?.applicationName ?? ''}
                              onChange={(event) =>
                                updateDraft(profile.id, {
                                  applicationName: event.target.value,
                                })
                              }
                              placeholder="Enter a custom app name"
                              className="mt-1 w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                            />
                          </label>

                          <label className="mt-3 block text-sm font-medium text-slate-700">
                            Gym brand
                            <select
                              value={draft?.gymBrand ?? ''}
                              onChange={(event) => {
                                const nextBrand = event.target.value
                                updateDraft(profile.id, {
                                  gymBrand: nextBrand,
                                  gymName:
                                    nextBrand.trim().toLowerCase() === 'virgin'
                                      ? (draft?.gymName ?? '')
                                      : '',
                                })
                              }}
                              className="mt-1 w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                            >
                              <option value="">Select a brand</option>
                              <option value="Virgin">Virgin</option>
                            </select>
                          </label>

                          <label className="mt-3 block text-sm font-medium text-slate-700">
                            Gym name
                            <div className="mt-1">
                              <GymClubSelector
                                value={draft?.gymName ?? ''}
                                onChange={(nextValue) =>
                                  updateDraft(profile.id, {
                                    gymName: nextValue,
                                  })
                                }
                                placeholder="Select a club"
                                className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                                disabled={
                                  (draft?.gymBrand ?? '')
                                    .trim()
                                    .toLowerCase() !== 'virgin'
                                }
                              />
                            </div>
                          </label>

                          <label className="mt-3 block text-sm font-medium text-slate-700">
                            Account tier
                            <select
                              value={draft?.accountTier ?? 'free'}
                              onChange={(event) =>
                                updateDraft(profile.id, {
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
                              type="datetime-local"
                              value={formatLocalDateTimeInputValue(
                                draft?.accessEndsAt ?? '',
                              )}
                              onChange={(event) =>
                                updateDraft(profile.id, {
                                  accessEndsAt: event.target.value,
                                })
                              }
                              className="mt-1 w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                            />
                          </label>

                          <label className="mt-3 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                            <input
                              type="checkbox"
                              checked={draft?.isFrozen ?? false}
                              onChange={(event) =>
                                updateDraft(profile.id, {
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
                                {formatStoredTimestamp(profile.lastLoggedInAt)}
                              </p>
                              <p>
                                <span className="font-medium text-slate-700">
                                  Previous login:
                                </span>{' '}
                                {formatStoredTimestamp(
                                  profile.previousLastLoggedInAt,
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button
                              tone="blue"
                              onClick={() =>
                                navigate(
                                  `/admin/users/profiles/${profile.id}/activity`,
                                )
                              }
                              className="px-3 py-1.5"
                            >
                              View activity
                            </Button>
                          </div>

                          <label className="mt-3 block text-sm font-medium text-slate-700">
                            Show app version
                            <div className="mt-2 flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  updateDraft(profile.id, { showVersion: true })
                                }
                                className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition ${(draft?.showVersion ?? true) ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
                              >
                                Show
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateDraft(profile.id, {
                                    showVersion: false,
                                  })
                                }
                                className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition ${!(draft?.showVersion ?? true) ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
                              >
                                Hide
                              </button>
                            </div>
                          </label>

                          {(draft?.roles.includes('client') ??
                          profile.roles.includes('client')) ? (
                            <label className="mt-3 block text-sm font-medium text-slate-700">
                              Assigned trainer
                              <select
                                value={
                                  draft?.trainerId ?? profile.trainerId ?? ''
                                }
                                onChange={(event) =>
                                  updateDraft(profile.id, {
                                    trainerId: event.target.value || null,
                                  })
                                }
                                className="mt-1 w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                              >
                                <option value="">No trainer assigned</option>
                                {trainerOptions.map((trainer) => (
                                  <option key={trainer.id} value={trainer.id}>
                                    {trainer.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                          ) : null}
                        </div>

                        <div className="flex flex-col items-start gap-2">
                          <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={
                                draft?.mustChangePassword ??
                                profile.mustChangePassword
                              }
                              onChange={(event) =>
                                updateDraft(profile.id, {
                                  mustChangePassword: event.target.checked,
                                })
                              }
                            />
                            <span>Must change password</span>
                          </label>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              tone="blue"
                              onClick={() => void handleSaveProfile(profile)}
                              className="px-3 py-1.5"
                              disabled={savingProfileId === profile.id}
                            >
                              {savingProfileId === profile.id
                                ? 'Saving…'
                                : 'Save profile'}
                            </Button>
                            <Button
                              tone="rose"
                              onClick={() => {
                                const localUser = userLookup.get(profile.id)
                                if (localUser) {
                                  deleteUser(localUser.id)
                                }
                              }}
                              className="px-3 py-1.5"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AdminSectionShell>
  )
}
