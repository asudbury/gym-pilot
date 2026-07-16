import { useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import webPackageJson from '../package.json'
import { exercises, exercisesSchema, loadJsonRecord, saveJsonRecord, usePlan } from '@gym-pilot/shared'
import { getToneClass } from './components/toneClasses'
import { HOME_FILTER_KEY, FAVORITES_KEY } from './constants/storageKeys'
import { ExercisePage } from './pages/ExercisePage'
import { HomePage } from './pages/HomePage'
import { PlanDetailPage } from './pages/plans/PlanDetailPage'
import { PlansPage } from './pages/plans/PlansPage'
import { AssignmentsPage } from './pages/assignments/AssignmentsPage'
import { CreatePlanPage } from './pages/plans/CreatePlanPage'
import { CreateAssignmentPage } from './pages/assignments/CreateAssignmentPage'
import { AssignmentsManagerPage } from './pages/assignments/AssignmentsManagerPage'
import { getExercisePath } from './utils/exerciseRouteUtils'
import { Header } from './components/Header'
import { formatLabel } from './utils/formatUtils'
import { RequireAuth } from './auth/RequireAuth'
import { LoginPage } from './pages/LoginPage'
import { useAuth } from './auth/AuthContext'
import { AdminPage } from './pages/admin/AdminPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { AdminDatabasePage } from './pages/admin/AdminDatabasePage'
import { AdminPreferencesPage } from './pages/admin/AdminPreferencesPage'
import { HelpPage } from './pages/help/HelpPage'
import { buildNavigationMenuItems } from './utils/navigationUtils'
import { AssignmentDetailPage } from './pages/assignments/AssignmentDetailPage'
import { logger } from './utils/loggingUtils'

type HomeFilters = {
  searchTerm: string
  selectedCategory: string | null
  showImages: boolean
}

type QuickLink = {
  id: string
  label: string
  path: string
}

function normalizeHomeFilters(filters: Partial<HomeFilters> | null | undefined): HomeFilters {
  const selectedCategory = filters?.selectedCategory

  return {
    searchTerm: typeof filters?.searchTerm === 'string' ? filters.searchTerm : '',
    selectedCategory: selectedCategory === null || selectedCategory === '' || selectedCategory === 'All' ? null : typeof selectedCategory === 'string' ? selectedCategory : null,
    showImages: typeof filters?.showImages === 'boolean' ? filters.showImages : true,
  }
}

function sortQuickLinks(items: QuickLink[]) {
  return [...items].sort((left, right) => left.label.localeCompare(right.label, undefined, { sensitivity: 'base' }))
}

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function App() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { plans, assignments } = usePlan()
  const SHOW_AUTH_BUTTON = false
  const { user, logout } = useAuth()
  const appVersion = webPackageJson.version || '0.0.0'
  const [favorites, setFavorites] = useState<QuickLink[]>([])
  const favoritesHydrated = useRef(false)

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
  let cancelled = false

  async function loadFavorites() {

    const storedFavorites = await loadJsonRecord<QuickLink[]>(FAVORITES_KEY, [])

    if (cancelled) {
      return
    }

    if (Array.isArray(storedFavorites)) {
      setFavorites(
        sortQuickLinks(
          storedFavorites.filter(
            (item) =>
              typeof item?.label === 'string' &&
              typeof item?.path === 'string'
          )
        )
      )
    }

    favoritesHydrated.current = true
  }

  void loadFavorites()

  return () => {
    cancelled = true
  }
}, [])


useEffect(() => {
  if (!favoritesHydrated.current) {
    console.log('Skipping saving favourites - not hydrated')
    return
  }

  console.log('Saving favorites', favorites)

  void saveJsonRecord(FAVORITES_KEY, favorites)
}, [favorites])

  useEffect(() => {
    window.sessionStorage.setItem(HOME_FILTER_KEY, JSON.stringify(normalizeHomeFilters(homeFilters)))
  }, [homeFilters])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])


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

  const plansCount = plans.length
  const desktopMenuItems = buildNavigationMenuItems({
    plansCount,
    assignmentsCount: assignments.length,
    itemClassName: getToneClass('default', 'px-4 py-2 text-sm font-medium'),
  })
  const tabletMenuItems = buildNavigationMenuItems({
    plansCount,
    assignmentsCount: assignments.length,
    onItemClick: () => setMobileMenuOpen(false),
    itemClassName: 'rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50',
  })
  const mobileMenuItems = buildNavigationMenuItems({
    plansCount,
    assignmentsCount: assignments.length,
    onItemClick: () => setMobileMenuOpen(false),
    itemClassName: 'rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50',
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <ScrollToTop />
      <Header
        appVersion={appVersion}
        favorites={favorites}
        homeFilters={homeFilters}
        desktopMenuItems={desktopMenuItems}
        tabletMenuItems={tabletMenuItems}
        mobileMenuItems={mobileMenuItems}
        showAuthButton={SHOW_AUTH_BUTTON}
        user={user}
        onFavoritesChange={setFavorites}
        onHomeFiltersChange={setHomeFilters}
        onAuthClick={() => {
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
        <Route path="/" element={<HomePage filters={homeFilters} onFiltersChange={setHomeFilters} onToggleFavoriteExercise={handleToggleFavoriteExercise} isExerciseFavorite={isExerciseFavorite} />} />
        <Route path="/exercise/:slug" element={<ExercisePage onToggleFavoriteExercise={handleToggleFavoriteExercise} isExerciseFavorite={isExerciseFavorite} />} />
        <Route element={<RequireAuth />}>
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/assignments" element={<AssignmentsPage />} />
          <Route path="/users/:userSlug/assignments" element={<AssignmentsPage />} />
          <Route path="/users/:userSlug/assignments/create" element={<AssignmentsManagerPage />} />
          <Route element={<RequireAuth requiredRole="admin" />}>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/preferences" element={<AdminPreferencesPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/database" element={<AdminDatabasePage />} />
          </Route>
          <Route path="/plans/new" element={<CreatePlanPage />} />
          <Route path="/plans/:planSlug/edit" element={<CreatePlanPage />} />
          <Route path="/plans/:planSlug" element={<PlanDetailPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/assignments/new" element={<AssignmentsManagerPage />} />
          <Route path="/assignments/create" element={<Navigate to="/assignments/new" replace />} />
          <Route path="/users/:userSlug/assignments/new" element={<AssignmentsManagerPage />} />
          <Route path="/users/:userSlug/assignments/create" element={<Navigate to="../new" replace />} />
          <Route path="/users/:userSlug/assignments/:planSlug" element={<AssignmentDetailPage />} />
          <Route path="/users/:userSlug/assignments/:planSlug/edit" element={<CreateAssignmentPage />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App


