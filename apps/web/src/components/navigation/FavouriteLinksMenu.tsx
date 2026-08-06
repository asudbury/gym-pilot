import { classNames } from '@gym-pilot/shared';
import { useMemo } from 'react';
import { useFavouriteLinksMenu } from '../../features/favourites/hooks/useFavouriteLinksMenu';
import { Button } from '../ui/Button';
import { DecorativeIcon } from '../ui/DecorativeIcon';
import {
    navigationItemBaseClassName,
    navigationItemIconClassName,
} from './navigationItemStyles';

type SavedSearch = {
  id: string
  label: string
  searchTerm: string
  selectedCategory: string | null
}

type FavouriteLinksMenuProps = {
  variant?: 'header' | 'menu'
  onMenuOpenChange?: (open: boolean) => void
}

export function FavouriteLinksMenu({
  variant = 'menu',
  onMenuOpenChange,
}: FavouriteLinksMenuProps) {
  const {
    menuOpen,
    setMenuOpen,
    selectedFolder,
    setSelectedFolder,
    favorites,
    favoriteGroups,
    folderOptions,
    isCurrentLinkFavorite,
    handleToggleCurrentFavorite,
    handleRemoveFavoriteLink,
    handleOpenQuickLink,
    handleOpenFavouritesPage,
  } = useFavouriteLinksMenu({ onMenuOpenChange })

  const triggerClassName = useMemo(() => {
    return classNames(
      navigationItemBaseClassName,
      variant === 'menu' ? 'w-full' : '',
      menuOpen ? 'bg-slate-100' : '',
    )
  }, [menuOpen, variant])

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
                  tone="chip"
                  className="text-xs font-medium"
                >
                  {isCurrentLinkFavorite
                    ? 'Remove from favourites'
                    : 'Add to favourites'}
                </Button>
              </div>
            </div>
            <Button
              onClick={handleOpenFavouritesPage}
              tone="chip"
              className="w-fit text-xs font-medium px-3 py-2"
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

export type { SavedSearch };
