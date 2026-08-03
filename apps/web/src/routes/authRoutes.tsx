import { Route } from 'react-router-dom'
import { LoginPage } from '../pages/LoginPage'
import { ResetPasswordPage } from '../pages/ResetPasswordPage'
import { WelcomePage } from '../pages/help/WelcomePage'
import { PreferencesPage } from '../pages/PreferencesPage'
import { RequireAuth } from '../auth/RequireAuth'
import { AdminChangePasswordPage } from '../pages/admin/AdminChangePasswordPage'

export function createAuthRoutes() {
  return (
    <>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/preferences" element={<PreferencesPage />} />
      <Route path="/welcome" element={<WelcomePage />} />
      <Route element={<RequireAuth />}>
        <Route path="/change-password" element={<AdminChangePasswordPage />} />
      </Route>
      <Route path="/auth/callback" element={<LoginPage />} />
    </>
  )
}
