import { loadJsonRecord, saveJsonRecord } from '@gym-pilot/shared'
import { FAVORITES_KEY } from '../../../constants/storageKeys'
import { normalizeFavouritesState, type FavouritesStorageValue } from '../domain/quickLinks'

export async function loadFavouritesStorage(): Promise<FavouritesStorageValue> {
  const storedValue = await loadJsonRecord<unknown>(FAVORITES_KEY, { favorites: [], folders: [] })
  return normalizeFavouritesState(storedValue)
}

export async function saveFavouritesStorage(value: FavouritesStorageValue) {
  await saveJsonRecord(FAVORITES_KEY, value)
}
