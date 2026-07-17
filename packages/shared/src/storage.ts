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

export interface IPersistenceStore {
  load<T>(key: string, fallback: T): Promise<T>
  save<T>(key: string, value: T): Promise<void>
}

const LOCAL_ONLY_KEYS = new Set(['gym-pilot-auth-session', 'gym-pilot-auth-bypass'])

function shouldUseSupabaseForKey(key: string) {
  if (LOCAL_ONLY_KEYS.has(key)) {
    console.log('[Storage] Skipping Supabase sync for local-only key', { key })
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
  console.log('[Storage] Loading record', { key, fallback })

  try {
    const localValue = await loadDexieJsonRecord<T>(key, fallback)
    console.log('[Storage] Local IndexedDB value loaded', { key, localValue })

    if (isSupabasePersistenceEnabled() && shouldUseSupabaseForKey(key)) {
      try {
        const remote = await loadSupabaseJsonRecord<T>(key)
        console.log('[Storage] Supabase remote value loaded', { key, remote })

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

    if (isSupabasePersistenceEnabled() && shouldUseSupabaseForKey(key)) {
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
  console.log('[Storage] Saving record', { key, value })
  await saveDexieJsonRecord(key, value)
  console.log('[Storage] IndexedDB save completed', { key })

  if (isSupabasePersistenceEnabled() && shouldUseSupabaseForKey(key)) {
    try {
      await saveSupabaseJsonRecord(key, value)
      console.log('[Storage] Supabase save completed', { key })
    } catch (error) {
      console.error('Supabase persistence save failed, local IndexedDB remains updated', key, error)
    }
  }
}

export async function removeJsonRecord(key: string): Promise<void> {
  console.log('[Storage] Removing record', { key })

  if (isSupabasePersistenceEnabled() && shouldUseSupabaseForKey(key)) {
    try {
      await removeSupabaseJsonRecord(key)
      console.log('[Storage] Supabase remove completed', { key })
    } catch (error) {
      console.error('Supabase persistence remove failed', key, error)
    }
  }

  await removeDexieJsonRecord(key)
  console.log('[Storage] IndexedDB remove completed', { key })
}

export async function listJsonRecords() {
  return listDexieJsonRecords()
}
