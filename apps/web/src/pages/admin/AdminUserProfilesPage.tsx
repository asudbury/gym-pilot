import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { getSupabaseClient, listSupabaseAuthUsers, usePlan } from '@gym-pilot/shared'
import type { UserRole } from '@gym-pilot/types'
import { AdminSectionShell } from '../../components/admin/AdminSectionShell'
import { availableAdminRoles, getDisplayEmail, getDisplayRoles, type AdminProfileRow } from '../../utils/adminUtils'

type ProfileDraft = {
  name: string
  roles: UserRole[]
  trainerId: string | null
  mustChangePassword: boolean
}

export function AdminUserProfilesPage() {
  const { userId } = useParams<{ userId: string }>()
  const { users, deleteUser } = usePlan()
  const [profileRows, setProfileRows] = useState<AdminProfileRow[]>([])
  const [drafts, setDrafts] = useState<Record<string, ProfileDraft>>({})
  const [statusMessage, setStatusMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [savingProfileId, setSavingProfileId] = useState<string | null>(null)

  const refreshProfiles = async () => {
    setIsLoading(true)
    setStatusMessage('')

    const client = getSupabaseClient()

    if (!client) {
      setStatusMessage('Supabase is not configured for this session.')
      setIsLoading(false)
      return
    }

    const { data, error } = await client
      .from('gym_pilot_profiles')
      .select('user_id, friendly_name, roles, trainer_id, must_change_password')

    if (error) {
      console.error('[AdminUserProfiles] Could not load profile rows', error)
      setStatusMessage(`Could not load profile users: ${error.message}`)
      setIsLoading(false)
      return
    }

    const authUsers = await listSupabaseAuthUsers()
    const emailLookup = new Map(authUsers.map((user) => [user.id, user.email ?? null]))

    const nextRows = (data ?? []).map((row) => ({
      id: row.user_id,
      name: typeof row.friendly_name === 'string' && row.friendly_name.trim() ? row.friendly_name.trim() : row.user_id,
      roles: getDisplayRoles(row.roles),
      email: emailLookup.get(row.user_id) ?? null,
      trainerId: typeof row.trainer_id === 'string' ? row.trainer_id : null,
      mustChangePassword: Boolean(row.must_change_password),
    }))

    setProfileRows(nextRows)
    setDrafts((current) => {
      const nextDrafts: Record<string, ProfileDraft> = { ...current }

      nextRows.forEach((row) => {
        nextDrafts[row.id] = {
          name: row.name,
          roles: [...row.roles],
          trainerId: row.trainerId ?? null,
          mustChangePassword: row.mustChangePassword,
        }
      })

      return nextDrafts
    })
    setIsLoading(false)
  }

  useEffect(() => {
    void refreshProfiles()
  }, [])

  const userLookup = useMemo(() => new Map(users.map((user) => [user.id, user])), [users])
  const trainerOptions = useMemo(() => users.filter((user) => user.roles.includes('trainer')), [users])

  const updateDraft = (profileId: string, patch: Partial<ProfileDraft>) => {
    setDrafts((current) => ({
      ...current,
      [profileId]: {
        name: current[profileId]?.name ?? '',
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
        roles: draft.roles,
        trainer_id: draft.trainerId ?? null,
        must_change_password: draft.mustChangePassword,
      }

      const { error } = await client.from('gym_pilot_profiles').upsert(profilePayload, { onConflict: 'user_id' })

      if (error && /trainer_id|does not exist|column .* does not exist/i.test(error.message)) {
        const { error: fallbackError } = await client.from('gym_pilot_profiles').upsert(
          {
            user_id: profile.id,
            friendly_name: trimmedName,
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
    } catch (error) {
      console.error('[AdminUserProfiles] Could not save profile', error)
      setStatusMessage('Could not save the profile changes.')
    } finally {
      setSavingProfileId(null)
    }
  }

  const selectedProfile = profileRows.find((profile) => profile.id === userId) ?? profileRows[0]
  const selectedTitle = selectedProfile ? `User profile: ${selectedProfile.name}` : 'User profile'

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
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-800">Profiles</h3>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
              {isLoading ? 'Loading…' : `${profileRows.length} profiles`}
            </span>
          </div>

          {profileRows.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No profiles available yet.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {profileRows.map((profile) => {
                const draft = drafts[profile.id]

                return (
                  <div key={profile.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-3">
                        <div className="min-w-0 flex-1">
                          <label className="block text-sm font-medium text-slate-700">
                            Email address
                            <p className="mt-1 text-lg font-semibold text-slate-700">
                              {getDisplayEmail(profile.email)}
                            </p>
                          </label>

                          <label className="mt-3 block text-sm font-medium text-slate-700">
                            Display name
                            <input
                              type="text"
                              value={draft?.name ?? profile.name}
                              onChange={(event) => updateDraft(profile.id, { name: event.target.value })}
                              className="mt-1 w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                            />
                          </label>

                          <div className="mt-3 flex flex-wrap gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                            {availableAdminRoles.map((role) => {
                              const checked = draft?.roles.includes(role) ?? profile.roles.includes(role)

                              return (
                                <label key={role} className="flex items-center gap-1 text-sm text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      const nextRoles = draft?.roles ?? profile.roles
                                      const nextRoleSet = nextRoles.includes(role)
                                        ? nextRoles.filter((value) => value !== role)
                                        : [...nextRoles, role]

                                      updateDraft(profile.id, { roles: nextRoleSet })
                                    }}
                                  />
                                  <span className="capitalize">{role}</span>
                                </label>
                              )
                            })}
                          </div>

                          {(draft?.roles.includes('client') ?? profile.roles.includes('client')) ? (
                            <label className="mt-3 block text-sm font-medium text-slate-700">
                              Assigned trainer
                              <select
                                value={draft?.trainerId ?? profile.trainerId ?? ''}
                                onChange={(event) => updateDraft(profile.id, { trainerId: event.target.value || null })}
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
                              checked={draft?.mustChangePassword ?? profile.mustChangePassword}
                              onChange={(event) => updateDraft(profile.id, { mustChangePassword: event.target.checked })}
                            />
                            <span>Must change password</span>
                          </label>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button tone="blue" onClick={() => void handleSaveProfile(profile)} className="px-3 py-1.5" disabled={savingProfileId === profile.id}>
                              {savingProfileId === profile.id ? 'Saving…' : 'Save profile'}
                            </Button>
                            <Button tone="rose" onClick={() => {
                              const localUser = userLookup.get(profile.id)
                              if (localUser) {
                                deleteUser(localUser.id)
                              }
                            }} className="px-3 py-1.5">
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
