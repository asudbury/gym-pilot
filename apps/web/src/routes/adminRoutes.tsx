import { Route } from 'react-router-dom'
import { RequireAuth } from '../auth/RequireAuth'
import { AdminPage } from '../pages/admin/AdminPage'
import { AdminUsersPage } from '../pages/admin/AdminUsersPage'
import { AdminCreateUserPage } from '../pages/admin/AdminCreateUserPage'
import { AdminUserProfilesPage } from '../pages/admin/AdminUserProfilesPage'
import { AdminUserActivityPage } from '../pages/admin/AdminUserActivityPage'
import { AdminDatabasePage } from '../pages/admin/AdminDatabasePage'
import { AdminPreferencesPage } from '../pages/admin/AdminPreferencesPage'
import { AdminChangePasswordPage } from '../pages/admin/AdminChangePasswordPage'

export function createAdminRoutes() {
  return (
    <>
      <Route element={<RequireAuth />}>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/preferences" element={<AdminPreferencesPage />} />
        <Route
          path="/admin/change-password"
          element={<AdminChangePasswordPage />}
        />
      </Route>
      <Route element={<RequireAuth requiredRole="admin" />}>
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/users/create" element={<AdminCreateUserPage />} />
        <Route
          path="/admin/users/profiles/:userId"
          element={<AdminUserProfilesPage />}
        />
        <Route
          path="/admin/users/profiles/:userId/activity"
          element={<AdminUserActivityPage />}
        />
        <Route path="/admin/database" element={<AdminDatabasePage />} />
      </Route>
    </>
  )
}
