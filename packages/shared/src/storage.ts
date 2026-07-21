import {
  loadJsonRecord as loadDexieJsonRecord,
  saveJsonRecord as saveDexieJsonRecord,
  removeJsonRecord as removeDexieJsonRecord,
  listJsonRecords as listDexieJsonRecords,
} from './dexie'
import {
  isSupabasePersistenceEnabled,
  loadSupabaseJsonRecord,
  removeSupabaseJsonRecord,
  saveSupabaseJsonRecord,
} from './gymPilotSupabase'
import { logger } from './logging'
import { createPersistenceRepository } from './repositories'

/**
 * Minimal persistence contract used by the shared storage helpers.
 */
export interface IPersistenceStore {
  load<T>(key: string, fallback: T): Promise<T>
  save<T>(key: string, value: T): Promise<void>
}

const LOCAL_ONLY_KEYS = new Set(['gym-pilot-auth-session'])

function shouldUseSupabaseForKey(key: string) {
  if (LOCAL_ONLY_KEYS.has(key)) {
    logger.info('[Storage] Skipping Supabase sync for local-only key', { key })
    return false
  }

  return true
}

/**
 * Local persistence adapter backed by IndexedDB through the Dexie helpers.
 */
export class DexiePersistence implements IPersistenceStore {
  async load<T>(key: string, fallback: T): Promise<T> {
    return loadJsonRecord<T>(key, fallback)
  }

  async save<T>(key: string, value: T): Promise<void> {
    await saveJsonRecord(key, value)
  }
}

const persistenceRepository = createPersistenceRepository({
  loadLocal: async <T>(key: string, fallback: T) => {
    logger.info('[Storage] Loading record', { key, fallback })
    return loadDexieJsonRecord<T>(key, fallback)
  },
  saveLocal: async <T>(key: string, value: T) => {
    logger.info('[Storage] Saving record', { key, value })
    await saveDexieJsonRecord(key, value)
    logger.info('[Storage] IndexedDB save completed', { key })
  },
  removeLocal: async (key: string) => {
    logger.info('[Storage] Removing record', { key })
    await removeDexieJsonRecord(key)
    logger.info('[Storage] IndexedDB remove completed', { key })
  },
  listLocal: async () => listDexieJsonRecords(),
  loadRemote: async <T>(key: string) => loadSupabaseJsonRecord<T>(key),
  saveRemote: async <T>(key: string, value: T) => {
    logger.info('[Storage] Supabase save completed', { key })
    await saveSupabaseJsonRecord(key, value)
  },
  removeRemote: async (key: string) => {
    await removeSupabaseJsonRecord(key)
  },
  isRemoteEnabled: () => isSupabasePersistenceEnabled(),
  shouldUseRemoteForKey: (key: string) => shouldUseSupabaseForKey(key),
})

/**
 * Loads a JSON record from the shared persistence layer, falling back to the
 * provided value if the record cannot be read.
 */
export async function loadJsonRecord<T>(key: string, fallback: T): Promise<T> {
  try {
    const localValue = await persistenceRepository.load<T>(key, fallback)
    return localValue
  } catch (error) {
    logger.error('Persistence load failed', key, error)
    return fallback
  }
}

/**
 * Saves a JSON record through the shared persistence repository.
 */
export async function saveJsonRecord<T>(key: string, value: T): Promise<void> {
  await persistenceRepository.save(key, value)
}

/**
 * Removes a JSON record from the shared persistence layer.
 */
export async function removeJsonRecord(key: string): Promise<void> {
  await persistenceRepository.remove(key)
}

/**
 * Lists the JSON records currently persisted through the shared repository.
 */
export async function listJsonRecords(): Promise<Array<{ key: string; value: unknown }>> {
  return persistenceRepository.list<Array<{ key: string; value: unknown }>>()
}
