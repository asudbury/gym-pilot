import { Route } from 'react-router-dom'
import { LoginPage } from '../pages/LoginPage'
import { ResetPasswordPage } from '../pages/ResetPasswordPage'
import { WelcomePage } from '../pages/WelcomePage'

export function createAuthRoutes() {
  return (
    <>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/auth/callback" element={<LoginPage />} />
    </>
  )
}
