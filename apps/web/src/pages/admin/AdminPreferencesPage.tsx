import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { changeSupabasePassword } from '@gym-pilot/shared'
import { getToneClass } from '../../components/toneClasses'
import { PageCard } from '../../components/PageCard'
import { PageLayout } from '../../layouts/PageLayout'
import { Heading1, Paragraph } from '../../components/Typography'
import { useAuth } from '../../auth/AuthContext'
import { appTokens } from '../../constants/tokens'
import { getDisplayEmail, getDisplayRoles } from '../../utils/adminUtils'

export function AdminPreferencesPage() {
  const { user, updateProfileName, themePreference, setThemePreference } = useAuth()
  const navigate = useNavigate()
  const [friendlyName, setFriendlyName] = useState(user?.name ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    setFriendlyName(user?.name ?? '')
  }, [user?.name])

  const displayRoles = getDisplayRoles(user?.roles, user?.role)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setStatusMessage('')

    try {
      if (newPassword || confirmPassword) {
        if (newPassword.length < 8) {
          setStatusMessage('Password must be at least 8 characters long.')
          return
        }

        if (newPassword !== confirmPassword) {
          setStatusMessage('The new passwords do not match.')
          return
        }

        const passwordResponse = await changeSupabasePassword(newPassword)

        if (passwordResponse.error) {
          throw passwordResponse.error
        }
      }

      await updateProfileName(friendlyName)
      setNewPassword('')
      setConfirmPassword('')
      navigate('/admin')
    } catch (error) {
      console.error('[Preferences] Failed to save preferences', error)
      const message = error instanceof Error ? error.message : 'Could not save the preferences right now.'
      setStatusMessage(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageLayout className="max-w-6xl">
      <PageCard padding="spacious">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Paragraph>Admin</Paragraph>
            <Heading1 className="mt-2">Preferences</Heading1>
          </div>
          <Link to="/admin" className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}>
            Back to admin
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="font-medium">Your roles</p>
            <p className="text-sm text-slate-400">These are the permissions currently assigned to your account.</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {displayRoles.map((role) => (
                <span key={role} className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                  {role}
                </span>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <p>Your email address</p>
            <p className="mt-1 text-sm text-slate-400">This is the email associated with the current account.</p>
            <p className="mt-1 text-lg font-semibold text-slate-700">
              {getDisplayEmail(user?.email)}
            </p>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <p>Your display name</p>
            <p className="mt-1 text-sm text-slate-400">This name is shown in the app header.</p>
            <input
              type="text"
              value={friendlyName}
              onChange={(event) => setFriendlyName(event.target.value)}
              className={`${appTokens.input} w-full`}
              placeholder="Enter a friendly name"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <p>Change password</p>
            <p className="mt-1 text-sm text-slate-400">Enter a new password to update your Supabase account password.</p>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className={`${appTokens.input} w-full`}
              placeholder="New password"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={`${appTokens.input} w-full`}
              placeholder="Confirm new password"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <p>Theme preference</p>
            <p className="mt-1 text-sm text-slate-400">Choose your preferred theme for the app.</p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setThemePreference('light')}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${themePreference === 'light' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => setThemePreference('dark')}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${themePreference === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
              >
                Dark
              </button>
            </div>
          </label>
          <button
            type="submit"
            disabled={isSaving}
            className="w-fit rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSaving ? 'Saving…' : 'Save preferences'}
          </button>
        </form>

        {statusMessage ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 transition-colors dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
            {statusMessage}
          </div>
        ) : null}
      </PageCard>
    </PageLayout>
  )
}
