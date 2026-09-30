import { lazy } from 'react'
import { Route } from 'react-router-dom'
import type { AuthUser } from '../features/auth/domain/authTypes'
import { createAdminRoutes } from './adminRoutes'
import { createProtectedRoutes } from './protectedRoutes'

const DashboardPage = lazy(async () => ({
  default: (await import('../pages/DashboardPage')).DashboardPage,
}))
const ExercisePage = lazy(async () => ({
  default: (await import('../pages/ExercisePage')).ExercisePage,
}))
const FavouritesPage = lazy(async () => ({
  default: (await import('../pages/FavouritesPage')).FavouritesPage,
}))
const HomePage = lazy(async () => ({
  default: (await import('../pages/HomePage')).HomePage,
}))
const NotFoundPage = lazy(async () => ({
  default: (await import('../pages/errors/NotFoundPage')).NotFoundPage,
}))
const HelpPage = lazy(async () => ({
  default: (await import('../pages/help/HelpPage')).HelpPage,
}))
const InstallOnIOSPage = lazy(() => import('../pages/help/InstallOnIOSPage'))

interface PublicRoutesProps {
  user: AuthUser | null
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
