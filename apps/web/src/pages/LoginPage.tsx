import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import {
  loadAppSetting,
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
import { recordWelcomeJourneyActivity } from '../features/auth/domain/welcomeJourneyLogging'
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
  const [showPassword, setShowPassword] = useState(false)
  const [capsLockOn, setCapsLockOn] = useState(false)

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.getModifierState?.('CapsLock')) {
        setCapsLockOn(true)
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      setCapsLockOn(Boolean(event.getModifierState?.('CapsLock')))
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

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

    const loginEnabled = Boolean(await loadAppSetting('login_enabled', true))

    if (!loginEnabled) {
      void recordWelcomeJourneyActivity(
        'welcome_journey_error',
        {
          step: 'login',
          outcome: 'login_disabled',
          returnTo: from,
        },
        null,
        email.trim() || null,
      )

      setIsSubmitting(false)
      setAuthMessageTone('error')
      setAuthMessage('Login is currently disabled by an administrator.')
      return
    }

    const response = await signInWithPassword(email, password)

    if (!response.error) {
      void recordWelcomeJourneyActivity(
        'welcome_journey_login_attempted',
        {
          step: 'login',
          outcome: 'success',
          returnTo: from,
        },
        response.data?.user?.id ?? null,
        response.data?.user?.email ?? null,
      )
    }

    setIsSubmitting(false)

    if (response.error) {
      logger.error('[Login] Password sign-in failed', response.error)

      void recordWelcomeJourneyActivity(
        'welcome_journey_login_attempted',
        {
          step: 'login',
          outcome: 'failed',
          returnTo: from,
          error: response.error.message,
        },
        null,
        email.trim() || null,
      )

      const message = `Sign-in failed: ${response.error.message}`

      // Always surface sign-in errors in the error tone (red).
      setAuthMessageTone('error')
      setAuthMessage(message)

      return
    }

    persistRememberedEmail(email, true)

    const postLoginMessage = String(
      await loadAppSetting('post_login_message', ''),
    )

    if (postLoginMessage) {
      setAuthMessageTone('default')
      setAuthMessage(postLoginMessage)
    }

    const accessState = await loadSupabaseProfileAccessState()

    if (accessState.isBlocked) {
      void recordWelcomeJourneyActivity(
        'welcome_journey_error',
        {
          step: 'login',
          outcome: 'access_blocked',
          returnTo: from,
        },
        response.data?.user?.id ?? null,
        response.data?.user?.email ?? null,
      )

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
      void recordWelcomeJourneyActivity(
        'welcome_journey_redirected',
        {
          step: 'login',
          outcome: 'password_reset_required',
          returnTo: from,
          reason: 'must_change_password',
        },
        response.data?.user?.id ?? null,
        response.data?.user?.email ?? null,
      )

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
      void recordWelcomeJourneyActivity(
        'welcome_journey_redirected',
        {
          step: 'login',
          outcome: 'terms_required',
          returnTo: from,
          reason: 'terms_not_accepted',
        },
        response.data?.user?.id ?? null,
        response.data?.user?.email ?? null,
      )

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
      void recordWelcomeJourneyActivity(
        'welcome_journey_error',
        {
          step: 'login',
          outcome: 'reset_email_failed',
          returnTo: from,
        },
        null,
        email.trim() || null,
      )

      setAuthMessageTone('error')
      setAuthMessage(
        `Could not send the reset email: ${response.error.message}`,
      )

      return
    }

    void recordWelcomeJourneyActivity(
      'welcome_journey_password_reset',
      {
        step: 'login',
        outcome: 'reset_email_requested',
        returnTo: from,
      },
      null,
      email.trim() || null,
    )

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
      void recordWelcomeJourneyActivity(
        'welcome_journey_error',
        {
          step: 'login',
          outcome: 'confirmation_email_failed',
          returnTo: from,
        },
        null,
        email.trim() || null,
      )
      setAuthMessageTone('error')
      setAuthMessage(
        `Could not send a confirmation/reset email: ${response.error.message}`,
      )
      return
    }

    void recordWelcomeJourneyActivity(
      'welcome_journey_password_reset',
      {
        step: 'login',
        outcome: 'confirmation_email_requested',
        returnTo: from,
      },
      null,
      email.trim() || null,
    )

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

            <div className="relative">
              <input
                ref={passwordRef}
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                enterKeyHint="done"
                required
                className={`${appTokens.input} w-full pr-24`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-slate-600 transition hover:text-slate-900"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {capsLockOn ? (
              <span className="text-xs font-medium text-amber-700">
                Caps Lock is on
              </span>
            ) : null}
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
