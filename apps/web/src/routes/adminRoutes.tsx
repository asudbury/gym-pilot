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
import { PageLayout } from '../layouts/PageLayout' // Keep this import, it's already there

export function createAdminRoutes() {
  return (
    <>
      <Route element={<RequireAuth requiredRole="admin" />}>
        <Route path="/admin" element={<PageLayout><AdminPage /></PageLayout>} />
        <Route
          path="/admin/preferences"
          element={<PageLayout><Navigate to="/preferences" replace /></PageLayout>}
        />
      </Route>
      <Route element={<RequireAuth requiredRole="admin" />}>
        <Route path="/admin/users" element={<PageLayout><AdminUsersPage /></PageLayout>} />
        <Route path="/admin/users/create" element={<PageLayout><AdminCreateUserPage /></PageLayout>} />
        <Route
          path="/admin/users/profiles/:userId"
          element={<PageLayout><AdminUserProfilesPage /></PageLayout>}
        />
        <Route
          path="/admin/users/edit/:userId"
          element={<PageLayout><AdminEditUserPage /></PageLayout>}
        />
        <Route
          path="/admin/users/profiles/:userId/activity"
          element={<PageLayout><AdminUserActivityPage /></PageLayout>}
        />
        <Route path="/admin/app-settings" element={<PageLayout><AdminAppSettingsPage /></PageLayout>} />
        <Route path="/admin/database" element={<PageLayout><AdminDatabasePage /></PageLayout>} />
        <Route path="/admin/logs" element={<PageLayout><AdminLogsPage /></PageLayout>} />
        <Route
          path="/admin/logs/error"
          element={<PageLayout><AdminLogsPage view="error" /></PageLayout>}
        />
        <Route
          path="/admin/logs/audit"
          element={<PageLayout><AdminLogsPage view="audit" /></PageLayout>}
        />
        <Route
          path="/admin/logs/activity"
          element={<PageLayout><AdminLogsPage view="activity" /></PageLayout>}
        />
      </Route>
    </>
  )
}
