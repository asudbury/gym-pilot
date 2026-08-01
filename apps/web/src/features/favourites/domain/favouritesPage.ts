import { type QuickLink } from './quickLinks'
import {
  groupFavoritesByFolder,
  normalizeFolderName,
  sortQuickLinks,
} from './quickLinks'

type FavouritesPageViewModel = {
  folderOptions: string[]
  groupedFavorites: Array<[string, QuickLink[]]>
}

export function resolveFavouritesPageViewModel(
  favorites: QuickLink[],
  folders: string[],
): FavouritesPageViewModel {
  const sortedFavorites = sortQuickLinks(favorites)
  const folderOptions = getFolderOptions(folders, sortedFavorites)
  const groupedFavorites = groupFavoritesByFolder(sortedFavorites)

  return {
    folderOptions,
    groupedFavorites,
  }
}

function getFolderOptions(folders: string[], favorites: QuickLink[]) {
  const names = new Set<string>(folders)

  favorites.forEach((link) => {
    const folderName = normalizeFolderName(link.folder ?? '')

    if (folderName) {
      names.add(folderName)
    }
  })

  return Array.from(names).sort((left, right) => left.localeCompare(right))
}
