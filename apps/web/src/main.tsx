import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { PlanProvider } from '@gym-pilot/shared'
import { PLANS_STORAGE_KEY } from './constants/storageKeys'
import { GoogleAnalytics } from './components/GoogleAnalytics.tsx'
import { AuthProvider } from './auth/AuthContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <GoogleAnalytics />
      <PlanProvider storageKey={PLANS_STORAGE_KEY}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </PlanProvider>
    </HashRouter>
  </StrictMode>,
)
