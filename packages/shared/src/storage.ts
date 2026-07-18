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

export interface IPersistenceStore {
  load<T>(key: string, fallback: T): Promise<T>
  save<T>(key: string, value: T): Promise<void>
}

const LOCAL_ONLY_KEYS = new Set(['gym-pilot-auth-session', 'gym-pilot-auth-bypass'])

function shouldUseSupabaseForKey(key: string) {
  if (LOCAL_ONLY_KEYS.has(key)) {
    logger.info('[Storage] Skipping Supabase sync for local-only key', { key })
    return false
  }

  return true
}

export class DexiePersistence implements IPersistenceStore {
  async load<T>(key: string, fallback: T): Promise<T> {
    return loadJsonRecord<T>(key, fallback)
  }

  async save<T>(key: string, value: T): Promise<void> {
    await saveJsonRecord(key, value)
  }
}

export async function loadJsonRecord<T>(key: string, fallback: T): Promise<T> {
  logger.info('[Storage] Loading record', { key, fallback })

  try {
    const localValue = await loadDexieJsonRecord<T>(key, fallback)
    logger.info('[Storage] Local IndexedDB value loaded', { key, localValue })

    if (isSupabasePersistenceEnabled() && shouldUseSupabaseForKey(key)) {
      try {
        const remote = await loadSupabaseJsonRecord<T>(key)
        logger.info('[Storage] Supabase remote value loaded', { key, remote })

        if (remote.found && remote.value !== null) {
          return remote.value as T
        }
      } catch (error) {
        logger.error('Supabase persistence load failed, using IndexedDB cache', key, error)
      }
    }

    return localValue
  } catch (error) {
    logger.error('IndexedDB persistence load failed', key, error)

    if (isSupabasePersistenceEnabled() && shouldUseSupabaseForKey(key)) {
      try {
        const remote = await loadSupabaseJsonRecord<T>(key)

        if (remote.found && remote.value !== null) {
          return remote.value as T
        }
      } catch (remoteError) {
        logger.error('Supabase persistence load failed after IndexedDB error', key, remoteError)
      }
    }

    return fallback
  }
}

export async function saveJsonRecord<T>(key: string, value: T): Promise<void> {
  logger.info('[Storage] Saving record', { key, value })
  await saveDexieJsonRecord(key, value)
  logger.info('[Storage] IndexedDB save completed', { key })

  if (isSupabasePersistenceEnabled() && shouldUseSupabaseForKey(key)) {
    try {
      await saveSupabaseJsonRecord(key, value)
      logger.info('[Storage] Supabase save completed', { key })
    } catch (error) {
      logger.error('Supabase persistence save failed, local IndexedDB remains updated', key, error)
    }
  }
}

export async function removeJsonRecord(key: string): Promise<void> {
  logger.info('[Storage] Removing record', { key })

  if (isSupabasePersistenceEnabled() && shouldUseSupabaseForKey(key)) {
    try {
      await removeSupabaseJsonRecord(key)
      logger.info('[Storage] Supabase remove completed', { key })
    } catch (error) {
      logger.error('Supabase persistence remove failed', key, error)
    }
  }

  await removeDexieJsonRecord(key)
  logger.info('[Storage] IndexedDB remove completed', { key })
}

export async function listJsonRecords() {
  return listDexieJsonRecords()
}
