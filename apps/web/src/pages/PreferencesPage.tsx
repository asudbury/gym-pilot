import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { PageLayout } from '../layouts/PageLayout'
import { PageCardLayout } from '../layouts/PageCardLayout'
import { useAuth } from '../auth/AuthContext'
import { appTokens } from '../constants/tokens'
import { GymClubSelector } from '../components/GymClubSelector'
import { logger } from '@gym-pilot/shared'
import { Button } from '../components/ui/Button'
import { getDisplayRoles } from '../features/admin/domain/adminUtils'
import { UserRolesDisplay } from '../components/UserRolesDisplay'

export function PreferencesPage() {
  const {
    user,
    updateProfileName,
    updateApplicationName,
    updateGymBrand,
    updateGymName,
    themePreference,
    setThemePreference,
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
  const [statusType, setStatusType] = useState<'info' | 'error' | 'success'>(
    'info',
  )

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
      await updateProfileName(friendlyName)
      await updateApplicationName(applicationName)
      await updateGymBrand(gymBrand)
      await updateGymName(gymName, gymBrand)
      navigate('/')
    } catch (error) {
      logger.error('[Preferences] Failed to save preferences', error)
      const message =
        error instanceof Error
          ? error.message
          : 'Could not save the preferences right now.'
      setStatusMessage(message)
      setStatusType('error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageLayout className="max-w-6xl">
      <PageCardLayout
        title="Preferences"
        subtitle="Preferences"
        description="Update your profile and account preferences."
        icon="preferences"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <UserRolesDisplay displayRoles={displayRoles} />

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
            <Button
              as={Link}
              to="/reset-password"
              tone="blue"
              className="w-fit rounded-full px-3 py-1.5 text-sm font-semibold"
            >
              Change password
            </Button>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <p>Theme preference</p>
            <p className="mt-1 text-sm text-slate-400">
              Choose your preferred theme for the app.
            </p>
            <div className="mt-4 flex gap-3">
              <Button
                type="button"
                onClick={() => setThemePreference('light')}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${themePreference === 'light' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
              >
                Light
              </Button>
              <Button
                type="button"
                onClick={() => setThemePreference('dark')}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${themePreference === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
              >
                Dark
              </Button>
            </div>
          </label>

          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              disabled={isSaving}
              tone="emerald"
              isLoading={isSaving}
              loadingLabel="Saving…"
              className="w-fit rounded-full px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              Save preferences
            </Button>
            <Button type="button" tone="default" onClick={() => navigate('/')}>
              Cancel
            </Button>
          </div>
        </form>

        {statusMessage ? (
          <div
            className={`mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition-colors dark:border-slate-700 dark:bg-slate-950 ${statusType === 'error' ? 'text-rose-600' : statusType === 'success' ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-100'}`}
          >
            {statusMessage}
          </div>
        ) : null}
      </PageCardLayout>
    </PageLayout>
  )
}
