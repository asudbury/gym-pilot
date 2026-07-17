import { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { loadSupabaseProfileFlag, resetSupabasePassword, signInWithPassword } from '@gym-pilot/shared'
import { PageCard } from '../components/PageCard'
import { Heading1 } from '../components/Typography'
import { appTokens } from '../constants/tokens'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const from = useMemo(() => {
    const state = location.state as { from?: { pathname?: string } } | null
    return state?.from?.pathname || '/'
  }, [location.state])

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

    const requiresPasswordChange = await loadSupabaseProfileFlag('must_change_password')

    if (requiresPasswordChange) {
      setAuthMessage('Please set a new password to continue.')
      window.dispatchEvent(new Event('gym-pilot-auth-updated'))
      navigate('/reset-password', { replace: true, state: { from } })
      return
    }

    setAuthMessage('Signed in successfully.')
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
          <Heading1 as="h1">Welcome back</Heading1>
          <p className="text-sm text-slate-600">
            Login to continue to your plans, assignments, and preferences.
          </p>
        </div>

        <form onSubmit={handlePasswordSignIn} className="mt-8 flex flex-col gap-4">
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
              spellCheck={false}
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
              required
              className={`${appTokens.input} w-full`}
              placeholder="Enter your password"
            />
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
