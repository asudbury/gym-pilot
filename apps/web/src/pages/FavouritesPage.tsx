import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageCardLayout } from '../layouts/PageCardLayout'
import { PageLayout } from '../layouts/PageLayout'
import { CreateFolderForm } from '../components/CreateFolderForm'
import { FavouriteFolderGroup } from '../components/FavouriteFolderGroup'
import { normalizeFolderName, sortFavorites, type QuickLink } from '../utils/favouriteUtils'
import { resolveFavoritesPageViewModel } from '../features/favorites/domain/favoritesPage'

type FavouritesPageProps = {
  favorites: QuickLink[]
  folders: string[]
  onFoldersChange: (folders: string[]) => void
  onFavoritesChange: (favorites: QuickLink[]) => void
}

export function FavouritesPage({ favorites, folders, onFoldersChange, onFavoritesChange }: FavouritesPageProps) {
  const navigate = useNavigate()
  const [newFolderName, setNewFolderName] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})

  const viewModel = useMemo(() => resolveFavoritesPageViewModel(favorites, folders), [favorites, folders])
  const folderOptions = viewModel.folderOptions
  const groupedFavorites = viewModel.groupedFavorites

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
          <CreateFolderForm newFolderName={newFolderName} onNewFolderNameChange={setNewFolderName} onSubmit={handleCreateFolder} />

          {groupedFavorites.length > 0 ? (
            <div className="flex flex-col gap-3">
              {groupedFavorites.map(([folderName, items]) => (
                <FavouriteFolderGroup
                  key={folderName}
                  folderName={folderName}
                  items={items}
                  folderOptions={folderOptions}
                  isExpanded={expandedFolders[folderName] ?? true}
                  onToggle={toggleFolder}
                  onDeleteFolder={handleDeleteFolder}
                  onMoveLink={handleMoveLink}
                  onOpenLink={handleOpenLink}
                  onRemoveLink={handleRemoveLink}
                />
              ))}
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
