import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import webPackageJson from '../package.json'
import { exercises, exercisesSchema, getSupabaseClient, usePlan } from '@gym-pilot/shared'
import { getToneClass } from './components/toneClasses'
import { HOME_FILTER_KEY } from './constants/storageKeys'
import { ExercisePage } from './pages/ExercisePage'
import { HomePage } from './pages/HomePage'
import { PlanDetailPage } from './pages/plans/PlanDetailPage'
import { PlansPage } from './pages/plans/PlansPage'
import { AssignmentsPage } from './pages/assignments/AssignmentsPage'
import { CreatePlanPage } from './pages/plans/CreatePlanPage'
import { CreateAssignmentPage } from './pages/assignments/CreateAssignmentPage'
import { AssignmentsManagerPage } from './pages/assignments/AssignmentsManagerPage'
import { getExercisePath } from './utils/exerciseRouteUtils'
import { Header } from './components/navigation/Header'
import { formatLabel } from './utils/formatUtils'
import { RequireAuth } from './auth/RequireAuth'
import { LoginPage } from './pages/LoginPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { useAuth } from './auth/AuthContext'
import { AdminPage } from './pages/admin/AdminPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { AdminCreateUserPage } from './pages/admin/AdminCreateUserPage'
import { AdminUserProfilesPage } from './pages/admin/AdminUserProfilesPage'
import { AdminUserActivityPage } from './pages/admin/AdminUserActivityPage'
import { AdminDatabasePage } from './pages/admin/AdminDatabasePage'
import { AdminPreferencesPage } from './pages/admin/AdminPreferencesPage'
import { AdminChangePasswordPage } from './pages/admin/AdminChangePasswordPage'
import { HelpPage } from './pages/help/HelpPage'
import { FavouritesPage } from './pages/FavouritesPage'
import { DashboardPage } from './pages/DashboardPage'
import { TimetablePage } from './pages/TimetablePage'
import { buildNavigationMenuItems } from './utils/navigationUtils'
import { AssignmentDetailPage } from './pages/assignments/AssignmentDetailPage'
import { logger } from '@gym-pilot/shared'
import { getHashHomeUrl, normalizeHomeFilters, type HomeFilters } from './utils/appUtils'
import { useFavoritesFeature } from './features/favorites/hooks/useFavoritesFeature'
import { sortQuickLinks, type QuickLink } from './features/favorites/domain/quickLinks'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function App() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const { users, visiblePlans, visibleAssignments } = usePlan()
  const SHOW_AUTH_BUTTON = true
  const { user, logout, showVersion } = useAuth()
  const appVersion = webPackageJson.version || '0.0.0'
  const { favorites, folders, setFavorites, setFolders } = useFavoritesFeature()

  const [homeFilters, setHomeFilters] = useState<HomeFilters>(() => {
    if (typeof window === 'undefined') {
      return { searchTerm: '', selectedCategory: null, showImages: true }
    }

    const savedFilters = window.sessionStorage.getItem(HOME_FILTER_KEY)

    if (!savedFilters) {
      return { searchTerm: '', selectedCategory: null, showImages: true }
    }

    try {
      const parsed = JSON.parse(savedFilters) as Partial<HomeFilters>

      return normalizeHomeFilters(parsed)
    } catch {
      window.sessionStorage.removeItem(HOME_FILTER_KEY)
      return { searchTerm: '', selectedCategory: null, showImages: true }
    }
  })

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    window.sessionStorage.setItem(HOME_FILTER_KEY, JSON.stringify(normalizeHomeFilters(homeFilters)))
  }, [homeFilters])

  useEffect(() => {
    const client = getSupabaseClient()

    if (!client || pathname !== '/auth/callback') {
      return
    }

    logger.info('[App] Handling Supabase auth callback', { pathname, search })

    void client.auth.exchangeCodeForSession(window.location.href).then(({ error }) => {
      if (error) {
        logger.error('Supabase auth callback failed', error)
        return
      }

      logger.info('[App] Supabase auth callback succeeded; redirecting home')
      window.dispatchEvent(new Event('gym-pilot-auth-updated'))
      window.location.assign(getHashHomeUrl())
    })
  }, [pathname, search])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname, user?.id, user?.email])


  const handleToggleFavoriteExercise = (exerciseId: string) => {
    
    logger.debug(`Toggling favorite exercise: ${exerciseId}`)
    
    const parsed = exercisesSchema.parse(exercises)
    const exercise = parsed.find((item) => item.id === exerciseId)

    if (!exercise) {
      return
    }

    const favoriteLink: QuickLink = {
      id: `exercise-${exercise.id}`,
      label: formatLabel(exercise.name),
      path: getExercisePath(exercise),
    }

    const alreadySaved = favorites.some((item) => item.path === favoriteLink.path)

    if (alreadySaved) {
      setFavorites((current) => sortQuickLinks(current.filter((item) => item.path !== favoriteLink.path)))
      return
    }

    setFavorites((current) => sortQuickLinks([favoriteLink, ...current]).slice(0, 8))
  }

  const isExerciseFavorite = (exerciseId: string) => {
    const parsed = exercisesSchema.parse(exercises)
    const exercise = parsed.find((item) => item.id === exerciseId)

    return Boolean(exercise && favorites.some((item) => item.path === getExercisePath(exercise)))
  }

  const plansCount = visiblePlans.length
  const isTrainer = Boolean(
    user && (user.role === 'trainer' || user.roles?.includes('trainer')),
  )
  const isClient = Boolean(
    user && (user.role === 'client' || user.roles?.includes('client')),
  )
  const assignedTrainer = isClient && user?.trainerId
    ? users.find((candidate) => candidate.id === user.trainerId)
    : undefined
  const appName = isTrainer
    ? (user?.applicationName?.trim() || 'GymPilot')
    : (assignedTrainer && (assignedTrainer.applicationName?.trim() || assignedTrainer.name?.trim())
      ? (assignedTrainer.applicationName?.trim() || assignedTrainer.name?.trim())
      : 'GymPilot')
  const desktopMenuItems = buildNavigationMenuItems({
    plansCount,
    assignmentsCount: visibleAssignments.length,
    isAuthenticated: Boolean(user),
    itemClassName: getToneClass('default', 'px-4 py-2 text-sm font-medium'),
  })
  const tabletMenuItems = buildNavigationMenuItems({
    plansCount,
    assignmentsCount: visibleAssignments.length,
    isAuthenticated: Boolean(user),
    onItemClick: () => setMobileMenuOpen(false),
    itemClassName: 'rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50',
  })
  const mobileMenuItems = buildNavigationMenuItems({
    plansCount,
    assignmentsCount: visibleAssignments.length,
    isAuthenticated: Boolean(user),
    onItemClick: () => setMobileMenuOpen(false),
    itemClassName: 'rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50',
  })

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <ScrollToTop />
      <Header
        appName={appName}
        appVersion={appVersion}
        showVersion={showVersion}
        favorites={favorites}
        homeFilters={homeFilters}
        desktopMenuItems={desktopMenuItems}
        tabletMenuItems={tabletMenuItems}
        mobileMenuItems={mobileMenuItems}
        showAuthButton={SHOW_AUTH_BUTTON}
        user={user}
        folders={folders}
        onFoldersChange={setFolders}
        onFavoritesChange={setFavorites}
        onHomeFiltersChange={setHomeFilters}
        onAuthClick={() => {
          setMobileMenuOpen(false)

          if (user) {
            logout()
            return
          }

          navigate('/login')
        }}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((current) => !current)}
      />

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<LoginPage />} />
        <Route path="/" element={user ? <DashboardPage userName={user.name || user.email || null} /> : <HomePage filters={homeFilters} onFiltersChange={setHomeFilters} onToggleFavoriteExercise={handleToggleFavoriteExercise} isExerciseFavorite={isExerciseFavorite} />} />
        <Route path="/exercise/:slug" element={<ExercisePage onToggleFavoriteExercise={handleToggleFavoriteExercise} isExerciseFavorite={isExerciseFavorite} />} />
        <Route>
          <Route path="/help" element={<HelpPage />} />
          <Route path="/favourites" element={<FavouritesPage favorites={favorites} folders={folders} onFoldersChange={setFolders} onFavoritesChange={setFavorites} />} />
          <Route element={<RequireAuth />}>
            <Route path="/exercises" element={<HomePage filters={homeFilters} onFiltersChange={setHomeFilters} onToggleFavoriteExercise={handleToggleFavoriteExercise} isExerciseFavorite={isExerciseFavorite} />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route element={<RequireAuth requireClubId />}> 
              <Route path="/timetable" element={<TimetablePage />} />
            </Route>
            <Route path="/assignments" element={<AssignmentsPage />} />
            <Route path="/users/:userSlug/assignments" element={<AssignmentsPage />} />
            <Route path="/users/:userSlug/assignments/create" element={<AssignmentsManagerPage />} />
            <Route path="/plans/new" element={<CreatePlanPage />} />
            <Route path="/plans/:planSlug/edit" element={<CreatePlanPage />} />
            <Route path="/plans/:planSlug" element={<PlanDetailPage />} />
            <Route path="/assignments/new" element={<AssignmentsManagerPage />} />
            <Route path="/assignments/create" element={<Navigate to="/assignments/new" replace />} />
            <Route path="/users/:userSlug/assignments/new" element={<AssignmentsManagerPage />} />
            <Route path="/users/:userSlug/assignments/create" element={<Navigate to="../new" replace />} />
            <Route path="/users/:userSlug/assignments/:planSlug" element={<AssignmentDetailPage />} />
            <Route path="/users/:userSlug/assignments/:planSlug/edit" element={<CreateAssignmentPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/preferences" element={<AdminPreferencesPage />} />
            <Route path="/admin/change-password" element={<AdminChangePasswordPage />} />
          </Route>
          <Route element={<RequireAuth requiredRole="admin" />}>
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/users/create" element={<AdminCreateUserPage />} />
            <Route path="/admin/users/profiles/:userId" element={<AdminUserProfilesPage />} />
            <Route path="/admin/users/profiles/:userId/activity" element={<AdminUserActivityPage />} />
            <Route path="/admin/database" element={<AdminDatabasePage />} />
          </Route>
        </Route>
      </Routes>
    </div>
  )
}

export default App


