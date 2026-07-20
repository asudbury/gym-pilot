import { Route, Navigate } from 'react-router-dom'
import { RequireAuth } from '../auth/RequireAuth'
import { AdminPage } from '../pages/admin/AdminPage'
import { AdminUsersPage } from '../pages/admin/AdminUsersPage'
import { AdminCreateUserPage } from '../pages/admin/AdminCreateUserPage'
import { AdminUserProfilesPage } from '../pages/admin/AdminUserProfilesPage'
import { AdminEditUserPage } from '../pages/admin/AdminEditUserPage'
import { AdminUserActivityPage } from '../pages/admin/AdminUserActivityPage'
import { AdminDatabasePage } from '../pages/admin/AdminDatabasePage'
import { AdminAppSettingsPage } from '../pages/admin/AdminAppSettingsPage'
import { AdminLogsPage } from '../pages/admin/AdminLogsPage'

export function createAdminRoutes() {
  return (
    <>
      <Route element={<RequireAuth requiredRole="admin" />}>
        <Route path="/admin" element={<AdminPage />} />
        <Route
          path="/admin/preferences"
          element={<Navigate to="/preferences" replace />}
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
          path="/admin/users/edit/:userId"
          element={<AdminEditUserPage />}
        />
        <Route
          path="/admin/users/profiles/:userId/activity"
          element={<AdminUserActivityPage />}
        />
        <Route path="/admin/app-settings" element={<AdminAppSettingsPage />} />
        <Route path="/admin/database" element={<AdminDatabasePage />} />
        <Route path="/admin/logs" element={<AdminLogsPage />} />
        <Route path="/admin/logs/error" element={<AdminLogsPage view="error" />} />
        <Route path="/admin/logs/audit" element={<AdminLogsPage view="audit" />} />
      </Route>
    </>
  )
}
