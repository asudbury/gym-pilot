import { useEffect, useState } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import webPackageJson from '../package.json'
import { getToneClass } from './components/toneClasses'
import { ResponsiveVisibility } from './components/ResponsiveVisibility'
import { exercises, exercisesSchema, formatLabel, usePlan } from '@gym-pilot/shared'
import { HOME_FILTER_STORAGE_KEY, QUICK_LINKS_FAVORITES_STORAGE_KEY, QUICK_LINKS_RECENT_STORAGE_KEY, QUICK_LINKS_SAVED_SEARCHES_STORAGE_KEY } from './constants/storageKeys'
import { ExercisePage } from './pages/ExercisePage'
import { HomePage } from './pages/HomePage'
import { AssignmentDetailPage } from './pages/AssignmentDetailPage'
import { AssignmentsPage } from './pages/AssignmentsPage'
import { CreateAssignmentPage } from './pages/CreateAssignmentPage'
import { QuickLinksMenu } from './components/QuickLinksMenu'

type HomeFilters = {
  searchTerm: string
  selectedCategory: string | null
}

type QuickLink = {
  id: string
  label: string
  path: string
}

type SavedSearch = {
  id: string
  label: string
  searchTerm: string
  selectedCategory: string | null
}

function normalizeHomeFilters(filters: Partial<HomeFilters> | null | undefined): HomeFilters {
  const selectedCategory = filters?.selectedCategory

  return {
    searchTerm: typeof filters?.searchTerm === 'string' ? filters.searchTerm : '',
    selectedCategory: selectedCategory === null || selectedCategory === '' || selectedCategory === 'All' ? null : typeof selectedCategory === 'string' ? selectedCategory : null,
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
  const { assignments } = usePlan()
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
  const [recentItems, setRecentItems] = useState<QuickLink[]>(() => {
    if (typeof window === 'undefined') {
      return []
    }

    const raw = window.localStorage.getItem(QUICK_LINKS_RECENT_STORAGE_KEY)

    if (!raw) {
      return []
    }

    try {
      const parsed = JSON.parse(raw) as QuickLink[]
      return Array.isArray(parsed) ? parsed.filter((item) => typeof item?.label === 'string' && typeof item?.path === 'string') : []
    } catch {
      window.localStorage.removeItem(QUICK_LINKS_RECENT_STORAGE_KEY)
      return []
    }
  })
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(() => {
    if (typeof window === 'undefined') {
      return []
    }

    const raw = window.localStorage.getItem(QUICK_LINKS_SAVED_SEARCHES_STORAGE_KEY)

    if (!raw) {
      return []
    }

    try {
      const parsed = JSON.parse(raw) as SavedSearch[]
      return Array.isArray(parsed)
        ? parsed.filter((item) => typeof item?.label === 'string' && typeof item?.searchTerm === 'string')
        : []
    } catch {
      window.localStorage.removeItem(QUICK_LINKS_SAVED_SEARCHES_STORAGE_KEY)
      return []
    }
  })
  const [homeFilters, setHomeFilters] = useState<HomeFilters>(() => {
    if (typeof window === 'undefined') {
      return { searchTerm: '', selectedCategory: null }
    }

    const savedFilters = window.sessionStorage.getItem(HOME_FILTER_STORAGE_KEY)

    if (!savedFilters) {
      return { searchTerm: '', selectedCategory: null }
    }

    try {
      const parsed = JSON.parse(savedFilters) as Partial<HomeFilters>

      return normalizeHomeFilters(parsed)
    } catch {
      window.sessionStorage.removeItem(HOME_FILTER_STORAGE_KEY)
      return { searchTerm: '', selectedCategory: null }
    }
  })

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    window.sessionStorage.setItem(HOME_FILTER_STORAGE_KEY, JSON.stringify(normalizeHomeFilters(homeFilters)))
  }, [homeFilters])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    window.localStorage.setItem(QUICK_LINKS_FAVORITES_STORAGE_KEY, JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    window.localStorage.setItem(QUICK_LINKS_RECENT_STORAGE_KEY, JSON.stringify(recentItems))
  }, [recentItems])

  useEffect(() => {
    window.localStorage.setItem(QUICK_LINKS_SAVED_SEARCHES_STORAGE_KEY, JSON.stringify(savedSearches))
  }, [savedSearches])

  const handleToggleFavoriteExercise = (exerciseId: string) => {
    const parsed = exercisesSchema.parse(exercises)
    const exercise = parsed.find((item) => item.id === exerciseId)

    if (!exercise) {
      return
    }

    const favoriteLink: QuickLink = {
      id: `exercise-${exercise.id}`,
      label: formatLabel(exercise.name),
      path: `/exercise/${exercise.id}`,
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

    return Boolean(exercise && favorites.some((item) => item.path === `/exercise/${exercise.id}`))
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
                <QuickLinksMenu
                  favorites={favorites}
                  recentItems={recentItems}
                  savedSearches={savedSearches}
                  homeFilters={homeFilters}
                  variant="header"
                  onFavoritesChange={setFavorites}
                  onRecentItemsChange={setRecentItems}
                  onSavedSearchesChange={setSavedSearches}
                  onHomeFiltersChange={setHomeFilters}
                />
                <NavLink
                  to="/assignments"
                  className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}
                >
                  Assignments ({assignments.length})
                </NavLink>
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
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                    <div className="flex flex-col gap-2">
                      <QuickLinksMenu
                        favorites={favorites}
                        recentItems={recentItems}
                        savedSearches={savedSearches}
                        homeFilters={homeFilters}
                        onFavoritesChange={setFavorites}
                        onRecentItemsChange={setRecentItems}
                        onSavedSearchesChange={setSavedSearches}
                        onHomeFiltersChange={setHomeFilters}
                      />
                      <NavLink to="/assignments" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                        Assignments ({assignments.length})
                      </NavLink>
                      <NavLink to="/assignments/new" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
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
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                    <div className="flex flex-col gap-2">
                      <QuickLinksMenu
                        favorites={favorites}
                        recentItems={recentItems}
                        savedSearches={savedSearches}
                        homeFilters={homeFilters}
                        onFavoritesChange={setFavorites}
                        onRecentItemsChange={setRecentItems}
                        onSavedSearchesChange={setSavedSearches}
                        onHomeFiltersChange={setHomeFilters}
                      />
                      <NavLink to="/assignments" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                        Assignments ({assignments.length})
                      </NavLink>
                      <NavLink to="/assignments/new" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
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
        <Route path="/" element={<HomePage filters={homeFilters} onFiltersChange={setHomeFilters} onToggleFavoriteExercise={handleToggleFavoriteExercise} isExerciseFavorite={isExerciseFavorite} />} />
        <Route path="/exercise/:id" element={<ExercisePage onToggleFavoriteExercise={handleToggleFavoriteExercise} isExerciseFavorite={isExerciseFavorite} />} />
        <Route path="/assignments" element={<AssignmentsPage />} />
        <Route path="/assignments/new" element={<CreateAssignmentPage />} />
        <Route path="/assignments/:assignmentSlug" element={<AssignmentDetailPage />} />
      </Routes>
    </div>
  )
}

export default App
