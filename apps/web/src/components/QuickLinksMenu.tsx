import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getToneClass } from './toneClasses'
import { exercises, exercisesSchema, formatLabel } from '@gym-pilot/shared'
import { QUICK_LINKS_FAVORITES_STORAGE_KEY, QUICK_LINKS_RECENT_STORAGE_KEY, QUICK_LINKS_SAVED_SEARCHES_STORAGE_KEY } from '../constants/storageKeys'

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

type HomeFilters = {
  searchTerm: string
  selectedCategory: string | null
  showImages: boolean
}

type QuickLinksMenuProps = {
  favorites: QuickLink[]
  recentItems: QuickLink[]
  savedSearches: SavedSearch[]
  homeFilters: HomeFilters
  variant?: 'header' | 'menu'
  onFavoritesChange: (favorites: QuickLink[]) => void
  onRecentItemsChange: (recentItems: QuickLink[]) => void
  onSavedSearchesChange: (savedSearches: SavedSearch[]) => void
  onHomeFiltersChange: (filters: HomeFilters) => void
  onMenuOpenChange?: (open: boolean) => void
}

function getQuickLinkForPath(pathname: string, exerciseLookup: Map<string, { id: string; name: string }>): QuickLink | null {
  if (pathname === '/') {
    return { id: 'home', label: 'Home', path: '/' }
  }

  if (pathname === '/assignments') {
    return { id: 'assignments', label: 'Assignments', path: '/assignments' }
  }

  if (pathname === '/assignments/new') {
    return { id: 'new-assignment', label: 'New assignment', path: '/assignments/new' }
  }

  if (pathname.startsWith('/exercise/')) {
    const exerciseId = pathname.split('/').pop()

    if (!exerciseId) {
      return { id: 'exercise', label: 'Exercise', path: pathname }
    }

    const exercise = exerciseLookup.get(exerciseId)

    return exercise
      ? { id: `exercise-${exercise.id}`, label: formatLabel(exercise.name), path: pathname }
      : { id: `exercise-${exerciseId}`, label: 'Exercise', path: pathname }
  }

  if (pathname.startsWith('/assignments/')) {
    return { id: pathname, label: 'Assignment', path: pathname }
  }

  return { id: pathname, label: pathname, path: pathname }
}

