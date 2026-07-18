export type QuickLink = {
  id: string
  label: string
  path: string
  folder?: string
}

export type FavouritesStorageValue = {
  favorites: QuickLink[]
  folders: string[]
}

export type HomeFilters = {
  searchTerm: string
  selectedCategory: string | null
  showImages: boolean
}

export function normalizeFolderName(value: string) {
  return value.trim()
}

export function normalizeFavouriteStorageValue(value: unknown): FavouritesStorageValue {
  if (Array.isArray(value)) {
    return {
      favorites: value.filter((item): item is QuickLink => Boolean(item && typeof item === 'object' && typeof (item as QuickLink).path === 'string' && typeof (item as QuickLink).label === 'string')),
      folders: [],
    }
  }

  if (value && typeof value === 'object') {
    const candidate = value as Partial<FavouritesStorageValue>
    const folders = Array.isArray(candidate.folders)
      ? candidate.folders.filter((folder): folder is string => typeof folder === 'string' && folder.trim().length > 0)
      : []

    const favorites = Array.isArray(candidate.favorites)
      ? candidate.favorites.filter((item): item is QuickLink => Boolean(item && typeof item === 'object' && typeof (item as QuickLink).path === 'string' && typeof (item as QuickLink).label === 'string'))
      : []

    return {
      favorites: favorites.map((item) => ({
        ...item,
        folder: item.folder ? normalizeFolderName(item.folder) : undefined,
      })),
      folders: Array.from(new Set(folders.map((folder) => normalizeFolderName(folder)))).sort((left, right) => left.localeCompare(right)),
    }
  }

  return { favorites: [], folders: [] }
}

export function normalizeHomeFilters(filters: Partial<HomeFilters> | null | undefined): HomeFilters {
  const selectedCategory = filters?.selectedCategory

  return {
    searchTerm: typeof filters?.searchTerm === 'string' ? filters.searchTerm : '',
    selectedCategory: selectedCategory === null || selectedCategory === '' || selectedCategory === 'All' ? null : typeof selectedCategory === 'string' ? selectedCategory : null,
    showImages: typeof filters?.showImages === 'boolean' ? filters.showImages : true,
  }
}

export function sortQuickLinks(items: QuickLink[]) {
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

export function normalizeFavouritesState(value: unknown): FavouritesStorageValue {
  const normalized = normalizeFavouriteStorageValue(value)

  return {
    favorites: sortQuickLinks(normalized.favorites),
    folders: normalized.folders,
  }
}
