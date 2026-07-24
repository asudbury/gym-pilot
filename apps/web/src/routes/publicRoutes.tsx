import { Route } from 'react-router-dom'
import { ExercisePage } from '../pages/ExercisePage'
import { HomePage } from '../pages/HomePage'
import { HelpPage } from '../pages/help/HelpPage'
import { FavouritesPage } from '../pages/FavouritesPage'
import { DashboardPage } from '../pages/DashboardPage'
import { type HomeFilters } from '../utils/appUtils'
import { type QuickLink } from '../features/favourites/domain/quickLinks'
import { createProtectedRoutes } from './protectedRoutes'
import { createAdminRoutes } from './adminRoutes'
import InstallOnIOSPage from '../pages/help/InstallOnIOSPage'

interface PublicRoutesProps {
  user: any
  homeFilters: HomeFilters
  onHomeFiltersChange: (filters: HomeFilters) => void
  onToggleFavoriteExercise: (exerciseId: string) => void
  isExerciseFavorite: (exerciseId: string) => boolean
  favorites: QuickLink[]
  folders: any[]
  onFoldersChange: (folders: any[]) => void
  onFavoritesChange: (favorites: QuickLink[]) => void
}

export function createPublicRoutes({
  user,
  homeFilters,
  onHomeFiltersChange,
  onToggleFavoriteExercise,
  isExerciseFavorite,
  favorites,
  folders,
  onFoldersChange,
  onFavoritesChange,
}: PublicRoutesProps) {
  return (
    <>
      <Route
        path="/"
        element={
          user ? (
            <DashboardPage />
          ) : (
            <HomePage
              filters={homeFilters}
              onFiltersChange={onHomeFiltersChange}
              onToggleFavoriteExercise={onToggleFavoriteExercise}
              isExerciseFavorite={isExerciseFavorite}
            />
          )
        }
      />
      <Route
        path="/exercise/:slug"
        element={
          <ExercisePage
            onToggleFavoriteExercise={onToggleFavoriteExercise}
            isExerciseFavorite={isExerciseFavorite}
          />
        }
      />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/help/install-ios" element={<InstallOnIOSPage />} />
      <Route
        path="/favourites"
        element={
          <FavouritesPage
            favorites={favorites}
            folders={folders}
            onFoldersChange={onFoldersChange}
            onFavoritesChange={onFavoritesChange}
          />
        }
      />
      {createProtectedRoutes({
        homeFilters,
        onHomeFiltersChange,
        onToggleFavoriteExercise,
        isExerciseFavorite,
      })}
      {createAdminRoutes()}
    </>
  )
}
