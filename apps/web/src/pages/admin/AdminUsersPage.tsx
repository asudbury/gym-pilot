import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { getSupabaseClient, listSupabaseAuthUsers, logger } from '@gym-pilot/shared'
import { AdminSectionShell } from '../../components/admin/AdminSectionShell'
import { Panel } from '../../components/ui/Panel'
import { SectionPanel } from '../../components/ui/SectionPanel'
import { mapAdminProfileRows, type AdminProfileRow } from '../../utils/adminUtils'

export function AdminUsersPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isLoadingSupabaseUsers, setIsLoadingSupabaseUsers] = useState(false)
  const [supabaseUsersNotice, setSupabaseUsersNotice] = useState(
    typeof (location.state as { statusMessage?: string } | undefined)?.statusMessage === 'string'
      ? (location.state as { statusMessage?: string }).statusMessage
      : '',
  )
  const [profileUsers, setProfileUsers] = useState<AdminProfileRow[]>([])
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null)

  const refreshSupabaseUsers = async () => {
    setIsLoadingSupabaseUsers(true)
    setSupabaseUsersNotice('')

    const client = getSupabaseClient()

    if (!client) {
      setSupabaseUsersNotice('Supabase is not configured for this session.')
      setIsLoadingSupabaseUsers(false)
      return
    }

    const { data, error } = await client
      .from('gym_pilot_profile')
      .select('user_id, friendly_name, roles, trainer_id, must_change_password')

    const profileSelectionError = error && /trainer_id|does not exist|column .* does not exist/i.test(error.message)
      ? null
      : error

    if (profileSelectionError) {
      logger.error('[AdminUsers] Could not load profile rows', profileSelectionError)
      setSupabaseUsersNotice(`Could not load profile users: ${profileSelectionError.message}`)
      setIsLoadingSupabaseUsers(false)
      return
    }

    const fallbackSelection = profileSelectionError === null && error
      ? await client.from('gym_pilot_profile').select('user_id, friendly_name, roles, must_change_password')
      : null

    const resolvedData = fallbackSelection?.data ?? data
    const resolvedError = fallbackSelection?.error ?? null

    if (resolvedError) {
      logger.error('[AdminUsers] Could not load profile rows', resolvedError)
      setSupabaseUsersNotice(`Could not load profile users: ${resolvedError.message}`)
      setIsLoadingSupabaseUsers(false)
      return
    }

    const authUsers = await listSupabaseAuthUsers()
    const emailLookup = new Map(authUsers.map((user) => [user.id, user.email ?? null]))

    const nextRows = mapAdminProfileRows(resolvedData ?? [], emailLookup)

    setProfileUsers(nextRows)
    setIsLoadingSupabaseUsers(false)
  }

  useEffect(() => {
    let isActive = true

    void (async () => {
      await refreshSupabaseUsers()

      if (!isActive) {
        return
      }
    })()

    return () => {
      isActive = false
    }
  }, [])

  const handleCopyInviteLink = async (user: AdminProfileRow) => {
    const email = user.email?.trim()

    if (!email) {
      setSupabaseUsersNotice('This user does not have an email address to generate an invite link for.')
      return
    }

    const basePath = import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL
    const inviteUrl = new URL(`${window.location.origin}${basePath}#${encodeURIComponent('/login')}`)
    inviteUrl.hash = `#/login?email=${encodeURIComponent(email)}`

    try {
      await navigator.clipboard.writeText(inviteUrl.toString())
      setCopiedUserId(user.id)
      window.setTimeout(() => setCopiedUserId((current) => (current === user.id ? null : current)), 1500)
    } catch {
      setSupabaseUsersNotice('Could not copy the invite link. Please try again.')
    }
  }

  return (
    <AdminSectionShell title="Manage users" subtitle="Review current users and set up profiles" className="max-w-5xl">
      <SectionPanel>
        <div className="flex flex-wrap gap-2">
          <Button tone="emerald" onClick={() => navigate('/admin/users/create')} className="px-4 py-2">
            Create user
          </Button>
        </div>

        <Panel padding="md">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-800">Current users</h3>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
              {isLoadingSupabaseUsers ? 'Loading…' : `${profileUsers.length} users`}
            </span>
          </div>

          {supabaseUsersNotice ? (
            <p className="mt-3 text-sm text-slate-600">{supabaseUsersNotice}</p>
          ) : null}

          {profileUsers.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No users yet. Add someone to get started.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {profileUsers.map((user) => (
                <div key={user.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{user.email || 'No email available'}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{user.roles.length > 0 ? user.roles.join(', ') : 'No roles'}</p>
                    {user.roles.includes('client') ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Trainer: {user.trainerId ? profileUsers.find((candidate) => candidate.id === user.trainerId)?.name ?? 'Assigned trainer' : 'No trainer assigned'}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button tone="emerald" onClick={() => void handleCopyInviteLink(user)} className="px-3 py-1.5">
                      {copiedUserId === user.id ? 'Invite link copied' : 'Copy invite link'}
                    </Button>
                    <Button tone="blue" onClick={() => navigate(`/admin/users/profiles/${user.id}`)} className="px-3 py-1.5">
                      View profile
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </SectionPanel>
    </AdminSectionShell>
  )
}
