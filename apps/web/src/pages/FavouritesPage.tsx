import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { QuickLink } from '../components/FavouriteLinksMenu'
import { getToneClass } from '../components/toneClasses'
import { PageCardLayout } from '../layouts/PageCardLayout'
import { PageLayout } from '../layouts/PageLayout'

type FavouritesPageProps = {
  favorites: QuickLink[]
  folders: string[]
  onFoldersChange: (folders: string[]) => void
  onFavoritesChange: (favorites: QuickLink[]) => void
}

function sortFavorites(items: QuickLink[]) {
  return [...items].sort((left, right) => {
    const leftLabel = left.label.toLowerCase()
    const rightLabel = right.label.toLowerCase()

    if (leftLabel < rightLabel) {
      return -1
    }

    if (leftLabel > rightLabel) {
      return 1
    }

    return left.path.localeCompare(right.path)
  })
}

function normalizeFolderName(value: string) {
  return value.trim()
}

export function FavouritesPage({ favorites, folders, onFoldersChange, onFavoritesChange }: FavouritesPageProps) {
  const navigate = useNavigate()
  const [newFolderName, setNewFolderName] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})

  const sortedFavorites = useMemo(() => sortFavorites(favorites), [favorites])

  const folderOptions = useMemo(() => {
    const names = new Set<string>(folders)

    sortedFavorites.forEach((link) => {
      const folderName = normalizeFolderName(link.folder ?? '')

      if (folderName) {
        names.add(folderName)
      }
    })

    return Array.from(names).sort((left, right) => left.localeCompare(right))
  }, [folders, sortedFavorites])

  const groupedFavorites = useMemo(() => {
    const folderNames = new Set<string>()
    const hasUnfiledFavorites = sortedFavorites.some((link) => !normalizeFolderName(link.folder ?? ''))

    folders.forEach((folderName) => {
      const normalized = normalizeFolderName(folderName)

      if (normalized) {
        folderNames.add(normalized)
      }
    })

    sortedFavorites.forEach((link) => {
      const folderName = normalizeFolderName(link.folder ?? '')

      if (folderName) {
        folderNames.add(folderName)
        return
      }

      if (hasUnfiledFavorites) {
        folderNames.add('No folder')
      }
    })

    const groups = new Map<string, QuickLink[]>()

    Array.from(folderNames).forEach((folderName) => {
      groups.set(folderName, [])
    })

    sortedFavorites.forEach((link) => {
      const folderName = normalizeFolderName(link.folder ?? '') || 'No folder'

      if (!groups.has(folderName)) {
        groups.set(folderName, [])
      }

      groups.get(folderName)?.push(link)
    })

    return Array.from(groups.entries()).sort(([leftName], [rightName]) => {
      if (leftName === 'No folder') {
        return 1
      }

      if (rightName === 'No folder') {
        return -1
      }

      return leftName.localeCompare(rightName)
    })
  }, [folders, sortedFavorites])

  const toggleFolder = (folderName: string) => {
    setExpandedFolders((current) => ({
      ...current,
      [folderName]: !current[folderName],
    }))
  }

  const handleCreateFolder = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const folderName = normalizeFolderName(newFolderName)

    if (!folderName) {
      return
    }

    onFoldersChange(Array.from(new Set([...folders, folderName])).sort((left, right) => left.localeCompare(right)))
    setExpandedFolders((current) => ({ ...current, [folderName]: true }))
    setNewFolderName('')
  }

  const handleMoveLink = (link: QuickLink, folderName: string) => {
    const normalizedFolder = normalizeFolderName(folderName)

    onFavoritesChange(
      sortFavorites(
        favorites.map((item) => (item.path === link.path ? { ...item, folder: normalizedFolder || undefined } : item)),
      ),
    )
  }

  const handleDeleteFolder = (folderName: string) => {
    const normalizedFolder = normalizeFolderName(folderName)

    if (!normalizedFolder || normalizedFolder === 'Unfiled') {
      return
    }

    onFavoritesChange(
      sortFavorites(
        favorites.map((item) => (item.folder === normalizedFolder ? { ...item, folder: undefined } : item)),
      ),
    )

    onFoldersChange(folders.filter((name) => normalizeFolderName(name) !== normalizedFolder))
    setExpandedFolders((current) => {
      const next = { ...current }
      delete next[normalizedFolder]
      return next
    })
  }

  const handleOpenLink = (link: QuickLink) => {
    navigate(link.path)
  }

  const handleRemoveLink = (link: QuickLink) => {
    onFavoritesChange(sortFavorites(favorites.filter((item) => item.path !== link.path)))
  }

  return (
    <PageLayout>
      <PageCardLayout
        title="Favourites"
        subtitle="Your saved shortcuts"
        description="Group favourite pages into folders so they are easier to manage."
      >
        <div className="flex flex-col gap-4">
          <form onSubmit={handleCreateFolder} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="new-folder-name" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Create folder
              </label>
              <input
                id="new-folder-name"
                value={newFolderName}
                onChange={(event) => setNewFolderName(event.target.value)}
                placeholder="e.g. Workout plans"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none ring-0 focus:border-slate-400"
              />
            </div>
            <button
              type="submit"
              className={getToneClass('default', 'rounded-xl px-4 py-2 text-sm font-medium')}
            >
              Add folder
            </button>
          </form>

          {groupedFavorites.length > 0 ? (
            <div className="flex flex-col gap-3">
              {groupedFavorites.map(([folderName, items]) => {
                const isCollapsed = folderName === 'No folder' && expandedFolders[folderName] !== true

                return (
                  <div key={folderName} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => toggleFolder(folderName)}
                        className="flex items-center gap-2 text-left text-sm font-semibold tracking-wide text-slate-600"
                      >
                        <span className="text-base text-slate-400">{isCollapsed ? '▶' : '▼'}</span>
                        <span>{folderName}</span>
                      </button>
                      <div className="flex items-center gap-2">
                        {folderName !== 'No folder' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteFolder(folderName)}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
                          >
                            Delete folder
                          </button>
                        )}
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{items.length}</span>
                      </div>
                    </div>
                    {!isCollapsed && (
                      <div className="ml-3 flex flex-col gap-2 border-l border-slate-200 pl-3">
                        {items.map((link) => (
                          <div key={link.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                            <button type="button" onClick={() => handleOpenLink(link)} className="flex-1 text-left">
                              <div className="text-sm font-semibold text-slate-900">{link.label}</div>
                              <div className="mt-1 text-xs text-slate-500">{link.path}</div>
                            </button>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <span className="sr-only">Folder</span>
                                <select
                                  value={normalizeFolderName(link.folder ?? '') || 'No folder'}
                                  onChange={(event) => handleMoveLink(link, event.target.value)}
                                  className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                                >
                                  <option value="">No folder</option>
                                  {folderOptions.map((folderOption) => (
                                    <option key={folderOption} value={folderOption}>
                                      {folderOption}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <button
                                type="button"
                                onClick={() => handleOpenLink(link)}
                                className={getToneClass('default', 'rounded-lg px-3 py-2 text-sm font-medium')}
                              >
                                Open
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveLink(link)}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
              No favourites yet. Add one from the header menu or create a folder to organise them.
            </div>
          )}
        </div>
      </PageCardLayout>
    </PageLayout>
  )
}
