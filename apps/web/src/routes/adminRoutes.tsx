import { lazy } from 'react'
import { Route, Navigate } from 'react-router-dom'
import { RequireAuth } from '../auth/RequireAuth'

const AdminPage = lazy(async () => ({
  default: (await import('../pages/admin/AdminPage')).AdminPage,
}))
const AdminUsersPage = lazy(async () => ({
  default: (await import('../pages/admin/AdminUsersPage')).AdminUsersPage,
}))
const AdminCreateUserPage = lazy(async () => ({
  default: (await import('../pages/admin/AdminCreateUserPage'))
    .AdminCreateUserPage,
}))
const AdminUserProfilesPage = lazy(async () => ({
  default: (await import('../pages/admin/AdminUserProfilesPage'))
    .AdminUserProfilesPage,
}))
const AdminEditUserPage = lazy(async () => ({
  default: (await import('../pages/admin/AdminEditUserPage')).AdminEditUserPage,
}))
const AdminUserActivityPage = lazy(async () => ({
  default: (await import('../pages/admin/AdminUserActivityPage'))
    .AdminUserActivityPage,
}))
const AdminDatabasePage = lazy(async () => ({
  default: (await import('../pages/admin/AdminDatabasePage')).AdminDatabasePage,
}))
const AdminAppSettingsPage = lazy(async () => ({
  default: (await import('../pages/admin/AdminAppSettingsPage'))
    .AdminAppSettingsPage,
}))
const AdminLogsPage = lazy(async () => ({
  default: (await import('../pages/admin/AdminLogsPage')).AdminLogsPage,
}))

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
        <Route
          path="/admin/logs/error"
          element={<AdminLogsPage view="error" />}
        />
        <Route
          path="/admin/logs/audit"
          element={<AdminLogsPage view="audit" />}
        />
        <Route
          path="/admin/logs/activity"
          element={<AdminLogsPage view="activity" />}
        />
      </Route>
    </>
  )
}
