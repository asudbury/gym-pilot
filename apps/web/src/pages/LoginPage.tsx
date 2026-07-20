import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import {
  loadSupabaseProfileAccessState,
  loadSupabaseProfileFlag,
  loadSupabaseProfileTermsAcceptance,
  logger,
  resetSupabasePassword,
  signInWithPassword,
  signOutFromSupabase,
} from '@gym-pilot/shared'
import { PageCard } from '../components/PageCard'
import { Heading1 } from '../components/Typography'
import { appTokens } from '../constants/tokens'
import { useAuth } from '../auth/AuthContext'
import {
  persistRememberEmailPreference,
  persistRememberedEmail,
  readStoredRememberedEmail,
} from '../features/auth/domain/loginPreferences'
import { DecorativeIcon } from '../components/ui/DecorativeIcon'
import { Button } from '../components/Button'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  useAuth()
  const [searchParams] = useSearchParams()

  const passwordRef = useRef<HTMLInputElement>(null)

  const [email, setEmail] = useState(() => readStoredRememberedEmail())

  const [authMessage, setAuthMessage] = useState('')
  const [authMessageTone, setAuthMessageTone] = useState<'default' | 'error'>(
    'default',
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const emailParam = useMemo(() => {
    const rawValue =
      searchParams.get('email') || searchParams.get('emailAddress') || ''

    return rawValue.trim()
  }, [searchParams])

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam)
      persistRememberedEmail(emailParam, true)
    }
  }, [emailParam])

  useEffect(() => {
    persistRememberEmailPreference(true)
    persistRememberedEmail(email, true)
  }, [email])

  const from = useMemo(() => {
    const state = location.state as {
      from?: { pathname?: string }
    } | null

    return state?.from?.pathname || '/'
  }, [location.state])

  const handlePasswordSignIn = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setIsSubmitting(true)
    setAuthMessage('')
    setAuthMessageTone('default')

    const password = passwordRef.current?.value ?? ''

    const response = await signInWithPassword(email, password)

    setIsSubmitting(false)

    if (response.error) {
      logger.error('[Login] Password sign-in failed', response.error)

      const message = `Sign-in failed: ${response.error.message}`

      // If Supabase returns an email-not-confirmed error, surface it in red.
      const lower = (response.error.message || '').toLowerCase()
      if (
        lower.includes('confirm') ||
        lower.includes('not confirmed') ||
        lower.includes('email not confirmed')
      ) {
        setAuthMessageTone('error')
      } else {
        setAuthMessageTone('default')
      }

      setAuthMessage(message)

      return
    }

    persistRememberedEmail(email, true)

    const accessState = await loadSupabaseProfileAccessState()

    if (accessState.isBlocked) {
      await signOutFromSupabase()

      setAuthMessageTone('error')
      setAuthMessage('This account is frozen or its access has expired.')

      window.dispatchEvent(new Event('gym-pilot-auth-updated'))

      return
    }

    // If the account requires a password change, force that first so users
    // cannot continue until they've updated their credentials.
    const requiresPasswordChange = await loadSupabaseProfileFlag(
      'must_change_password',
    )

    if (requiresPasswordChange) {
      setAuthMessageTone('default')
      setAuthMessage('Please set a new password to continue.')

      window.dispatchEvent(new Event('gym-pilot-auth-updated'))

      navigate('/reset-password', {
        replace: true,
        state: { from },
      })

      return
    }

    const hasAcceptedTerms = await loadSupabaseProfileTermsAcceptance()

    if (!hasAcceptedTerms) {
      window.dispatchEvent(new Event('gym-pilot-auth-updated'))

      navigate('/welcome', {
        replace: true,
        state: { from },
      })

      return
    }

    window.dispatchEvent(new Event('gym-pilot-auth-updated'))

    navigate(from, { replace: true })
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setAuthMessageTone('default')
      setAuthMessage('Enter your email address to receive a reset link.')

      return
    }

    setIsResetting(true)
    setAuthMessage('')
    setAuthMessageTone('default')

    const response = await resetSupabasePassword(email.trim())

    setIsResetting(false)

    if (response.error) {
      logger.error('[Login] Password reset failed', response.error)

      setAuthMessageTone('error')
      setAuthMessage(
        `Could not send the reset email: ${response.error.message}`,
      )

      return
    }

    setAuthMessageTone('default')
    setAuthMessage(
      'A password reset email has been sent. Check your inbox and follow the link to set a new password.',
    )
  }

  const handleResendConfirmation = async () => {
    if (!email.trim()) {
      setAuthMessageTone('default')
      setAuthMessage(
        'Enter your email address to receive a confirmation or reset link.',
      )
      return
    }

    setIsResetting(true)
    setAuthMessage('')
    setAuthMessageTone('default')

    // As a safe client-side fallback we send a password-reset email which
    // lets the user regain access even if they missed the original confirmation.
    const response = await resetSupabasePassword(email.trim())

    setIsResetting(false)

    if (response.error) {
      logger.error('[Login] Resend confirmation failed', response.error)
      setAuthMessageTone('error')
      setAuthMessage(
        `Could not send a confirmation/reset email: ${response.error.message}`,
      )
      return
    }

    setAuthMessageTone('default')
    setAuthMessage(
      'An email has been sent. Check your inbox for a link to confirm or reset your account.',
    )
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
            <Heading1 as="h1">Welcome to Gym-Pilot</Heading1>
          </div>
        </div>

        <form
          onSubmit={handlePasswordSignIn}
          className="mt-8 flex flex-col gap-4"
          autoComplete="on"
          method="post"
          action="/login"
          data-form-type="login"
        >
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <span>Email address</span>

            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="next"
              required
              className={`${appTokens.input} w-full`}
              placeholder="you@example.com"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <span>Password</span>

            <input
              ref={passwordRef}
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              enterKeyHint="done"
              required
              className={`${appTokens.input} w-full`}
              placeholder="Enter your password"
            />
          </label>

          <Button
            type="submit"
            tone="emerald"
            className="self-start w-full sm:w-auto shadow-sm disabled:cursor-not-allowed disabled:border-emerald-300 disabled:bg-emerald-300 disabled:text-emerald-950"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in…' : 'Login'}
          </Button>

          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={isResetting}
            className="text-left text-sm font-medium text-blue-700 transition hover:text-blue-800 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {isResetting ? 'Sending reset email…' : 'Forgot password?'}
          </button>
          {authMessageTone === 'error' &&
          authMessage.toLowerCase().includes('confirm') ? (
            <Button
              type="button"
              onClick={handleResendConfirmation}
              disabled={isResetting}
              className="w-full sm:w-auto px-3 py-2 text-sm"
            >
              {isResetting ? 'Sending…' : 'Resend confirmation / reset'}
            </Button>
          ) : null}
        </form>

        {authMessage ? (
          <div
            className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
              authMessageTone === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            {authMessage}
          </div>
        ) : null}
      </PageCard>
    </div>
  )
}
