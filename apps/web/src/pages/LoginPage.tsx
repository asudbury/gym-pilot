import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import {
  loadAppSetting, // Still used for 'login_enabled' check
  logger,
  resetSupabasePassword,
  signInWithPassword,
  getSupabaseClient,
} from '@gym-pilot/shared'
import { handlePostSignInLogic } from '../features/auth/domain/postSignInLogic'
import { PageCard } from '../components/PageCard'
import { Heading1 } from '../components/Typography'
import { appTokens } from '../constants/tokens'
import { useAuth } from '../auth/AuthContext'
import {
  persistRememberEmailPreference,
  persistRememberedEmail,
  readStoredRememberedEmail,
} from '../features/auth/domain/loginPreferences' // All functions from here are used
import { recordWelcomeJourneyActivity } from '../features/auth/domain/welcomeJourneyLogging'
import { DecorativeIcon } from '../components/ui/DecorativeIcon'
import { Button } from '../components/ui/Button'
import { getToneClass } from '../components/toneClasses'

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
  const [useEdgeFunctionLogin, setUseEdgeFunctionLogin] = useState(true) // Default to Edge Function

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

  const handleEdgeFunctionSignIn = async (
    email: string,
    password_val: string,
  ) => {
    console.log('[Login] Attempting Edge Function sign-in...')
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL // Assuming SUPABASE_URL is available from env

    if (!SUPABASE_URL) {
      console.error(
        'VITE_SUPABASE_URL is not defined in environment variables.',
      )
      setAuthMessageTone('error')
      setAuthMessage('Supabase URL is not configured.')
      return { error: { message: 'Supabase URL not configured' } }
    }

    const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/login`

    try {
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password: password_val }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Edge Function login failed')
      }

      if (data.session && data.user) {
        const client = getSupabaseClient()
        if (client) {
          // Manually set the session after successful Edge Function login
          await client.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          })
        } else {
          console.error(
            'Supabase client is not available after Edge Function login.',
          )
          return {
            error: { message: 'Supabase client not available to set session.' },
          }
        }
      } else {
        console.error(
          'Edge Function did not return session or user data:',
          data,
        )
        return { error: { message: 'Invalid response from Edge Function.' } }
      }

      console.log('[Login] Edge Function sign-in successful, response:', data)

      return { data: { user: data.user, session: data.session }, error: null }
    } catch (err: any) {
      console.error('[Login] Edge Function sign-in failed:', err.message)
      return { error: { message: err.message } }
    }
  }

  const handlePasswordSignIn = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    console.log('[Login] Attempting password sign-in...')

    setIsSubmitting(true)
    setAuthMessage('')
    setAuthMessageTone('default')

    const password_val = passwordRef.current?.value ?? ''

    const loginEnabled = Boolean(await loadAppSetting('login_enabled', true))
    console.log(`[Login] 'login_enabled' setting is: ${loginEnabled}`)

    if (!loginEnabled) {
      setIsSubmitting(false)
      setAuthMessageTone('error')
      setAuthMessage('Login is currently disabled by an administrator.')
      return
    }

    let response: { data?: any; error: any | null }

    if (useEdgeFunctionLogin) {
      response = await handleEdgeFunctionSignIn(email, password_val)
    } else {
      response = await signInWithPassword(email, password_val)
    }
    console.log('[Login] signInWithPassword response:', response)

    setIsSubmitting(false)

    if (response.error) {
      logger.error('[Login] Password sign-in failed', response.error)

      const message = `Sign-in failed: ${response.error.message}`

      // Always surface sign-in errors in the error tone (red).
      setAuthMessageTone('error')
      setAuthMessage(message)

      return
    }

    await handlePostSignInLogic({
      user: response.data?.user,
      email,
      from,
      navigate,
      setAuthMessage,
      setAuthMessageTone,
      context: 'Login',
    })
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

          {window.location.hostname === 'localhost' ? (
            <div className="flex items-center gap-2">
              <input
                id="useEdgeFunctionLogin"
                type="checkbox"
                checked={!useEdgeFunctionLogin} // Checkbox is checked when NOT using Edge Function (i.e., using traditional)
                onChange={(e) => setUseEdgeFunctionLogin(!e.target.checked)} // Invert state based on checkbox
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label
                htmlFor="useEdgeFunctionLogin"
                className="text-sm font-medium text-slate-700"
              >
                Use supabase password login
              </label>
            </div>
          ) : null}

          <button
            type="submit"
            className={getToneClass(
              'emerald',
              'w-full sm:w-auto px-3 py-2 text-sm',
            )}

            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in…' : 'Login'}
          </button>

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
