import { useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import webPackageJson from '../package.json'
import { exercises, exercisesSchema, getSupabaseClient, loadJsonRecord, saveJsonRecord, usePlan } from '@gym-pilot/shared'
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
import { FavouritesPage } from './pages/FavouritesPage'
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
  folder?: string
}

type FavoritesStorageValue = {
  favorites: QuickLink[]
  folders: string[]
}

function normalizeFavoriteStorageValue(value: unknown): FavoritesStorageValue {
  if (Array.isArray(value)) {
    return {
      favorites: value.filter((item): item is QuickLink => Boolean(item && typeof item === 'object' && typeof (item as QuickLink).path === 'string' && typeof (item as QuickLink).label === 'string')),
      folders: [],
    }
  }

  if (value && typeof value === 'object') {
    const candidate = value as Partial<FavoritesStorageValue>
    const folders = Array.isArray(candidate.folders)
      ? candidate.folders.filter((folder): folder is string => typeof folder === 'string' && folder.trim().length > 0)
      : []

    const favorites = Array.isArray(candidate.favorites)
      ? candidate.favorites.filter((item): item is QuickLink => Boolean(item && typeof item === 'object' && typeof (item as QuickLink).path === 'string' && typeof (item as QuickLink).label === 'string'))
      : []

    return {
      favorites,
      folders: Array.from(new Set(folders.map((folder) => folder.trim()))).sort((left, right) => left.localeCompare(right)),
    }
  }

  return { favorites: [], folders: [] }
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
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const { plans, assignments } = usePlan()
  const SHOW_AUTH_BUTTON = true
  const { user, logout } = useAuth()
  const appVersion = webPackageJson.version || '0.0.0'
  const [favorites, setFavorites] = useState<QuickLink[]>([])
  const [folders, setFolders] = useState<string[]>([])
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
    const storedValue = await loadJsonRecord<unknown>(FAVORITES_KEY, { favorites: [], folders: [] })
    const normalizedValue = normalizeFavoriteStorageValue(storedValue)

    if (cancelled) {
      return
    }

    setFavorites(sortQuickLinks(normalizedValue.favorites))
    setFolders(normalizedValue.folders)
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

  console.log('Saving favorites', { favorites, folders })

  void saveJsonRecord(FAVORITES_KEY, { favorites, folders })
}, [favorites, folders])

  useEffect(() => {
    window.sessionStorage.setItem(HOME_FILTER_KEY, JSON.stringify(normalizeHomeFilters(homeFilters)))
  }, [homeFilters])

  useEffect(() => {
    const client = getSupabaseClient()

    if (!client || pathname !== '/auth/callback') {
      return
    }

    console.log('[App] Handling Supabase auth callback', { pathname, search })

    void client.auth.exchangeCodeForSession(window.location.href).then(({ error }) => {
      if (error) {
        console.error('Supabase auth callback failed', error)
        return
      }

      console.log('[App] Supabase auth callback succeeded; redirecting home')
      window.dispatchEvent(new Event('gym-pilot-auth-updated'))
      window.location.replace('/')
    })
  }, [pathname, search])

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
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
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
        folders={folders}
        onFoldersChange={setFolders}
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
        <Route path="/auth/callback" element={<LoginPage />} />
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
          <Route path="/favourites" element={<FavouritesPage favorites={favorites} folders={folders} onFoldersChange={setFolders} onFavoritesChange={setFavorites} />} />
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


