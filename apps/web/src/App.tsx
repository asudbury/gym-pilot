import { useEffect, useState } from 'react'
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import webPackageJson from '../package.json'
import { getToneClass } from './components/toneClasses'
import { ResponsiveVisibility } from './components/ResponsiveVisibility'
import { exercises, exercisesSchema, usePlan } from '@gym-pilot/shared'
import { HOME_FILTER_STORAGE_KEY, QUICK_LINKS_FAVORITES_STORAGE_KEY } from './constants/storageKeys'
import { ExercisePage } from './pages/ExercisePage'
import { HomePage } from './pages/HomePage'
import { PlanDetailPage } from './pages/PlanDetailPage'
import { PlansPage } from './pages/PlansPage'
import { AssignmentsPage } from './pages/AssignmentsPage'
import { CreatePlanPage } from './pages/CreatePlanPage'
import { CreateAssignmentPage } from './pages/CreateAssignmentPage'
import { UsersPage } from './pages/UsersPage'
import { AssignmentsManagerPage } from './pages/AssignmentsManagerPage'
import { FavouriteLinksMenu } from './components/FavouriteLinksMenu'
import { getExercisePath } from './utils/exerciseRouteUtils'
import { formatLabel } from './utils/formatUtils'
import { RequireAuth } from './auth/RequireAuth'
import { LoginPage } from './pages/LoginPage'
import { useAuth } from './auth/AuthContext'

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
  const { plans, users } = usePlan()
  const SHOW_AUTH_BUTTON = false
  const { user, logout } = useAuth()
  const appVersion = webPackageJson.version || '0.0.0'
  const [favorites, setFavorites] = useState<QuickLink[]>(() => {
    if (typeof window === 'undefined') {
      return []
    }

    const raw = window.localStorage.getItem(QUICK_LINKS_FAVORITES_STORAGE_KEY)

    if (!raw) {
      return []
    }

    try {
      const parsed = JSON.parse(raw) as QuickLink[]
      return Array.isArray(parsed)
        ? sortQuickLinks(parsed.filter((item) => typeof item?.label === 'string' && typeof item?.path === 'string'))
        : []
    } catch {
      window.localStorage.removeItem(QUICK_LINKS_FAVORITES_STORAGE_KEY)
      return []
    }
  })
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
  const createAssignmentRoute = defaultUserSlug ? `/users/${defaultUserSlug}/assignments/create` : '/users'

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
                <NavLink
                  to="/plans"
                  className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}
                >
                  Plans ({plans.filter((plan) => !plan.sourcePlanId).length})
                </NavLink>
                <NavLink
                  to={assignmentsRoute}
                  className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}
                >
                  Assignments ({plans.filter((plan) => Boolean(plan.sourcePlanId)).length})
                </NavLink>
                <NavLink
                  to="/users"
                  className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}
                >
                  Users
                </NavLink>
                <NavLink
                  to={createAssignmentRoute}
                  className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}
                >
                  Create assignment
                </NavLink>
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
                      <NavLink to="/plans" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                        Plans ({plans.filter((plan) => !plan.sourcePlanId).length})
                      </NavLink>
                      <NavLink to="/assignments" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                        Assignments ({plans.filter((plan) => Boolean(plan.sourcePlanId)).length})
                      </NavLink>
                      <NavLink to="/users" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                        Users
                      </NavLink>
                      <NavLink to={createAssignmentRoute} onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                        Create assignment
                      </NavLink>
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
                      <NavLink to="/plans" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                        Plans ({plans.filter((plan) => !plan.sourcePlanId).length})
                      </NavLink>
                      <NavLink to={assignmentsRoute} onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                        Assignments ({plans.filter((plan) => Boolean(plan.sourcePlanId)).length})
                      </NavLink>
                      <NavLink to="/users" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                        Users
                      </NavLink>
                      <NavLink to={createAssignmentRoute} onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                        Create assignment
                      </NavLink>
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
          <Route path="/users" element={<UsersPage />} />
          <Route path="/plans/new" element={<CreatePlanPage />} />
          <Route path="/plans/:planSlug/edit" element={<CreatePlanPage />} />
          <Route path="/plans/:planSlug" element={<PlanDetailPage />} />
          <Route path="/assignments/new" element={<CreateAssignmentPage />} />
          <Route path="/users/:userSlug/assignments/:planSlug" element={<PlanDetailPage />} />
          <Route path="/users/:userSlug/assignments/:planSlug/edit" element={<CreateAssignmentPage />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
