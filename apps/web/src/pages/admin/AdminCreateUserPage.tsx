import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { getSupabaseClient, signUpWithPassword, usePlan } from '@gym-pilot/shared'
import type { UserRole } from '@gym-pilot/types'
import { AdminSectionShell } from '../../components/admin/AdminSectionShell'

export function AdminCreateUserPage() {
  const navigate = useNavigate()
  const { createUser, users } = usePlan()
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [newUserRoles, setNewUserRoles] = useState<UserRole[]>(['client'])
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>('')
  const [statusMessage, setStatusMessage] = useState('')

  const trainerOptions = useMemo(() => users.filter((user) => user.roles.includes('trainer')), [users])

  const handleCreateUser = async () => {
    const trimmedName = newUserName.trim()

    if (!trimmedName) {
      setStatusMessage('Please enter a valid email address.')
      return
    }

    if ((newUserEmail || tempPassword) && (!newUserEmail || !tempPassword)) {
      setStatusMessage('Provide both an email address and a temporary password to create an auth-enabled user.')
      return
    }

    const createdUser = createUser(trimmedName, newUserRoles, newUserRoles.includes('client') ? selectedTrainerId || null : null)

    if (!createdUser) {
      setStatusMessage('Could not create the user locally.')
      return
    }

    setNewUserName('')
    setNewUserEmail('')
    setTempPassword('')
    setNewUserRoles(['client'])
    setSelectedTrainerId('')
    setStatusMessage('User created successfully.')
    navigate('/admin/users', { replace: true })

    if (newUserEmail && tempPassword) {
      const response = await signUpWithPassword(newUserEmail.trim(), tempPassword, { passwordChangeRequired: true })

      if (response.error) {
        console.error('[AdminCreateUser] Could not create Supabase auth user', response.error)
      } else {
        const client = getSupabaseClient()

        if (client && response.data?.user?.id) {
          const profilePayload = {
            user_id: response.data.user.id,
            friendly_name: trimmedName,
            roles: newUserRoles,
            trainer_id: newUserRoles.includes('client') ? selectedTrainerId || null : null,
            must_change_password: true,
          }

          const { error: profileError } = await client.from('gym_pilot_profiles').upsert(profilePayload, { onConflict: 'user_id' })

          if (profileError && /trainer_id|does not exist|column .* does not exist/i.test(profileError.message)) {
            await client.from('gym_pilot_profiles').upsert({
              user_id: response.data.user.id,
              friendly_name: trimmedName,
              roles: newUserRoles,
              must_change_password: true,
            }, { onConflict: 'user_id' })
          } else if (profileError) {
            console.error('[AdminCreateUser] Could not create Supabase profile row', profileError)
          }
        }
      }
    }
  }

  return (
    <AdminSectionShell
      title="Create user"
      subtitle="Create a new user and assign roles"
      backTo="/admin/users"
      backLabel="Back to user admin"
      className="max-w-3xl"
    >
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <input
            value={newUserEmail}
            onChange={(event) => setNewUserEmail(event.target.value)}
            placeholder="Email address"
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
            placeholder="Display name"
            className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
          />

          <div className="flex flex-wrap gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            {(['admin', 'trainer', 'client'] as UserRole[]).map((role) => {
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

          {statusMessage ? <p className="text-sm text-slate-600">{statusMessage}</p> : null}
        </div>
      </div>
    </AdminSectionShell>
  )
}
