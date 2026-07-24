import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { PlanProvider } from '@gym-pilot/shared'
import { PLANS_KEY } from './constants/storageKeys'
import { GoogleAnalytics } from './components/GoogleAnalytics.tsx'
import { AuthProvider } from './auth/AuthContext.tsx'
import { getSupabaseClient, logger } from '@gym-pilot/shared'
import ErrorBoundary from './components/ErrorBoundary.tsx'

async function initializeSupabaseAuth() {
  const client = getSupabaseClient()

  if (!client) {
    return
  }

  const { error } = await client.auth.getSession()

  if (error) {
    logger.error('Supabase session initialization failed', error)
  }
}

void initializeSupabaseAuth()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <GoogleAnalytics />
        <PlanProvider storageKey={PLANS_KEY}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </PlanProvider>
      </HashRouter>
    </ErrorBoundary>
  </StrictMode>,
)