export function QuickLinksMenu({
  favorites,
  recentItems,
  savedSearches,
  homeFilters,
  variant = 'menu',
  onFavoritesChange,
  onRecentItemsChange,
  onSavedSearchesChange,
  onHomeFiltersChange,
  onMenuOpenChange,
}: QuickLinksMenuProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeQuickLinkTab, setActiveQuickLinkTab] = useState<'favorites' | 'recent' | 'searches'>('favorites')

  useEffect(() => {
    window.localStorage.setItem(QUICK_LINKS_FAVORITES_STORAGE_KEY, JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    window.localStorage.setItem(QUICK_LINKS_RECENT_STORAGE_KEY, JSON.stringify(recentItems))
  }, [recentItems])

  useEffect(() => {
    window.localStorage.setItem(QUICK_LINKS_SAVED_SEARCHES_STORAGE_KEY, JSON.stringify(savedSearches))
  }, [savedSearches])

  useEffect(() => {
    onMenuOpenChange?.(menuOpen)
  }, [menuOpen, onMenuOpenChange])

  useEffect(() => {
    if (!menuOpen) {
      return
    }

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node | null
      const menu = document.getElementById('quick-links-menu')
      const trigger = document.getElementById('quick-links-trigger')

      if (menu && trigger && !menu.contains(target) && !trigger.contains(target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) {
      return
    }

    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setMenuOpen((current) => !current)
      }
    }

    window.addEventListener('keydown', handleShortcut)

    return () => {
      window.removeEventListener('keydown', handleShortcut)
    }
  }, [menuOpen])

  const exerciseLookup = useMemo(() => {
    const parsed = exercisesSchema.parse(exercises)
    return new Map(parsed.map((exercise) => [exercise.id, exercise]))
  }, [])

  const currentQuickLink = useMemo(() => getQuickLinkForPath(location.pathname, exerciseLookup), [exerciseLookup, location.pathname])
  const normalizedCategory = homeFilters.selectedCategory === 'All' || homeFilters.selectedCategory === '' ? null : homeFilters.selectedCategory
  const isCurrentPageFavorite = currentQuickLink ? favorites.some((item) => item.path === currentQuickLink.path) : false
  const canSaveCurrentSearch = location.pathname === '/' && (homeFilters.searchTerm.trim().length > 0 || normalizedCategory !== null)

  useEffect(() => {
    if (!currentQuickLink) {
      return
    }

    onRecentItemsChange([currentQuickLink, ...recentItems.filter((item) => item.path !== currentQuickLink.path)].slice(0, 8))
  }, [currentQuickLink, onRecentItemsChange])

  const handleToggleFavoriteLink = (link: QuickLink) => {
    const alreadySaved = favorites.some((item) => item.path === link.path)

    if (alreadySaved) {
      onFavoritesChange(favorites.filter((item) => item.path !== link.path))
      return
    }

    const nextFavorites = [...favorites, link]
      .sort((left, right) => left.label.localeCompare(right.label, undefined, { sensitivity: 'base' }))
      .slice(0, 8)

    onFavoritesChange(nextFavorites)
  }

  const handleToggleCurrentFavorite = () => {
    if (!currentQuickLink) {
      return
    }

    handleToggleFavoriteLink(currentQuickLink)
  }

  const handleOpenQuickLink = (link: QuickLink) => {
    navigate(link.path)
    setMenuOpen(false)
  }

  const handleSaveCurrentSearch = () => {
    const trimmedSearch = homeFilters.searchTerm.trim()
    const label = trimmedSearch
      ? `${trimmedSearch}${normalizedCategory ? ` · ${normalizedCategory}` : ''}`
      : normalizedCategory
        ? normalizedCategory
        : 'All exercises'

    const nextSearch: SavedSearch = {
      id: `search-${Date.now()}`,
      label,
      searchTerm: homeFilters.searchTerm,
      selectedCategory: normalizedCategory,
    }

    onSavedSearchesChange([nextSearch, ...savedSearches.filter((item) => item.label !== nextSearch.label || item.searchTerm !== nextSearch.searchTerm)].slice(0, 8))
  }

  const handleApplySavedSearch = (savedSearch: SavedSearch) => {
    const normalizedSavedCategory = savedSearch.selectedCategory === 'All' || savedSearch.selectedCategory === '' ? null : savedSearch.selectedCategory
    onHomeFiltersChange({ searchTerm: savedSearch.searchTerm, selectedCategory: normalizedSavedCategory, showImages: homeFilters.showImages })
    navigate('/')
    setMenuOpen(false)
  }

  const handleRemoveSavedSearch = (savedSearchId: string) => {
    onSavedSearchesChange(savedSearches.filter((item) => item.id !== savedSearchId))
  }

  const handleClearRecent = () => {
    onRecentItemsChange([])
  }

  const triggerClassName = variant === 'header'
    ? getToneClass('default', 'w-full px-4 py-2 text-left text-sm font-medium')
    : `w-full cursor-pointer rounded-xl px-3 py-2 text-left text-sm font-medium transition ${menuOpen ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'}`

  return (
    <div className="relative">
      <button
        id="quick-links-trigger"
        type="button"
        onClick={() => setMenuOpen((current) => !current)}
        className={triggerClassName}
      >
        Quick links
      </button>
      {menuOpen && (
        <div id="quick-links-menu" className="fixed inset-x-3 top-16 z-40 max-h-[min(75vh,32rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-xl sm:absolute sm:right-0 sm:left-auto sm:top-full sm:mt-2 sm:w-80 sm:max-w-[calc(100vw-2rem)]">
          <div className="mb-3 flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">Quick links</p>
            </div>
            <button
              type="button"
              onClick={handleToggleCurrentFavorite}
              className={getToneClass('default', 'cursor-pointer px-3 py-1.5 text-xs font-medium')}
            >
              {isCurrentPageFavorite ? 'Added' : 'Add'}
            </button>
          </div>

          <div className="mb-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setActiveQuickLinkTab('favorites')}
              className={`w-full cursor-pointer rounded-xl px-3 py-2 text-sm font-medium transition sm:flex-1 ${activeQuickLinkTab === 'favorites' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              Favourites
            </button>
            <button
              type="button"
              onClick={() => setActiveQuickLinkTab('recent')}
              className={`w-full cursor-pointer rounded-xl px-3 py-2 text-sm font-medium transition sm:flex-1 ${activeQuickLinkTab === 'recent' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              Recent
            </button>
            <button
              type="button"
              onClick={() => setActiveQuickLinkTab('searches')}
              className={`w-full cursor-pointer rounded-xl px-3 py-2 text-sm font-medium transition sm:flex-1 ${activeQuickLinkTab === 'searches' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              Searches
            </button>
          </div>

          {activeQuickLinkTab === 'favorites' ? (
            favorites.length > 0 ? (
              <div className="flex flex-col gap-2">
                {favorites.map((item) => (
                  <div key={item.id} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => handleOpenQuickLink(item)}
                      className="w-full cursor-pointer rounded-xl border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:flex-1"
                    >
                      {item.label}
                    </button>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button type="button" onClick={() => handleToggleFavoriteLink(item)} className="cursor-pointer rounded-lg border border-slate-200 px-2 py-2 text-xs text-slate-600" aria-label="Remove favorite">
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-500">
                Save a page to keep it here.
              </p>
            )
          ) : activeQuickLinkTab === 'recent' ? (
            recentItems.length > 0 ? (
              <div className="flex flex-col gap-2">
                <div className="flex justify-end">
                  <button type="button" onClick={handleClearRecent} className="cursor-pointer text-xs font-medium text-slate-500 transition hover:text-slate-700">
                    Clear recent
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  {recentItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleOpenQuickLink(item)}
                      className="cursor-pointer rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-500">
                Recent pages will appear here.
              </p>
            )
          ) : (
            <div className="flex flex-col gap-2">
              {canSaveCurrentSearch && (
                <button type="button" onClick={handleSaveCurrentSearch} className="cursor-pointer rounded-xl border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                  Save this search
                </button>
              )}
              {savedSearches.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {savedSearches.map((savedSearch) => (
                    <div key={savedSearch.id} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <button
                        type="button"
                        onClick={() => handleApplySavedSearch(savedSearch)}
                        className="w-full cursor-pointer rounded-xl border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:flex-1"
                      >
                        {savedSearch.label}
                      </button>
                      <button type="button" onClick={() => handleRemoveSavedSearch(savedSearch.id)} className="cursor-pointer rounded-lg border border-slate-200 px-2 py-2 text-xs text-slate-600 self-end sm:self-auto" aria-label="Remove saved search">
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-500">
                  Save a search from the home page to reuse it.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export type { QuickLink, SavedSearch, HomeFilters }
