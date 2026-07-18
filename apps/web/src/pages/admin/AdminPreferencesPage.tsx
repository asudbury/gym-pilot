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
  const { user, updateProfileName, updateApplicationName, themePreference, setThemePreference, showVersion, setShowVersion } = useAuth()
  const navigate = useNavigate()
  const [friendlyName, setFriendlyName] = useState(user?.name ?? '')
  const [applicationName, setApplicationName] = useState(user?.applicationName ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    setFriendlyName(user?.name ?? '')
    setApplicationName(user?.applicationName ?? '')
    setNewPassword('')
    setConfirmPassword('')
  }, [user?.name, user?.applicationName])

  const displayRoles = getDisplayRoles(user?.roles, user?.role)
  const isTrainer = displayRoles.includes('trainer')

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

      if (isTrainer) {
        await updateProfileName(friendlyName)
        await updateApplicationName(applicationName)
      }
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

          {isTrainer ? (
            <>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <p>Display name</p>
                <p className="mt-1 text-sm text-slate-400">This name is used for your profile and visible identity in the app.</p>
                <input
                  type="text"
                  value={friendlyName}
                  onChange={(event) => setFriendlyName(event.target.value)}
                  className={`${appTokens.input} w-full`}
                  placeholder="Enter a display name"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <p>Application name</p>
                <p className="mt-1 text-sm text-slate-400">Set the name shown in the header for your trainer branding. Leave it blank to fall back to your display name or the default GymPilot branding.</p>
                <input
                  type="text"
                  value={applicationName}
                  onChange={(event) => setApplicationName(event.target.value)}
                  className={`${appTokens.input} w-full`}
                  placeholder="Enter a custom app name"
                />
              </label>
            </>
          ) : (
            <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p className="font-medium">Trainer-only branding</p>
              <p className="text-sm text-slate-400">This app-name setting is available only for trainer accounts.</p>
            </div>
          )}

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <p>Change password</p>
            <p className="mt-1 text-sm text-slate-400">Enter a new password to update your Supabase account password.</p>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              className={`${appTokens.input} w-full`}
              placeholder="New password"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
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

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <p>Show app version</p>
            <p className="mt-1 text-sm text-slate-400">Toggle whether the version badge is shown in the header.</p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setShowVersion(true)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${showVersion ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
              >
                Show
              </button>
              <button
                type="button"
                onClick={() => setShowVersion(false)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${!showVersion ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
              >
                Hide
              </button>
            </div>
          </label>
          <button
            type="submit"
            disabled={isSaving}
            className={getToneClass('blue', 'w-fit rounded-full px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-400')}
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
