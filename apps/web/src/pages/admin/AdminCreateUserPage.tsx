import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { getSupabaseClient, logger, signUpWithPassword, usePlan } from '@gym-pilot/shared'
import type { UserRole } from '@gym-pilot/types'
import { AdminSectionShell } from '../../components/admin/AdminSectionShell'
import { Panel } from '../../components/ui/Panel'
import { SectionPanel } from '../../components/ui/SectionPanel'
import { buildCreateUserProfilePayload, getCreateUserRoleOptions } from '../../features/admin/domain/createUser'

type StatusMessageState = {
  text: string
  tone: 'success' | 'error'
}

export function AdminCreateUserPage() {
  const navigate = useNavigate()
  const { createUser, users } = usePlan()
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [newUserRoles, setNewUserRoles] = useState<UserRole[]>(['client'])
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>('')
  const [statusMessage, setStatusMessage] = useState<StatusMessageState | null>(null)

  const trainerOptions = useMemo(() => users.filter((user) => user.roles.includes('trainer')), [users])
  const roleOptions = useMemo(() => getCreateUserRoleOptions(), [])

  const handleCreateUser = async () => {
    const trimmedName = newUserName.trim()
    const resolvedDisplayName = trimmedName || newUserEmail.trim() || 'New user'

    const hasTemporaryPassword = tempPassword.trim().length > 0

    if (hasTemporaryPassword && !tempPassword) {
      setStatusMessage({ text: 'Provide a temporary password to create an auth-enabled user.', tone: 'error' })
      return
    }

    const createdUser = createUser(resolvedDisplayName, newUserRoles, newUserRoles.includes('client') ? selectedTrainerId || null : null)

    if (!createdUser) {
      setStatusMessage({ text: 'Could not create the user locally.', tone: 'error' })
      return
    }

    if (hasTemporaryPassword) {
      const response = await signUpWithPassword(newUserEmail.trim() || resolvedDisplayName, tempPassword, { passwordChangeRequired: true, persistSession: false })

      if (response.error) {
        logger.error('[AdminCreateUser] Could not create Supabase auth user', response.error)
        setTempPassword('')

        const errorMessage = response.error.message?.includes('rate limit')
          ? 'We could not create the account right now because Supabase is temporarily rate-limiting email sign-ups. Please try again in a few minutes.'
          : `Could not create user: ${response.error.message}`

        setStatusMessage({ text: errorMessage, tone: 'error' })
        return
      }

      const client = getSupabaseClient({ persistSession: false, autoRefreshToken: false })

      if (client && response.data?.user?.id) {
        const profilePayload = buildCreateUserProfilePayload({
          userId: response.data.user.id,
          displayName: resolvedDisplayName,
          roles: newUserRoles,
          selectedTrainerId,
        })

        const { error: profileError } = await client.from('gym_pilot_profiles').upsert(profilePayload, { onConflict: 'user_id' })

        if (profileError && /trainer_id|does not exist|column .* does not exist/i.test(profileError.message)) {
          const { error: fallbackError } = await client.from('gym_pilot_profiles').upsert({
            user_id: response.data.user.id,
            friendly_name: resolvedDisplayName,
            roles: newUserRoles,
            must_change_password: true,
          }, { onConflict: 'user_id' })

          if (fallbackError) {
            logger.error('[AdminCreateUser] Could not create Supabase profile row', fallbackError)
            setStatusMessage({ text: `Could not create the profile row: ${fallbackError.message}`, tone: 'error' })
            return
          }
        } else if (profileError) {
          logger.error('[AdminCreateUser] Could not create Supabase profile row', profileError)
          setStatusMessage({ text: `Could not create the profile row: ${profileError.message}`, tone: 'error' })
          return
        }
      }
    }

    setNewUserName('')
    setNewUserEmail('')
    setTempPassword('')
    setNewUserRoles(['client'])
    setSelectedTrainerId('')
    setStatusMessage({ text: 'User created successfully.', tone: 'success' })
    navigate('/admin/users', { replace: true })
  }

  return (
    <AdminSectionShell
      title="Create user"
      subtitle="Create a new user and assign roles"
      backTo="/admin/users"
      backLabel="Back to user admin"
      className="max-w-3xl"
    >
      <SectionPanel>
        <Panel className="space-y-3">
          <input
            value={newUserEmail}
            onChange={(event) => setNewUserEmail(event.target.value)}
            placeholder="Email address or login name"
            className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
          />
          <input
            value={tempPassword}
            onChange={(event) => setTempPassword(event.target.value)}
            placeholder="Temporary password"
            className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
          />
          <input
            type="text"
            value={newUserName}
            onChange={(event) => setNewUserName(event.target.value)}
            placeholder="Display name (optional)"
            className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
          />

          <div className="flex flex-wrap gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            {roleOptions.map((role) => {
              const checked = newUserRoles.includes(role)

              return (
                <label key={role} className="flex items-center gap-1 rounded-full px-2 py-1">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setNewUserRoles((current) => {
                        if (current.includes(role)) {
                          return current.filter((value) => value !== role)
                        }

                        return [...current, role]
                      })
                    }}
                  />
                  <span className="capitalize">{role}</span>
                </label>
              )
            })}
          </div>

          {newUserRoles.includes('client') ? (
            <label className="block text-sm font-medium text-slate-700">
              Assigned trainer
              <select
                value={selectedTrainerId}
                onChange={(event) => setSelectedTrainerId(event.target.value)}
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

          <Button tone="emerald" onClick={() => void handleCreateUser()} className="px-4 py-2">
            Create user
          </Button>

          {statusMessage ? (
            <p className={`text-sm ${statusMessage.tone === 'error' ? 'text-red-600' : 'text-slate-600'}`}>
              {statusMessage.text}
            </p>
          ) : null}
        </Panel>
      </SectionPanel>
    </AdminSectionShell>
  )
}
