import { normalizeFavouritesState, type FavouritesStorageValue } from '../domain/quickLinks'
import { loadFavouritesStorageWithRepository, saveFavouritesStorageWithRepository } from './favouritesRepository'

export async function loadFavouritesStorage(): Promise<FavouritesStorageValue> {
  const storedValue = await loadFavouritesStorageWithRepository()
  return normalizeFavouritesState(storedValue)
}

export async function saveFavouritesStorage(value: FavouritesStorageValue) {
  await saveFavouritesStorageWithRepository(value)
}
