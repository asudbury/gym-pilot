import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { PlanProvider } from '@gym-pilot/shared'
import { PLANS_KEY } from './constants/storageKeys'
import { GoogleAnalytics } from './components/GoogleAnalytics.tsx'
import { AuthProvider } from './auth/AuthContext.tsx'
import { queryClient } from './lib/queryClient'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <GoogleAnalytics />
        <PlanProvider storageKey={PLANS_KEY}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </PlanProvider>
      </HashRouter>
    </QueryClientProvider>
  </StrictMode>,
)
