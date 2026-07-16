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
} from './supabase'

export interface IPersistenceStore {
  load<T>(key: string, fallback: T): Promise<T>
  save<T>(key: string, value: T): Promise<void>
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
  try {
    const localValue = await loadDexieJsonRecord<T>(key, fallback)

    if (isSupabasePersistenceEnabled()) {
      try {
        const remote = await loadSupabaseJsonRecord<T>(key)

        if (remote.found && remote.value !== null) {
          return remote.value as T
        }
      } catch (error) {
        console.error('Supabase persistence load failed, using IndexedDB cache', key, error)
      }
    }

    return localValue
  } catch (error) {
    console.error('IndexedDB persistence load failed', key, error)

    if (isSupabasePersistenceEnabled()) {
      try {
        const remote = await loadSupabaseJsonRecord<T>(key)

        if (remote.found && remote.value !== null) {
          return remote.value as T
        }
      } catch (remoteError) {
        console.error('Supabase persistence load failed after IndexedDB error', key, remoteError)
      }
    }

    return fallback
  }
}

export async function saveJsonRecord<T>(key: string, value: T): Promise<void> {
  await saveDexieJsonRecord(key, value)

  if (isSupabasePersistenceEnabled()) {
    try {
      await saveSupabaseJsonRecord(key, value)
    } catch (error) {
      console.error('Supabase persistence save failed, local IndexedDB remains updated', key, error)
    }
  }
}

export async function removeJsonRecord(key: string): Promise<void> {
  if (isSupabasePersistenceEnabled()) {
    try {
      await removeSupabaseJsonRecord(key)
    } catch (error) {
      console.error('Supabase persistence remove failed', key, error)
    }
  }

  await removeDexieJsonRecord(key)
}

export async function listJsonRecords() {
  return listDexieJsonRecords()
}
