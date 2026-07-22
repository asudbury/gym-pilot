import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import {
  getSupabaseClient,
  getSupabaseAdminClient,
  logger,
  saveSupabaseProfile,
  saveSupabaseProfileRoles,
  signUpWithPassword,
  usePlan,
} from '@gym-pilot/shared'
import type { UserRole } from '@gym-pilot/types'
import { AdminSectionShell } from '../../components/admin/AdminSectionShell'
import { Panel } from '../../components/ui/Panel'
import { SectionPanel } from '../../components/ui/SectionPanel'
import { GymClubSelector } from '../../components/GymClubSelector'
import {
  buildCreateUserProfilePayload,
  getCreateUserRoleOptions,
} from '../../features/admin/domain/createUser'
import { NotificationPill } from '../../components/NotificationPill'

type StatusMessageState = {
  text: string
  tone: 'success' | 'error'
}

function isSupabaseAuthCredentialError(message?: string) {
  if (!message) {
    return false
  }

  return /invalid login credentials|jwt|token|session/i.test(message)
}

export function AdminCreateUserPage() {
  const navigate = useNavigate()
  const { createUser, users } = usePlan()
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [newUserRoles, setNewUserRoles] = useState<UserRole[]>(['client'])
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>('')
  const [accountTier, setAccountTier] = useState<string>('free')
  const [accessEndsAt, setAccessEndsAt] = useState<string>('')
  const [isFrozen, setIsFrozen] = useState(false)
  const [mustChangePasswordFlag, setMustChangePasswordFlag] = useState(true)
  const [selectedGymClubId, setSelectedGymClubId] = useState<string>('')
  const [sendInviteLink, setSendInviteLink] = useState(false)
  const [showTempPassword, setShowTempPassword] = useState(false)
  const [statusMessage, setStatusMessage] = useState<StatusMessageState | null>(
    null,
  )

  const trainerOptions = useMemo(
    () => users.filter((user) => user.roles.includes('trainer')),
    [users],
  )
  const roleOptions = useMemo(() => getCreateUserRoleOptions(), [])

  const handleCreateUser = async () => {
    const trimmedName = newUserName.trim()
    const resolvedDisplayName = trimmedName || newUserEmail.trim() || 'New user'

    const hasTemporaryPassword = tempPassword.trim().length > 0

    if (hasTemporaryPassword && !tempPassword) {
      setStatusMessage({
        text: 'Provide a temporary password to create an auth-enabled user.',
        tone: 'error',
      })
      return
    }

    const createdUser = createUser(
      resolvedDisplayName,
      newUserRoles,
      newUserRoles.includes('client') ? selectedTrainerId || null : null,
    )

    if (!createdUser) {
      setStatusMessage({
        text: 'Could not create the user locally.',
        tone: 'error',
      })
      return
    }

    if (hasTemporaryPassword) {
      // Try to create the auth user via the service-role admin client so
      // the new user exists in `auth.users` before we insert the profile
      // row (avoids foreign-key race errors). Fall back to a normal
      // client-side signup when the service role key is not available.
      const serviceAdminClient = getSupabaseAdminClient()
      let response: Awaited<ReturnType<typeof signUpWithPassword>> | null = null
      let createdUserId: string | undefined

      if (serviceAdminClient) {
        const emailCandidate = newUserEmail.trim() || resolvedDisplayName
        const normalizedEmail = emailCandidate.includes('@')
          ? emailCandidate.toLowerCase()
          : `${
              emailCandidate
                .replace(/\s+/g, '.')
                .replace(/[^a-z0-9._-]/gi, '')
                .toLowerCase() || 'user'
            }@gym-pilot.local`

        try {
          const { data, error } =
            await serviceAdminClient.auth.admin.createUser({
              email: normalizedEmail,
              password: tempPassword,
              user_metadata: { password_change_required: true },
            })

          logger.info('[AdminCreateUser] service createUser result', {
            data,
            error,
          })

          if (error) {
            logger.error(
              '[AdminCreateUser] Service-role createUser failed',
              error,
            )
          } else if (data?.user?.id) {
            createdUserId = data.user.id
          }
        } catch (err) {
          logger.warn('[AdminCreateUser] Service-role create user threw', err)
        }
      }

      // If we didn't create via the service role, fall back to the public
      // signup flow which returns a session/user id or an error.
      if (!createdUserId) {
        response = await signUpWithPassword(
          newUserEmail.trim() || resolvedDisplayName,
          tempPassword,
          { passwordChangeRequired: true, persistSession: false },
        )

        if (response.error) {
          logger.error(
            '[AdminCreateUser] Could not create Supabase auth user',
            response.error,
          )
          setTempPassword('')

          const errorMessage = response.error.message?.includes('rate limit')
            ? 'We could not create the account right now because Supabase is temporarily rate-limiting email sign-ups. Please try again in a few minutes.'
            : `Could not create user: ${response.error.message}`

          setStatusMessage({ text: errorMessage, tone: 'error' })
          return
        }
      }

      const noPersistClient = getSupabaseClient({
        persistSession: false,
        autoRefreshToken: false,
      })
      const adminClient = getSupabaseClient()

      // Prefer the service-role client when available so we can both create
      // the auth user and upsert the profile using the same privileged
      // connection (avoids FK races). Otherwise prefer the admin client
      // (current logged-in admin session) then the no-persist client.
      const client = serviceAdminClient ?? adminClient ?? noPersistClient

      if (!client) {
        setStatusMessage({
          text: 'Could not create the profile row: Supabase client is not available.',
          tone: 'error',
        })
        return
      }

      const resolvedNewUserId = createdUserId ?? response?.data?.user?.id

      logger.info('[AdminCreateUser] resolvedNewUserId', {
        resolvedNewUserId,
        createdUserId,
        responseData: response?.data,
      })

      // If we created the user via the service-role client, poll auth.users
      // until the new user record is visible to avoid FK races caused by
      // eventual consistency in the auth system.
      if (serviceAdminClient && createdUserId) {
        let seen = false
        let attempts = 0
        while (!seen && attempts < 10) {
          try {
            const { data: lookupData } = await serviceAdminClient.auth.admin.getUserById(createdUserId)
            if (lookupData?.user) {
              seen = true
              break
            }
          } catch (err) {
            // ignore and retry
          }

          attempts += 1
          // eslint-disable-next-line no-await-in-loop
          await new Promise((res) => setTimeout(res, 200 * attempts))
        }

        if (!seen) {
          logger.warn(
            '[AdminCreateUser] service admin could not verify new user presence after retries',
            { createdUserId },
          )
        }
      }

      if (resolvedNewUserId) {
        // Validate access end date
        if (accessEndsAt) {
          const selectedDate = new Date(accessEndsAt)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          if (selectedDate < today) {
            setStatusMessage({
              text: 'Access end date must not be in the past.',
              tone: 'error',
            })
            return
          }
        }

        // Confirm when creating an admin account
        if (newUserRoles.includes('admin')) {
          const confirmed = window.confirm(
            'You are about to create an admin account. Continue?',
          )
          if (!confirmed) {
            return
          }
        }

        const profilePayload = buildCreateUserProfilePayload({
          displayName: resolvedDisplayName,
          roles: newUserRoles,
          selectedTrainerId,
          accountTier,
          accessEndsAt: accessEndsAt || null,
          isFrozen,
          mustChangePassword: mustChangePasswordFlag,
          gymClubId: selectedGymClubId || null,
          gymBrand: selectedGymClubId ? 'Virgin' : null,
        })

        try {
          await saveSupabaseProfile(profilePayload, resolvedNewUserId)
          await saveSupabaseProfileRoles(
            newUserRoles,
            resolvedNewUserId,
            client,
          )

          // Optionally copy an invite link
          if (sendInviteLink) {
            const email = newUserEmail.trim() || resolvedDisplayName
            if (email) {
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
                window.dispatchEvent(
                  new CustomEvent('gym-pilot-notification', {
                    detail: { text: 'Invite link copied', tone: 'success' },
                  }),
                )
              } catch {
                // ignore
              }
            }
          }
        } catch (profileError) {
          logger.error(
            '[AdminCreateUser] Could not create Supabase profile row',
            profileError,
          )

          const profileErrorMessage = isSupabaseAuthCredentialError(
            (profileError as Error).message,
          )
            ? 'Could not create the profile row: Your admin session has expired. Sign in again and retry.'
            : `Could not create the profile row: ${(profileError as Error).message}`

          setStatusMessage({
            text: profileErrorMessage,
            tone: 'error',
          })
          return
        }
      }
    }

    setNewUserName('')
    setNewUserEmail('')
    setTempPassword('')
    setNewUserRoles(['client'])
    setSelectedTrainerId('')
    setSelectedGymClubId('')
    setAccountTier('free')
    setAccessEndsAt('')
    setIsFrozen(false)
    setMustChangePasswordFlag(true)
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
      icon="user"
    >
      <SectionPanel>
        <Panel className="space-y-3">
          <input
            value={newUserEmail}
            onChange={(event) => setNewUserEmail(event.target.value)}
            placeholder="Email address or login name"
            autoComplete="off"
            name="new-user-email"
            spellCheck={false}
            data-lpignore="true"
            data-form-type="other"
            className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
          />
          <div className="relative">
            <input
              type={showTempPassword ? 'text' : 'password'}
              value={tempPassword}
              onChange={(event) => setTempPassword(event.target.value)}
              placeholder="Temporary password"
              autoComplete="new-password"
              name="temporary-password"
              spellCheck={false}
              data-lpignore="true"
              data-form-type="other"
              className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 pr-20 text-sm text-slate-700"
            />
            <button
              type="button"
              onClick={() => setShowTempPassword((value) => !value)}
              className="absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-slate-600 transition hover:text-slate-900"
            >
              {showTempPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <input
            type="text"
            value={newUserName}
            onChange={(event) => setNewUserName(event.target.value)}
            placeholder="Display name (optional)"
            autoComplete="name"
            name="name"
            className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
          />

          <div className="flex flex-wrap gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            {roleOptions.map((role) => {
              const checked = newUserRoles.includes(role)

              return (
                <label
                  key={role}
                  className="flex items-center gap-1 rounded-full px-2 py-1"
                >
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

          <label className="block text-sm font-medium text-slate-700">
            Account tier
            <select
              value={accountTier}
              onChange={(event) => setAccountTier(event.target.value)}
              className="mt-1 w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="free">Free</option>
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Gym club (optional)
            <GymClubSelector
              value={selectedGymClubId}
              onChange={(next) => setSelectedGymClubId(next)}
              placeholder="Search for club (Virgin only)"
              className="mt-1 w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            />
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={mustChangePasswordFlag}
              onChange={(e) => setMustChangePasswordFlag(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
            />
            <span>Require password change on first sign-in</span>
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={isFrozen}
              onChange={(e) => setIsFrozen(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
            />
            <span>Freeze account</span>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Access ends at (optional)
            <input
              type="date"
              value={accessEndsAt}
              onChange={(e) => setAccessEndsAt(e.target.value)}
              className="mt-1 w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            />
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={sendInviteLink}
              onChange={(e) => setSendInviteLink(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
            />
            <span>Copy invite link to clipboard after creation</span>
          </label>

          <div className="flex flex-col items-start gap-2">
            <Button
              tone="emerald"
              onClick={() => void handleCreateUser()}
              className="px-4 py-2"
            >
              Create user
            </Button>
            {statusMessage ? (
              <NotificationPill
                message={statusMessage}
                className="mt-2"
              />
            ) : null}
          </div>
        </Panel>
      </SectionPanel>
    </AdminSectionShell>
  )
}
