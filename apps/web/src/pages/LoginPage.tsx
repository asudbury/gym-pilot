import { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { signInWithGoogle, usePlan } from '@gym-pilot/shared'
import { AUTH_PROTECTION_ENABLED } from '../auth/config'

export function LoginPage() {
  const { users } = usePlan()
  const { login, enableBypass, isBypassEnabled } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedUserId, setSelectedUserId] = useState('')
  const [authMessage, setAuthMessage] = useState('')

  const from = useMemo(() => {
    const state = location.state as { from?: { pathname?: string } } | null
    return state?.from?.pathname || '/'
  }, [location.state])

  const handleLogin = () => {
    console.log('[Login] Continuing with selected user', { selectedUserId, from })

    if (!selectedUserId) {
      return
    }

    const success = login(selectedUserId)

    if (success) {
      navigate(from, { replace: true })
    }
  }

  const handleBypass = () => {
    console.log('[Login] Enabling MVP bypass')
    enableBypass()
    navigate(from, { replace: true })
  }

  const handleSupabaseSignIn = async () => {
    console.log('[Login] Starting Supabase Google sign-in')
    setAuthMessage('')

    const response = await signInWithGoogle()

    if (response.error) {
      console.error('[Login] Google sign-in failed', response.error)
      setAuthMessage(`Google sign-in failed: ${response.error.message}`)
      return
    }

    if (response.data?.url) {
      console.log('[Login] Redirecting to Google OAuth', { url: response.data.url })
      setAuthMessage('Redirecting to Google for sign-in...')
      window.location.assign(response.data.url)
      return
    }

    setAuthMessage('Google sign-in did not return a redirect URL.')
  }

  return (
    <div style={{ maxWidth: 420, margin: '3rem auto', padding: '1.5rem', background: 'white', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
      <h1>Sign in</h1>
      <p>
        {AUTH_PROTECTION_ENABLED
          ? 'Select a user to continue, or sign in with Supabase below.'
          : 'Authentication protection is currently disabled for MVP mode.'}
      </p>

      <label htmlFor="user-select" style={{ display: 'block', marginBottom: '0.5rem' }}>
        User
      </label>
      <select
        id="user-select"
        value={selectedUserId}
        onChange={(event) => setSelectedUserId(event.target.value)}
        style={{ width: '100%', padding: '0.7rem', marginBottom: '1rem' }}
      >
        <option value="">Choose a user</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.role})
          </option>
        ))}
      </select>

      <button type="button" onClick={handleLogin} disabled={!selectedUserId} style={{ marginRight: '0.75rem' }}>
        Continue
      </button>
      <button type="button" onClick={handleBypass}>
        {isBypassEnabled ? 'Bypass already enabled' : 'Use MVP bypass'}
      </button>

      <hr style={{ margin: '1.5rem 0' }} />

      <h2 style={{ marginBottom: '0.75rem' }}>Supabase sign in</h2>
      <p style={{ marginBottom: '1rem' }}>
        Use Google to create a real Supabase session for persistence.
      </p>

      <button type="button" onClick={handleSupabaseSignIn} style={{ marginRight: '0.75rem' }}>
        Continue with Google
      </button>

      {authMessage ? <p style={{ marginTop: '0.75rem' }}>{authMessage}</p> : null}
    </div>
  )
}
