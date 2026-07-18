import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { loadSupabaseProfileFlag, resetSupabasePassword, signInWithPassword } from '@gym-pilot/shared'
import { PageCard } from '../components/PageCard'
import { Heading1 } from '../components/Typography'
import { appTokens } from '../constants/tokens'
import { useAuth } from '../auth/AuthContext'

const REMEMBERED_EMAIL_STORAGE_KEY = 'gym-pilot-remembered-email'
const REMEMBER_EMAIL_PREFERENCE_STORAGE_KEY = 'gym-pilot-remember-email-preference'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [shouldRememberEmail, setShouldRememberEmail] = useState(() => {
    if (typeof window === 'undefined') {
      return true
    }

    const storedPreference = window.localStorage.getItem(REMEMBER_EMAIL_PREFERENCE_STORAGE_KEY)
    return storedPreference === null ? true : storedPreference === 'true'
  })
  const [email, setEmail] = useState(() => {
    if (typeof window === 'undefined') {
      return ''
    }

    return window.localStorage.getItem(REMEMBERED_EMAIL_STORAGE_KEY) ?? ''
  })
  const [password, setPassword] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const emailParam = useMemo(() => {
    const rawValue = searchParams.get('email') || searchParams.get('emailAddress') || ''
    return rawValue.trim()
  }, [searchParams])

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam)
      if (typeof window !== 'undefined') {
        if (shouldRememberEmail) {
          window.localStorage.setItem(REMEMBERED_EMAIL_STORAGE_KEY, emailParam)
        } else {
          window.localStorage.removeItem(REMEMBERED_EMAIL_STORAGE_KEY)
        }
      }
    }
  }, [emailParam, shouldRememberEmail])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(REMEMBER_EMAIL_PREFERENCE_STORAGE_KEY, String(shouldRememberEmail))

    if (!shouldRememberEmail) {
      window.localStorage.removeItem(REMEMBERED_EMAIL_STORAGE_KEY)
      return
    }

    const trimmedEmail = email.trim()

    if (trimmedEmail) {
      window.localStorage.setItem(REMEMBERED_EMAIL_STORAGE_KEY, trimmedEmail)
      return
    }

    window.localStorage.removeItem(REMEMBERED_EMAIL_STORAGE_KEY)
  }, [email, shouldRememberEmail])

  const rememberEmail = (value: string, remember: boolean) => {
    if (typeof window === 'undefined') {
      return
    }

    const trimmedValue = value.trim()

    if (remember && trimmedValue) {
      window.localStorage.setItem(REMEMBERED_EMAIL_STORAGE_KEY, trimmedValue)
      return
    }

    window.localStorage.removeItem(REMEMBERED_EMAIL_STORAGE_KEY)
  }

  const from = useMemo(() => {
    const state = location.state as { from?: { pathname?: string } } | null
    return state?.from?.pathname || '/'
  }, [location.state])

  const appName = user?.applicationName?.trim() || user?.name?.trim() || 'GymPilot'

  const handlePasswordSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setAuthMessage('')

    const response = await signInWithPassword(email, password)

    setIsSubmitting(false)

    if (response.error) {
      console.error('[Login] Password sign-in failed', response.error)
      setAuthMessage(`Sign-in failed: ${response.error.message}`)
      return
    }

    rememberEmail(email, shouldRememberEmail)

    const requiresPasswordChange = await loadSupabaseProfileFlag('must_change_password')

    if (requiresPasswordChange) {
      setAuthMessage('Please set a new password to continue.')
      window.dispatchEvent(new Event('gym-pilot-auth-updated'))
      navigate('/reset-password', { replace: true, state: { from } })
      return
    }

    window.dispatchEvent(new Event('gym-pilot-auth-updated'))
    navigate(from, { replace: true })
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setAuthMessage('Enter your email address to receive a reset link.')
      return
    }

    setIsResetting(true)
    setAuthMessage('')

    const response = await resetSupabasePassword(email.trim())

    setIsResetting(false)

    if (response.error) {
      console.error('[Login] Password reset failed', response.error)
      setAuthMessage(`Could not send the reset email: ${response.error.message}`)
      return
    }

    setAuthMessage('A password reset email has been sent. Check your inbox and follow the link to set a new password.')
  }

  return (
    <div className={`${appTokens.pageShell} flex items-start justify-center`}>
      <PageCard as="section" className="w-full max-w-xl self-start" padding="spacious">
        <div className="flex flex-col gap-2">
          <Heading1 as="h1">Welcome to {appName}</Heading1>
          <p className="text-sm text-slate-600">
            Log in to access your dashboard, exercises, plans, and assignments.
          </p>
        </div>

        <form onSubmit={handlePasswordSignIn} className="mt-8 flex flex-col gap-4" autoComplete="on">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <span>Email address</span>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
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
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              enterKeyHint="done"
              required
              className={`${appTokens.input} w-full`}
              placeholder="Enter your password"
            />
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={shouldRememberEmail}
              onChange={(event) => setShouldRememberEmail(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
            />
            <span>Remember this email on this device</span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
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
        </form>

        {authMessage ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {authMessage}
          </div>
        ) : null}
      </PageCard>
    </div>
  )
}
