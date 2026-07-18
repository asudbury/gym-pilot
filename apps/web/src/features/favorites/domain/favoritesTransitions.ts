export type FavoritesTransitionState = {
  favorites: Array<{ id: string; label: string; path: string; folder?: string }>
  folders: string[]
}

export function resolveFavoritesHydrationState(storedValue: unknown): FavoritesTransitionState {
  const normalizedValue = storedValue && typeof storedValue === 'object'
    ? storedValue as { favorites?: Array<{ id?: string; label?: string; path?: string; folder?: string }>; folders?: string[] }
    : { favorites: [] as Array<{ id?: string; label?: string; path?: string; folder?: string }>, folders: [] as string[] }

  return {
    favorites: (normalizedValue.favorites ?? []).filter((item) => item.id && item.label && item.path).map((item) => ({
      id: item.id ?? '',
      label: item.label ?? '',
      path: item.path ?? '',
      folder: item.folder,
    })),
    folders: (normalizedValue.folders ?? []).filter((value): value is string => typeof value === 'string'),
  }
}

export function resolveFavoritesPersistenceState(state: FavoritesTransitionState) {
  return {
    favorites: state.favorites.map((item) => ({ id: item.id, label: item.label, path: item.path, folder: item.folder })),
    folders: state.folders,
  }
}
