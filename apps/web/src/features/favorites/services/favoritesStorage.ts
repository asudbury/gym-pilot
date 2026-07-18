import { loadJsonRecord, saveJsonRecord } from '@gym-pilot/shared'
import { FAVORITES_KEY } from '../../../constants/storageKeys'
import { normalizeFavoritesState, type FavoritesStorageValue } from '../domain/quickLinks'

export async function loadFavoritesStorage(): Promise<FavoritesStorageValue> {
  const storedValue = await loadJsonRecord<unknown>(FAVORITES_KEY, { favorites: [], folders: [] })
  return normalizeFavoritesState(storedValue)
}

export async function saveFavoritesStorage(value: FavoritesStorageValue) {
  await saveJsonRecord(FAVORITES_KEY, value)
}
