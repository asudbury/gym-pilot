import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { PageCard } from '../components/PageCard'
import { Heading1 } from '../components/Typography'
import { appTokens } from '../constants/tokens'
import { getSupabaseClient, logger, saveSupabaseProfileFlag } from '@gym-pilot/shared'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const accessToken = useMemo(() => searchParams.get('access_token') || '', [searchParams])
  const refreshToken = useMemo(() => searchParams.get('refresh_token') || '', [searchParams])
  const hasResetTokens = Boolean(accessToken && refreshToken)
  const from = useMemo(() => {
    const state = location.state as { from?: { pathname?: string } } | null
    return state?.from?.pathname || '/'
  }, [location.state])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatusMessage('')

    if (password.length < 8) {
      setStatusMessage('Password must be at least 8 characters long.')
      setIsSubmitting(false)
      return
    }

    if (password !== confirmPassword) {
      setStatusMessage('The passwords do not match.')
      setIsSubmitting(false)
      return
    }

    const client = getSupabaseClient()

    if (!client) {
      setStatusMessage('Supabase is not available right now.')
      setIsSubmitting(false)
      return
    }

    let sessionError = null

    if (hasResetTokens) {
      const sessionResponse = await client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      sessionError = sessionResponse.error
    } else {
      const { data: { session }, error } = await client.auth.getSession()
      sessionError = error

      if (!session) {
        sessionError = new Error('No active session found.')
      }
    }

    if (sessionError) {
      logger.error('[ResetPassword] Could not restore Supabase session', sessionError)
      setStatusMessage('The password reset link could not be used. Please request a new one or sign in again.')
      setIsSubmitting(false)
      return
    }

    const { error: updateError } = await client.auth.updateUser({ password })

    setIsSubmitting(false)

    if (updateError) {
      logger.error('[ResetPassword] Password update failed', updateError)
      setStatusMessage(updateError.message || 'Could not update your password.')
      return
    }

    await saveSupabaseProfileFlag('must_change_password', false)

    setStatusMessage('Password updated successfully. You can now continue using the app.')
    window.dispatchEvent(new Event('gym-pilot-auth-updated'))
    navigate(from, { replace: true })
  }

  return (
    <div className={`${appTokens.pageShell} flex items-start justify-center`}>
      <PageCard as="section" className="w-full max-w-xl self-start" padding="spacious">
        <div className="flex flex-col gap-2">
          <Heading1 as="h1">Set a new password</Heading1>
          <p className="text-sm text-slate-600">
            Choose a new password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <span>New password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className={`${appTokens.input} w-full`}
              placeholder="Enter a new password"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <span>Confirm password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              className={`${appTokens.input} w-full`}
              placeholder="Confirm your new password"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? 'Updating password…' : 'Update password'}
          </button>
        </form>

        {statusMessage ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {statusMessage}
          </div>
        ) : null}
      </PageCard>
    </div>
  )
}
