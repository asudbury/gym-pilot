import { normalizeFolderName, sortFavorites, type QuickLink } from '../../../utils/favouriteUtils'

export type FavouritesPageViewModel = {
  folderOptions: string[]
  groupedFavorites: Array<[string, QuickLink[]]>
}

export function resolveFavouritesPageViewModel(favorites: QuickLink[], folders: string[]): FavouritesPageViewModel {
  const sortedFavorites = sortFavorites(favorites)
  const folderOptions = getFolderOptions(folders, sortedFavorites)
  const groupedFavorites = groupFavorites(sortedFavorites, folders)

  return {
    folderOptions,
    groupedFavorites,
  }
}

export function getFolderOptions(folders: string[], favorites: QuickLink[]) {
  const names = new Set<string>(folders)

  favorites.forEach((link) => {
    const folderName = normalizeFolderName(link.folder ?? '')

    if (folderName) {
      names.add(folderName)
    }
  })

  return Array.from(names).sort((left, right) => left.localeCompare(right))
}

export function groupFavorites(favorites: QuickLink[], folders: string[]) {
  const folderNames = new Set<string>()
  const hasUnfiledFavorites = favorites.some((link) => !normalizeFolderName(link.folder ?? ''))

  folders.forEach((folderName) => {
    const normalized = normalizeFolderName(folderName)

    if (normalized) {
      folderNames.add(normalized)
    }
  })

  favorites.forEach((link) => {
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

  favorites.forEach((link) => {
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
}
