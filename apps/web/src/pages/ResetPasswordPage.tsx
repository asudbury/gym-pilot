import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { PageCard } from '../components/PageCard'
import { Heading1 } from '../components/Typography'
import { appTokens } from '../constants/tokens'
import { Button } from '../components/Button'
import { DecorativeIcon } from '../components/ui/DecorativeIcon'
import {
  getSupabaseClient,
  logger,
  saveSupabaseProfileFlag,
  loadSupabaseProfileTermsAcceptance,
} from '@gym-pilot/shared'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordRules, setPasswordRules] = useState({
    length: false,
    lower: false,
    upper: false,
    number: false,
    special: false,
  })
  const [statusMessage, setStatusMessage] = useState('')
  const [statusTone, setStatusTone] = useState<'default' | 'error'>('default')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const accessToken = useMemo(
    () => searchParams.get('access_token') || '',
    [searchParams],
  )
  const refreshToken = useMemo(
    () => searchParams.get('refresh_token') || '',
    [searchParams],
  )
  const hasResetTokens = Boolean(accessToken && refreshToken)
  const from = useMemo(() => {
    const state = location.state as { from?: { pathname?: string } } | null
    return state?.from?.pathname || '/'
  }, [location.state])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatusMessage('')
    setStatusTone('default')

    if (password.length < 8) {
      setStatusMessage('Password must be at least 8 characters long.')
      setStatusTone('error')
      setIsSubmitting(false)
      setPassword('')
      setConfirmPassword('')
      return
    }

    // Ensure password meets rules before submitting
    if (!Object.values(passwordRules).every(Boolean)) {
      setStatusMessage('Your password does not meet the required criteria.')
      setStatusTone('error')
      setIsSubmitting(false)
      setConfirmPassword('')
      return
    }

    if (password !== confirmPassword) {
      setStatusMessage('The passwords do not match.')
      setStatusTone('error')
      setIsSubmitting(false)
      setPassword('')
      setConfirmPassword('')
      return
    }

    const client = getSupabaseClient()

    if (!client) {
      setStatusMessage('Supabase is not available right now.')
      setStatusTone('error')
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
      const {
        data: { session },
        error,
      } = await client.auth.getSession()
      sessionError = error

      if (!session) {
        sessionError = new Error('No active session found.')
      }
    }

    if (sessionError) {
      logger.error(
        '[ResetPassword] Could not restore Supabase session',
        sessionError,
      )
      setStatusMessage(
        'The password reset link could not be used. Please request a new one or sign in again.',
      )
      setStatusTone('error')
      setIsSubmitting(false)
      setPassword('')
      setConfirmPassword('')
      return
    }

    const { error: updateError } = await client.auth.updateUser({ password })

    setIsSubmitting(false)

    if (updateError) {
      logger.error('[ResetPassword] Password update failed', updateError)
      setStatusMessage(updateError.message || 'Could not update your password.')
      setStatusTone('error')
      setPassword('')
      setConfirmPassword('')
      return
    }

    await saveSupabaseProfileFlag('must_change_password', false)

    // After password reset, ensure the user has accepted terms. If not,
    // send them to the welcome/terms acceptance page first.
    const hasAcceptedTerms = await loadSupabaseProfileTermsAcceptance()

    setStatusMessage('Password updated successfully.')
    setStatusTone('default')
    window.dispatchEvent(new Event('gym-pilot-auth-updated'))

    if (!hasAcceptedTerms) {
      navigate('/welcome', { replace: true, state: { from } })
    } else {
      navigate(from, { replace: true })
    }
  }

  return (
    <div className={`${appTokens.pageShell} flex items-start justify-center`}>
      <PageCard
        as="section"
        className="w-full max-w-xl self-start"
        padding="spacious"
      >
        <div className="flex items-start gap-3">
          <DecorativeIcon icon="lock" />
          <div className="flex flex-col gap-2">
            <Heading1 as="h1">Set a new password</Heading1>
            <p className="text-sm text-slate-600">
              Choose a new password for your account.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <span>New password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => {
                const v = event.target.value
                setPassword(v)

                // Clear any existing status message when the user starts typing
                if (statusMessage) {
                  setStatusMessage('')
                  setStatusTone('default')
                }

                setPasswordRules({
                  length: v.length >= 8,
                  lower: /[a-z]/.test(v),
                  upper: /[A-Z]/.test(v),
                  number: /[0-9]/.test(v),
                  special: /[^A-Za-z0-9]/.test(v),
                })
              }}
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
              onChange={(event) => {
                setConfirmPassword(event.target.value)

                // Clear any existing status message when the user starts typing
                if (statusMessage) {
                  setStatusMessage('')
                  setStatusTone('default')
                }
              }}
              required
              className={`${appTokens.input} w-full`}
              placeholder="Confirm your new password"
            />
          </label>

          <div className="mt-2 text-sm text-slate-600">
            <p className="mb-2">Password must contain:</p>
            <ul className="flex flex-col gap-1">
              <li className="flex items-center gap-2">
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
                    passwordRules.length
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                  aria-hidden
                >
                  {passwordRules.length ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  )}
                </span>
                <span>At least 8 characters</span>
              </li>

              <li className="flex items-center gap-2">
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
                    passwordRules.lower
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                  aria-hidden
                >
                  {passwordRules.lower ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  )}
                </span>
                <span>Lowercase letter</span>
              </li>

              <li className="flex items-center gap-2">
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
                    passwordRules.upper
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                  aria-hidden
                >
                  {passwordRules.upper ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  )}
                </span>
                <span>Uppercase letter</span>
              </li>

              <li className="flex items-center gap-2">
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
                    passwordRules.number
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                  aria-hidden
                >
                  {passwordRules.number ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  )}
                </span>
                <span>A number</span>
              </li>

              <li className="flex items-center gap-2">
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
                    passwordRules.special
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                  aria-hidden
                >
                  {passwordRules.special ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  )}
                </span>
                <span>Special character (e.g. !@#$%)</span>
              </li>
            </ul>
          </div>

          <Button
            type="submit"
            tone="emerald"
            disabled={isSubmitting}
            className="self-start w-full sm:w-auto text-sm font-semibold shadow-sm"
          >
            {isSubmitting ? 'Updating password…' : 'Update password'}
          </Button>
        </form>

        {statusMessage ? (
          <div
            className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
              statusTone === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            {statusMessage}
          </div>
        ) : null}
      </PageCard>
    </div>
  )
}
