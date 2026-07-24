import {
  createPersistenceRepository,
  type PersistenceRepository,
} from '@gym-pilot/shared'
import {
  loadJsonRecord as loadDexieJsonRecord,
  saveJsonRecord as saveDexieJsonRecord,
  removeJsonRecord as removeDexieJsonRecord,
} from '@gym-pilot/shared'
import {
  loadSupabaseJsonRecord,
  removeSupabaseJsonRecord,
  saveSupabaseJsonRecord,
} from '@gym-pilot/shared'
import { FAVORITES_KEY } from '../../../constants/storageKeys'
import {
  normalizeFavouritesState,
  type FavouritesStorageValue,
} from '../domain/quickLinks'

const LOCAL_ONLY_KEYS = new Set(['gym-pilot-auth-session'])

function shouldUseRemoteForKey(key: string) {
  return !LOCAL_ONLY_KEYS.has(key)
}

export function createFavouritesRepository(): PersistenceRepository {
  return createPersistenceRepository({
    loadLocal: async <T>(key: string, fallback: T) => {
      if (key !== FAVORITES_KEY) {
        return fallback
      }

      return loadDexieJsonRecord<T>(key, fallback)
    },
    saveLocal: async <T>(key: string, value: T) => {
      if (key !== FAVORITES_KEY) {
        return
      }

      await saveDexieJsonRecord(key, value)
    },
    removeLocal: async (key: string) => {
      if (key !== FAVORITES_KEY) {
        return
      }

      await removeDexieJsonRecord(key)
    },
    listLocal: async () => [],
    loadRemote: async <T>(key: string) => {
      if (key !== FAVORITES_KEY) {
        return { found: false, value: null }
      }

      return loadSupabaseJsonRecord<T>(key)
    },
    saveRemote: async <T>(key: string, value: T) => {
      if (key !== FAVORITES_KEY) {
        return
      }

      await saveSupabaseJsonRecord(key, value)
    },
    removeRemote: async (key: string) => {
      if (key !== FAVORITES_KEY) {
        return
      }

      await removeSupabaseJsonRecord(key)
    },
    isRemoteEnabled: () => true,
    shouldUseRemoteForKey,
  })
}

export async function loadFavouritesStorageWithRepository(): Promise<FavouritesStorageValue> {
  const repository = createFavouritesRepository()
  const storedValue = await repository.load<unknown>(FAVORITES_KEY, {
    favorites: [],
    folders: [],
  })
  return normalizeFavouritesState(storedValue)
}

export async function saveFavouritesStorageWithRepository(
  value: FavouritesStorageValue,
) {
  const repository = createFavouritesRepository()
  await repository.save(FAVORITES_KEY, value)
}
