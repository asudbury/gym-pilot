import { classNames, exercises, exercisesSchema } from '@gym-pilot/shared'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { HOME_FILTER_KEY } from '../../constants/storageKeys'
import {
  normalizeFolderName as normalizeFavoriteFolderName,
  sortQuickLinks,
} from '../../features/favourites/domain/quickLinks'
import { useFavouritesFeature } from '../../features/favourites/hooks/useFavouritesFeature'
import { normalizeHomeFilters } from '../../utils/appUtils'
import {
  getQuickLinkForPath,
  groupFavoritesByFolder,
  normalizeFolderName,
  sortFavorites,
  type QuickLink,
} from '../../utils/favouriteUtils'
import { getToneClass } from '../toneClasses'
import { Button } from '../ui/Button'
import { DecorativeIcon } from '../ui/DecorativeIcon'
import {
  navigationItemBaseClassName,
  navigationItemIconClassName,
} from './navigationItemStyles'

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
  variant?: 'header' | 'menu'
  onMenuOpenChange?: (open: boolean) => void
}

export function FavouriteLinksMenu({
  variant = 'menu',
  onMenuOpenChange,
}: FavouriteLinksMenuProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState('')
  const { favorites, folders, setFavorites } = useFavouritesFeature()
  const [homeFilters] = useState<HomeFilters>(() => {
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

  useEffect(() => {
    window.sessionStorage.setItem(
      HOME_FILTER_KEY,
      JSON.stringify(normalizeHomeFilters(homeFilters)),
    )
  }, [homeFilters])

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

      if (
        menu &&
        trigger &&
        !menu.contains(target) &&
        !trigger.contains(target)
      ) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handleOutsideClick)

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick)
    }
  }, [menuOpen])

  useEffect(() => {
    const handleOpenRequest = () => {
      setMenuOpen(true)
    }

    window.addEventListener('gym-pilot-open-favourites-menu', handleOpenRequest)

    return () => {
      window.removeEventListener(
        'gym-pilot-open-favourites-menu',
        handleOpenRequest,
      )
    }
  }, [])

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

  const currentQuickLink = useMemo(
    () => getQuickLinkForPath(location.pathname, exerciseLookup),
    [exerciseLookup, location.pathname],
  )
  const favoriteGroups = useMemo(() => {
    const groups = groupFavoritesByFolder(favorites)
    const folderGroups = folders.map(
      (folderName) => [folderName, [] as QuickLink[]] as const,
    )
    const merged = new Map<string, QuickLink[]>(groups)

    folderGroups.forEach(([folderName]) => {
      if (!merged.has(folderName)) {
        merged.set(folderName, [])
      }
    })

    return Array.from(merged.entries()).sort(([leftName], [rightName]) => {
      if (leftName === 'Unfiled') {
        return 1
      }

      if (rightName === 'Unfiled') {
        return -1
      }

      return leftName.localeCompare(rightName)
    })
  }, [favorites, folders])

  const folderOptions = useMemo(() => {
    const options = new Set<string>(folders)

    favorites.forEach((item) => {
      const folderName = normalizeFolderName(item.folder ?? '')

      if (folderName) {
        options.add(folderName)
      }
    })

    return Array.from(options).sort((left, right) => left.localeCompare(right))
  }, [favorites, folders])

  useEffect(() => {
    if (!menuOpen || !currentQuickLink) {
      return
    }

    const existingFavorite = favorites.find(
      (item) => item.path === currentQuickLink.path,
    )
    const folderName = normalizeFolderName(existingFavorite?.folder ?? '')

    setSelectedFolder(folderName)
  }, [currentQuickLink, favorites, menuOpen])

  const handleUpdateFavoriteLink = (link: QuickLink, folderName?: string) => {
    const normalizedFolder =
      normalizeFavoriteFolderName(folderName ?? '') || undefined
    const alreadySaved = favorites.some((item) => item.path === link.path)

    if (alreadySaved) {
      setFavorites(
        sortFavorites(
          favorites.map((item) =>
            item.path === link.path
              ? { ...item, folder: normalizedFolder }
              : item,
          ),
        ),
      )
      return
    }

    const nextFavorites = sortQuickLinks([
      ...favorites,
      { ...link, folder: normalizedFolder },
    ]).slice(0, 12)

    setFavorites(nextFavorites)
  }

  const handleRemoveFavoriteLink = (link: QuickLink) => {
    setFavorites(
      sortQuickLinks(favorites.filter((item) => item.path !== link.path)),
    )
  }

  const handleToggleCurrentFavorite = () => {
    if (!currentQuickLink) {
      return
    }

    handleUpdateFavoriteLink(currentQuickLink, selectedFolder)
  }

  const handleOpenQuickLink = (link: QuickLink) => {
    navigate(link.path)
    setMenuOpen(false)
  }

  const handleOpenFavouritesPage = () => {
    navigate('/favourites')
    setMenuOpen(false)
  }

  const triggerClassName = classNames(
    navigationItemBaseClassName,
    variant === 'menu' ? 'w-full' : '',
    menuOpen ? 'bg-slate-100' : '',
  )

  return (
    <div className="relative">
      <button
        id="quick-links-trigger"
        type="button"
        onClick={() => setMenuOpen((current) => !current)}
        className={triggerClassName}
      >
        <span className={navigationItemIconClassName}>
          <DecorativeIcon icon="star" className="h-4 w-4" />
        </span>
        <span className="leading-none">Favourites</span>
      </button>
      {menuOpen && (
        <div
          id="quick-links-menu"
          className="fixed inset-x-3 top-16 z-40 max-h-[min(75vh,32rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-xl sm:absolute sm:right-0 sm:left-auto sm:top-full sm:mt-2 sm:w-80 sm:max-w-[calc(100vw-2rem)]"
        >
          <div className="mb-3 flex flex-col gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  Manage favourites
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <span className="sr-only">Folder</span>
                  <select
                    value={selectedFolder}
                    onChange={(event) => setSelectedFolder(event.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
                  >
                    <option value="">Select folder</option>
                    {folderOptions.map((folderOption) => (
                      <option key={folderOption} value={folderOption}>
                        {folderOption}
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  onClick={handleToggleCurrentFavorite}
                  className={getToneClass(
                    'blue',
                    'px-3 py-1.5 text-xs font-medium',
                  )}
                >
                  Add to favourites
                </Button>
              </div>
            </div>
            <Button
              onClick={handleOpenFavouritesPage}
              className={getToneClass(
                'default',
                'w-fit px-3 py-2 text-xs font-medium',
              )}
            >
              Open favourites page
            </Button>
          </div>

          {favorites.length > 0 ? (
            <div className="flex flex-col gap-3">
              {favoriteGroups.map(([folderName, items]) => (
                <div
                  key={folderName}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-2"
                >
                  <div className="mb-2 px-1 text-xs font-semibold tracking-wide text-slate-500">
                    {folderName === 'No folder' ? 'No folder' : folderName}
                  </div>
                  <div className="ml-2 flex flex-col gap-2 border-l border-slate-200 pl-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2 sm:flex-row sm:items-center"
                      >
                        <Button
                          onClick={() => handleOpenQuickLink(item)}
                          className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 sm:flex-1"
                        >
                          {item.label}
                        </Button>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <Button
                            onClick={() => handleRemoveFavoriteLink(item)}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-600"
                            aria-label="Remove favorite"
                          >
                            ✕
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

export type { HomeFilters, QuickLink, SavedSearch }
