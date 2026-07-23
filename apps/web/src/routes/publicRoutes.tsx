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
import { PageLayout } from '../layouts/PageLayout'

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
        element={<PageLayout>
            {user ? (
              <DashboardPage />
            ) : (
              <HomePage
                filters={homeFilters}
                onFiltersChange={onHomeFiltersChange}
                onToggleFavoriteExercise={onToggleFavoriteExercise}
                isExerciseFavorite={isExerciseFavorite}
              />
            )}
          </PageLayout>
        }
      />
      <Route
        path="/exercise/:slug"
        element={<PageLayout>
            <ExercisePage
              onToggleFavoriteExercise={onToggleFavoriteExercise}
              isExerciseFavorite={isExerciseFavorite}
            />
          </PageLayout>
        }
      />
      <Route path="/help" element={<PageLayout><HelpPage /></PageLayout>} />
      <Route
        path="/favourites"
        element={<PageLayout>
            <FavouritesPage
              favorites={favorites}
              folders={folders}
              onFoldersChange={onFoldersChange}
              onFavoritesChange={onFavoritesChange}
            />
          </PageLayout>
        }
      />
      {createProtectedRoutes({
        homeFilters,
        onHomeFiltersChange,
        onToggleFavoriteExercise,
        isExerciseFavorite,
      })}
      {createAdminRoutes({
      })}
    </>
  )
}
