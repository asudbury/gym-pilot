import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { getToneClass } from '../../components/toneClasses'
import { PageCard } from '../../components/PageCard'
import { PageLayout } from '../../layouts/PageLayout'
import { Heading1, Paragraph } from '../../components/Typography'
import { useAuth } from '../../auth/AuthContext'
import { appTokens } from '../../constants/tokens'
import { getDisplayEmail, getDisplayRoles } from '../../utils/adminUtils'
import { GymClubSelector } from '../../components/GymClubSelector'
import { logger } from '@gym-pilot/shared'

export function AdminPreferencesPage() {
  const {
    user,
    updateProfileName,
    updateApplicationName,
    updateGymBrand,
    updateGymName,
    themePreference,
    setThemePreference,
    showVersion,
    setShowVersion,
  } = useAuth()
  const navigate = useNavigate()
  const [friendlyName, setFriendlyName] = useState(user?.name ?? '')
  const [applicationName, setApplicationName] = useState(
    user?.applicationName ?? '',
  )
  const [gymBrand, setGymBrand] = useState(user?.gymBrand ?? '')
  const [gymName, setGymName] = useState(user?.gymName ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    setFriendlyName(user?.name ?? '')
    setApplicationName(user?.applicationName ?? '')
    setGymBrand(user?.gymBrand ?? '')
    setGymName(user?.gymName ?? '')
  }, [user?.name, user?.applicationName, user?.gymBrand, user?.gymName])

  const displayRoles = getDisplayRoles(user?.roles, user?.role)
  const isTrainer = displayRoles.includes('trainer')
  const isVirginGymBrand = (gymBrand || '').trim().toLowerCase() === 'virgin'

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setStatusMessage('')

    try {
      if (isTrainer) {
        await updateProfileName(friendlyName)
        await updateApplicationName(applicationName)
        await updateGymBrand(gymBrand)
        await updateGymName(gymName, gymBrand)
      }
      navigate('/admin')
    } catch (error) {
      logger.error('[Preferences] Failed to save preferences', error)
      const message =
        error instanceof Error
          ? error.message
          : 'Could not save the preferences right now.'
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
          <Link
            to="/admin"
            className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}
          >
            Back to admin
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="font-medium">Your roles</p>
            <p className="text-sm text-slate-400">
              These are the permissions currently assigned to your account.
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              {displayRoles.map((role) => (
                <span
                  key={role}
                  className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <p>Your email address</p>
            <p className="mt-1 text-sm text-slate-400">
              This is the email associated with the current account.
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-700">
              {getDisplayEmail(user?.email)}
            </p>
          </label>

          {isTrainer ? (
            <>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <p>Display name</p>
                <p className="mt-1 text-sm text-slate-400">
                  This name is used for your profile and visible identity in the
                  app.
                </p>
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
                <p className="mt-1 text-sm text-slate-400">
                  Set the name shown in the header for your trainer branding.
                  Leave it blank to fall back to your display name or the
                  default GymPilot branding.
                </p>
                <input
                  type="text"
                  value={applicationName}
                  onChange={(event) => setApplicationName(event.target.value)}
                  className={`${appTokens.input} w-full`}
                  placeholder="Enter a custom app name"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <p>Gym brand</p>
                <p className="mt-1 text-sm text-slate-400">
                  Select the gym brand from the approved list.
                </p>
                <select
                  value={gymBrand}
                  onChange={(event) => {
                    const nextBrand = event.target.value
                    setGymBrand(nextBrand)

                    if (nextBrand.trim().toLowerCase() !== 'virgin') {
                      setGymName('')
                    }
                  }}
                  className={`${appTokens.input} w-full`}
                >
                  <option value="">Select a brand</option>
                  <option value="Virgin">Virgin</option>
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <p>Gym name</p>
                <p className="mt-1 text-sm text-slate-400">
                  Select the Virgin Active club. The value stored for the
                  profile is the club ID.
                </p>
                <GymClubSelector
                  value={gymName}
                  onChange={setGymName}
                  className={`${appTokens.input} w-full`}
                  placeholder="Select a club"
                  disabled={!isVirginGymBrand}
                />
              </label>
            </>
          ) : (
            <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p className="font-medium">Trainer-only branding</p>
              <p className="text-sm text-slate-400">
                This app-name setting is available only for trainer accounts.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="font-medium">Change password</p>
            <p className="mt-1 text-sm text-slate-400">
              Manage your account password from a dedicated screen.
            </p>
            <Link
              to="/admin/change-password"
              className={getToneClass(
                'default',
                'mt-2 w-fit rounded-full px-4 py-2 text-sm font-medium',
              )}
            >
              Open password screen
            </Link>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <p>Theme preference</p>
            <p className="mt-1 text-sm text-slate-400">
              Choose your preferred theme for the app.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setThemePreference('light')}
                className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition ${themePreference === 'light' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => setThemePreference('dark')}
                className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition ${themePreference === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
              >
                Dark
              </button>
            </div>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <p>Show app version</p>
            <p className="mt-1 text-sm text-slate-400">
              Toggle whether the version badge is shown in the header.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setShowVersion(true)}
                className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition ${showVersion ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
              >
                Show
              </button>
              <button
                type="button"
                onClick={() => setShowVersion(false)}
                className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition ${!showVersion ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
              >
                Hide
              </button>
            </div>
          </label>
          <button
            type="submit"
            disabled={isSaving}
            className={getToneClass(
              'blue',
              'w-fit rounded-full px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-400',
            )}
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
