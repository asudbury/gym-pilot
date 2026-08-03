import { Route } from 'react-router-dom'
import { DashboardPage } from '../pages/DashboardPage'
import { ExercisePage } from '../pages/ExercisePage'
import { FavouritesPage } from '../pages/FavouritesPage'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/errors/NotFoundPage'
import { HelpPage } from '../pages/help/HelpPage'
import InstallOnIOSPage from '../pages/help/InstallOnIOSPage'
import { createAdminRoutes } from './adminRoutes'
import { createProtectedRoutes } from './protectedRoutes'

interface PublicRoutesProps {
  user: any
}

export function createPublicRoutes({ user }: PublicRoutesProps) {
  return (
    <>
      <Route path="/" element={user ? <DashboardPage /> : <HomePage />} />
      <Route path="/exercise/:slug" element={<ExercisePage />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/help/install-ios" element={<InstallOnIOSPage />} />

      <Route path="/favourites" element={<FavouritesPage />} />
      {createProtectedRoutes()}
      {createAdminRoutes()}
      <Route path="*" element={<NotFoundPage />} />
    </>
  )
}
