import { useEffect, useState } from 'react'
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import webPackageJson from '../package.json'
import { getToneClass } from './components/toneClasses'
import { ResponsiveVisibility } from './components/ResponsiveVisibility'
import { exercises, exercisesSchema, loadJsonRecord, saveJsonRecord, usePlan } from '@gym-pilot/shared'
import { HOME_FILTER_STORAGE_KEY, QUICK_LINKS_FAVORITES_STORAGE_KEY } from './constants/storageKeys'
import { ExercisePage } from './pages/ExercisePage'
import { HomePage } from './pages/HomePage'
import { PlanDetailPage } from './pages/PlanDetailPage'
import { PlansPage } from './pages/PlansPage'
import { AssignmentsPage } from './pages/AssignmentsPage'
import { CreatePlanPage } from './pages/CreatePlanPage'
import { CreateAssignmentPage } from './pages/CreateAssignmentPage'
import { AssignmentsManagerPage } from './pages/AssignmentsManagerPage'
import { FavouriteLinksMenu } from './components/FavouriteLinksMenu'
import { buildNavigationMenuItems, NavigationMenuList } from './components/NavigationMenuList'
import { getExercisePath } from './utils/exerciseRouteUtils'
import { formatLabel } from './utils/formatUtils'
import { RequireAuth } from './auth/RequireAuth'
import { LoginPage } from './pages/LoginPage'
import { useAuth } from './auth/AuthContext'
import { AdminPage } from './pages/AdminPage'
import { AdminUsersPage } from './pages/AdminUsersPage'
import { AdminDatabasePage } from './pages/AdminDatabasePage'

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
  const { plans, assignments, users } = usePlan()
  const SHOW_AUTH_BUTTON = false
  const { user, logout } = useAuth()
  const appVersion = webPackageJson.version || '0.0.0'
  const [favorites, setFavorites] = useState<QuickLink[]>([])
  const [homeFilters, setHomeFilters] = useState<HomeFilters>(() => {
    if (typeof window === 'undefined') {
      return { searchTerm: '', selectedCategory: null, showImages: true }
    }

    const savedFilters = window.sessionStorage.getItem(HOME_FILTER_STORAGE_KEY)

    if (!savedFilters) {
      return { searchTerm: '', selectedCategory: null, showImages: true }
    }

    try {
      const parsed = JSON.parse(savedFilters) as Partial<HomeFilters>

      return normalizeHomeFilters(parsed)
    } catch {
      window.sessionStorage.removeItem(HOME_FILTER_STORAGE_KEY)
      return { searchTerm: '', selectedCategory: null, showImages: true }
    }
  })

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const defaultUserSlug = users.find((user) => typeof user.slug === 'string' && user.slug.trim() !== '')?.slug ?? ''
  const assignmentsRoute = defaultUserSlug ? `/users/${defaultUserSlug}/assignments` : '/users'
  const createAssignmentRoute = '/assignments/create'

  useEffect(() => {
    void saveJsonRecord(QUICK_LINKS_FAVORITES_STORAGE_KEY, favorites)
  }, [favorites])

  useEffect(() => {
    void loadJsonRecord<QuickLink[]>(QUICK_LINKS_FAVORITES_STORAGE_KEY, []).then((storedFavorites) => {
      if (Array.isArray(storedFavorites)) {
        setFavorites(sortQuickLinks(storedFavorites.filter((item) => typeof item?.label === 'string' && typeof item?.path === 'string')))
      }
    })
  }, [])

  useEffect(() => {
    window.sessionStorage.setItem(HOME_FILTER_STORAGE_KEY, JSON.stringify(normalizeHomeFilters(homeFilters)))
  }, [homeFilters])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])


  const handleToggleFavoriteExercise = (exerciseId: string) => {
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

  const plansCount = plans.filter((plan) => !plan.sourcePlanId).length
  const desktopMenuItems = buildNavigationMenuItems({
    plansCount,
    assignmentsCount: assignments.length,
    assignmentsPath: assignmentsRoute,
    createAssignmentPath: createAssignmentRoute,
    adminPath: '/admin',
    itemClassName: getToneClass('default', 'px-4 py-2 text-sm font-medium'),
  })
  const tabletMenuItems = buildNavigationMenuItems({
    plansCount,
    assignmentsCount: assignments.length,
    assignmentsPath: '/assignments',
    createAssignmentPath: createAssignmentRoute,
    adminPath: '/admin/users',
    onItemClick: () => setMobileMenuOpen(false),
    itemClassName: 'rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50',
  })
  const mobileMenuItems = buildNavigationMenuItems({
    plansCount,
    assignmentsCount: assignments.length,
    assignmentsPath: assignmentsRoute,
    createAssignmentPath: createAssignmentRoute,
    adminPath: '/admin/users',
    onItemClick: () => setMobileMenuOpen(false),
    itemClassName: 'rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50',
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <ScrollToTop />
      <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col">
            <NavLink to="/" className="text-lg font-semibold text-slate-900">
              GymPilot
              {' '}  
              <span className="text-[11px] font-medium tracking-[0.2em] text-slate-500">
                {`(v${appVersion})`}
              </span>
            </NavLink>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ResponsiveVisibility visibleOn="desktop">
              <div className="flex items-center gap-2">
                <FavouriteLinksMenu
                  favorites={favorites}
                  homeFilters={homeFilters}
                  variant="header"
                  onFavoritesChange={setFavorites}
                  onHomeFiltersChange={setHomeFilters}
                />
                <NavigationMenuList
                  className="flex items-center gap-2"
                  items={desktopMenuItems}
                />
                {!SHOW_AUTH_BUTTON ? null : (
                  <button
                    type="button"
                    onClick={() => {
                      if (user) {
                        logout()
                        return
                      }

                      navigate('/login')
                    }}
                    className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}
                  >
                    {user ? 'Sign out' : 'Login'}
                  </button>
                )}
              </div>
            </ResponsiveVisibility>
            <ResponsiveVisibility visibleOn="tablet">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((current) => !current)}
                  className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}
                >
                  Menu
                </button>
                {mobileMenuOpen && (
                  <div className="fixed inset-x-3 top-16 z-40 max-h-[min(75vh,32rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-xl sm:absolute sm:right-0 sm:left-auto sm:top-full sm:mt-2 sm:w-80 sm:max-w-[calc(100vw-2rem)]">
                    <div className="flex flex-col gap-2">
                      <FavouriteLinksMenu
                        favorites={favorites}
                        homeFilters={homeFilters}
                        onFavoritesChange={setFavorites}
                        onHomeFiltersChange={setHomeFilters}
                      />
                      <NavigationMenuList
                        className="flex flex-col gap-2"
                        items={tabletMenuItems}
                      />
                    </div>
                  </div>
                )}
              </div>
            </ResponsiveVisibility>
            <ResponsiveVisibility visibleOn="mobile">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((current) => !current)}
                  className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}
                >
                  Menu
                </button>
                {mobileMenuOpen && (
                  <div className="fixed inset-x-3 top-16 z-40 max-h-[min(75vh,32rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-xl sm:absolute sm:right-0 sm:left-auto sm:top-full sm:mt-2 sm:w-80 sm:max-w-[calc(100vw-2rem)]">
                    <div className="flex flex-col gap-2">
                      <FavouriteLinksMenu
                        favorites={favorites}
                        homeFilters={homeFilters}
                        onFavoritesChange={setFavorites}
                        onHomeFiltersChange={setHomeFilters}
                      />
                      <NavigationMenuList
                        className="flex flex-col gap-2"
                        items={mobileMenuItems}
                      />
                    </div>
                  </div>
                )}
              </div>
            </ResponsiveVisibility>
          </div>
        </div>
      </nav>

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
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/database" element={<AdminDatabasePage />} />
          </Route>
          <Route path="/plans/new" element={<CreatePlanPage />} />
          <Route path="/plans/:planSlug/edit" element={<CreatePlanPage />} />
          <Route path="/plans/:planSlug" element={<PlanDetailPage />} />
          <Route path="/assignments/create" element={<AssignmentsManagerPage />} />
          <Route path="/assignments/new" element={<AssignmentsManagerPage />} />
          <Route path="/users/:userSlug/assignments/:planSlug" element={<PlanDetailPage />} />
          <Route path="/users/:userSlug/assignments/:planSlug/edit" element={<CreateAssignmentPage />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
