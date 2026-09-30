import { lazy } from 'react'
import { Route } from 'react-router-dom'
import { RequireAuth } from '../auth/RequireAuth'

const LoginPage = lazy(async () => ({
  default: (await import('../pages/LoginPage')).LoginPage,
}))
const ResetPasswordPage = lazy(async () => ({
  default: (await import('../pages/ResetPasswordPage')).ResetPasswordPage,
}))
const WelcomePage = lazy(async () => ({
  default: (await import('../pages/help/WelcomePage')).WelcomePage,
}))
const PreferencesPage = lazy(async () => ({
  default: (await import('../pages/PreferencesPage')).PreferencesPage,
}))
const AdminChangePasswordPage = lazy(async () => ({
  default: (await import('../pages/admin/AdminChangePasswordPage'))
    .AdminChangePasswordPage,
}))

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
