import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { changeSupabasePassword, logger } from '@gym-pilot/shared'
import { getToneClass } from '../../components/toneClasses'
import { PageCard } from '../../components/PageCard'
import { PageLayout } from '../../layouts/PageLayout'
import { Heading1, Paragraph } from '../../components/Typography'
import { DecorativeIcon } from '../../components/ui/DecorativeIcon'
import { appTokens } from '../../constants/tokens'

export function AdminChangePasswordPage() {
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setStatusMessage('')

    try {
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

      setNewPassword('')
      setConfirmPassword('')
      setStatusMessage('Password updated successfully.')
      navigate('/admin/preferences')
    } catch (error) {
      logger.error('[ChangePassword] Failed to update password', error)
      const message =
        error instanceof Error
          ? error.message
          : 'Could not update the password right now.'
      setStatusMessage(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageLayout className="max-w-3xl">
      <PageCard padding="spacious">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <DecorativeIcon icon="key" />
            <div>
              <Paragraph>Account</Paragraph>
              <Heading1 className="mt-2">Change password</Heading1>
            </div>
          </div>
          <Link
            to="/admin/preferences"
            className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}
          >
            Back to preferences
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="font-medium">Update your account password</p>
            <p className="mt-1 text-sm text-slate-400">
              Use this screen to change the password for the currently signed-in
              account.
            </p>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <p>New password</p>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              className={`${appTokens.input} w-full`}
              placeholder="Enter a new password"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <p>Confirm password</p>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              className={`${appTokens.input} w-full`}
              placeholder="Confirm your new password"
            />
          </label>

          <button
            type="submit"
            disabled={isSaving}
            className={getToneClass(
              'blue',
              'w-fit rounded-full px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-400',
            )}
          >
            {isSaving ? 'Updating…' : 'Update password'}
          </button>
        </form>

        {statusMessage ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {statusMessage}
          </div>
        ) : null}
      </PageCard>
    </PageLayout>
  )
}
