export type QuickLink = {
  id: string
  label: string
  path: string
  folder?: string
}

export type FavoritesStorageValue = {
  favorites: QuickLink[]
  folders: string[]
}

export type HomeFilters = {
  searchTerm: string
  selectedCategory: string | null
  showImages: boolean
}

export function normalizeFavoriteStorageValue(value: unknown): FavoritesStorageValue {
  if (Array.isArray(value)) {
    return {
      favorites: value.filter((item): item is QuickLink => Boolean(item && typeof item === 'object' && typeof (item as QuickLink).path === 'string' && typeof (item as QuickLink).label === 'string')),
      folders: [],
    }
  }

  if (value && typeof value === 'object') {
    const candidate = value as Partial<FavoritesStorageValue>
    const folders = Array.isArray(candidate.folders)
      ? candidate.folders.filter((folder): folder is string => typeof folder === 'string' && folder.trim().length > 0)
      : []

    const favorites = Array.isArray(candidate.favorites)
      ? candidate.favorites.filter((item): item is QuickLink => Boolean(item && typeof item === 'object' && typeof (item as QuickLink).path === 'string' && typeof (item as QuickLink).label === 'string'))
      : []

    return {
      favorites,
      folders: Array.from(new Set(folders.map((folder) => folder.trim()))).sort((left, right) => left.localeCompare(right)),
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
  return [...items].sort((left, right) => left.label.localeCompare(right.label, undefined, { sensitivity: 'base' }))
}

export function formatDashboardTimestamp(value?: string | null) {
  if (!value) {
    return null
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate)
}
