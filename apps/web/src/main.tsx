import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { PlanProvider } from '@gym-pilot/shared'
import { ASSIGNMENTS_STORAGE_KEY } from './constants/storageKeys'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <PlanProvider storageKey={ASSIGNMENTS_STORAGE_KEY}>
        <App />
      </PlanProvider>
    </HashRouter>
  </StrictMode>,
)
