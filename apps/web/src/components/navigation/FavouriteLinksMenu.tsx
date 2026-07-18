import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getToneClass } from '../toneClasses'
import { classNames, exercises, exercisesSchema } from '@gym-pilot/shared'
import { getQuickLinkForPath, groupFavoritesByFolder, normalizeFolderName, sortFavorites, type QuickLink } from '../../utils/favouriteUtils'
import { normalizeFolderName as normalizeFavoriteFolderName, sortQuickLinks } from '../../features/favorites/domain/quickLinks'

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
  folders: string[]
  homeFilters: HomeFilters
  variant?: 'header' | 'menu'
  onFavoritesChange: (favorites: QuickLink[]) => void
  onFoldersChange: (folders: string[]) => void
  onHomeFiltersChange: (filters: HomeFilters) => void
  onMenuOpenChange?: (open: boolean) => void
}

export function FavouriteLinksMenu({
  favorites,
  folders,
  variant = 'menu',
  onFavoritesChange,
  onMenuOpenChange,
}: FavouriteLinksMenuProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState('')

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
    const handleOpenRequest = () => {
      setMenuOpen(true)
    }

    window.addEventListener('gym-pilot-open-favourites-menu', handleOpenRequest)

    return () => {
      window.removeEventListener('gym-pilot-open-favourites-menu', handleOpenRequest)
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

  const currentQuickLink = useMemo(() => getQuickLinkForPath(location.pathname, exerciseLookup), [exerciseLookup, location.pathname])
  const favoriteGroups = useMemo(() => {
    const groups = groupFavoritesByFolder(favorites)
    const folderGroups = folders.map((folderName) => [folderName, [] as QuickLink[]] as const)
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

    const existingFavorite = favorites.find((item) => item.path === currentQuickLink.path)
    const folderName = normalizeFolderName(existingFavorite?.folder ?? '')

    setSelectedFolder(folderName)
  }, [currentQuickLink, favorites, menuOpen])

  const handleUpdateFavoriteLink = (link: QuickLink, folderName?: string) => {
    const normalizedFolder = normalizeFavoriteFolderName(folderName ?? '') || undefined
    const alreadySaved = favorites.some((item) => item.path === link.path)

    if (alreadySaved) {
      onFavoritesChange(
        sortFavorites(
          favorites.map((item) => (item.path === link.path ? { ...item, folder: normalizedFolder } : item)),
        ),
      )
      return
    }

    const nextFavorites = sortQuickLinks([...favorites, { ...link, folder: normalizedFolder }]).slice(0, 12)

    onFavoritesChange(nextFavorites)
  }

  const handleRemoveFavoriteLink = (link: QuickLink) => {
    onFavoritesChange(sortQuickLinks(favorites.filter((item) => item.path !== link.path)))
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
      </button>
      {menuOpen && (
        <div id="quick-links-menu" className="fixed inset-x-3 top-16 z-40 max-h-[min(75vh,32rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-xl sm:absolute sm:right-0 sm:left-auto sm:top-full sm:mt-2 sm:w-80 sm:max-w-[calc(100vw-2rem)]">
          <div className="mb-3 flex flex-col gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">Manage favourites</p>
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
                <button
                  type="button"
                  onClick={handleToggleCurrentFavorite}
                  className={getToneClass('blue', 'cursor-pointer px-3 py-1.5 text-xs font-medium')}
                >
                  Add to favourites
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenFavouritesPage}
              className={getToneClass('default', 'w-fit cursor-pointer px-3 py-2 text-xs font-medium')}
              >
              Open favourites page
            </button>
          </div>

          {favorites.length > 0 ? (
            <div className="flex flex-col gap-3">
              {favoriteGroups.map(([folderName, items]) => (
                <div key={folderName} className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                  <div className="mb-2 px-1 text-xs font-semibold tracking-wide text-slate-500">
                    {folderName === 'No folder' ? 'No folder' : folderName}
                  </div>
                  <div className="ml-2 flex flex-col gap-2 border-l border-slate-200 pl-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2 sm:flex-row sm:items-center">
                        <button
                          type="button"
                          onClick={() => handleOpenQuickLink(item)}
                          className="w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 sm:flex-1"
                        >
                          {item.label}
                        </button>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button type="button" onClick={() => handleRemoveFavoriteLink(item)} className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-600" aria-label="Remove favorite">
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            null
          )}
        </div>
      )}
    </div>
  )
}

export type { QuickLink, SavedSearch, HomeFilters }
