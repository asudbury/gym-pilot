import { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { usePlan } from '@gym-pilot/shared'
import { AUTH_PROTECTION_ENABLED } from '../auth/config'

export function LoginPage() {
  const { users } = usePlan()
  const { login, enableBypass, isBypassEnabled } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedUserId, setSelectedUserId] = useState('')

  const from = useMemo(() => {
    const state = location.state as { from?: { pathname?: string } } | null
    return state?.from?.pathname || '/'
  }, [location.state])

  const handleLogin = () => {
    if (!selectedUserId) {
      return
    }

    const success = login(selectedUserId)

    if (success) {
      navigate(from, { replace: true })
    }
  }

  const handleBypass = () => {
    enableBypass()
    navigate(from, { replace: true })
  }

  return (
    <div style={{ maxWidth: 420, margin: '3rem auto', padding: '1.5rem' }}>
      <h1>Sign in</h1>
      <p>
        {AUTH_PROTECTION_ENABLED
          ? 'Select a user to continue, or use the MVP bypass while auth is being wired up.'
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
    </div>
  )
}
