import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getToneClass } from './toneClasses'
import { classNames, exercises, exercisesSchema } from '@gym-pilot/shared'
import { formatLabel } from '../utils/formatUtils'
import { QUICK_LINKS_FAVORITES_STORAGE_KEY } from '../constants/storageKeys'

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

type FavouriteLinksMenuProps = {
  favorites: QuickLink[]
  homeFilters: HomeFilters
  variant?: 'header' | 'menu'
  onFavoritesChange: (favorites: QuickLink[]) => void
  onHomeFiltersChange: (filters: HomeFilters) => void
  onMenuOpenChange?: (open: boolean) => void
}

function getQuickLinkForPath(pathname: string, exerciseLookup: Map<string, { id: string; name: string }>): QuickLink | null {
  if (pathname === '/') {
    return { id: 'home', label: 'Home', path: '/' }
  }

  if (pathname === '/plans') {
    return { id: 'plans', label: 'Plans', path: '/plans' }
  }

  if (pathname === '/plans/new') {
    return { id: 'new-plan', label: 'New plan', path: '/plans/new' }
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

  if (pathname.startsWith('/plans/')) {
    return { id: pathname, label: 'Plan', path: pathname }
  }

  return { id: pathname, label: pathname, path: pathname }
}

export function FavouriteLinksMenu({
  favorites,
  variant = 'menu',
  onFavoritesChange,
  onMenuOpenChange,
}: FavouriteLinksMenuProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    window.localStorage.setItem(QUICK_LINKS_FAVORITES_STORAGE_KEY, JSON.stringify(favorites))
  }, [favorites])

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
  const isCurrentPageFavorite = currentQuickLink ? favorites.some((item) => item.path === currentQuickLink.path) : false

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

  const triggerClassName = classNames(
    variant === 'header'
      ? getToneClass('default', 'w-full px-4 py-2 text-left text-sm font-medium')
      : classNames(
        'w-full cursor-pointer rounded-xl px-3 py-2 text-left text-sm font-medium transition',
        menuOpen ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50',
      ),
  )

  return (
    <div className="relative">
      <button
        id="quick-links-trigger"
        type="button"
        onClick={() => setMenuOpen((current) => !current)}
        className={triggerClassName}
      >
        <span>Favourites</span>
        <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-slate-900/10 px-2 py-0.5 text-xs font-semibold text-slate-700">
          {favorites.length}
        </span>
      </button>
      {menuOpen && (
        <div id="quick-links-menu" className="fixed inset-x-3 top-16 z-40 max-h-[min(75vh,32rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-xl sm:absolute sm:right-0 sm:left-auto sm:top-full sm:mt-2 sm:w-80 sm:max-w-[calc(100vw-2rem)]">
          <div className="mb-3 flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">Favourites</p>
            </div>
            <button
              type="button"
              onClick={handleToggleCurrentFavorite}
              className={getToneClass('default', 'cursor-pointer px-3 py-1.5 text-xs font-medium')}
            >
              {isCurrentPageFavorite ? 'Added' : 'Add'}
            </button>
          </div>

          {favorites.length > 0 ? (
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
          )}
        </div>
      )}
    </div>
  )
}

export type { QuickLink, SavedSearch, HomeFilters }
