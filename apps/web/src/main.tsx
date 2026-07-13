import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { PlanProvider } from '@gym-pilot/shared'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <PlanProvider>
        <App />
      </PlanProvider>
    </HashRouter>
  </StrictMode>,
)
