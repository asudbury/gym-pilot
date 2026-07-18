import { createPersistenceRepository, isSupabasePersistenceEnabled, loadSupabaseJsonRecord, removeSupabaseJsonRecord, saveSupabaseJsonRecord } from '@gym-pilot/shared'
import { loadJsonRecord as loadDexieJsonRecord, saveJsonRecord as saveDexieJsonRecord, removeJsonRecord as removeDexieJsonRecord } from '@gym-pilot/shared'
import { type AuthUser } from '../domain/authTypes'

const SESSION_STORAGE_KEY = 'gym-pilot-auth-session'

export function createAuthSessionRepository() {
  return createPersistenceRepository({
    loadLocal: async <T>(key: string, fallback: T) => {
      if (key !== SESSION_STORAGE_KEY) {
        return fallback
      }

      return loadDexieJsonRecord<T>(key, fallback)
    },
    saveLocal: async <T>(key: string, value: T) => {
      if (key !== SESSION_STORAGE_KEY) {
        return
      }

      await saveDexieJsonRecord(key, value)
    },
    removeLocal: async (key: string) => {
      if (key !== SESSION_STORAGE_KEY) {
        return
      }

      await removeDexieJsonRecord(key)
    },
    listLocal: async () => [],
    loadRemote: async <T>(key: string) => {
      if (key !== SESSION_STORAGE_KEY) {
        return { found: false, value: null }
      }

      if (!isSupabasePersistenceEnabled()) {
        return { found: false, value: null }
      }

      return loadSupabaseJsonRecord<T>(key)
    },
    saveRemote: async <T>(key: string, value: T) => {
      if (key !== SESSION_STORAGE_KEY) {
        return
      }

      if (!isSupabasePersistenceEnabled()) {
        return
      }

      await saveSupabaseJsonRecord(key, value)
    },
    removeRemote: async (key: string) => {
      if (key !== SESSION_STORAGE_KEY) {
        return
      }

      if (!isSupabasePersistenceEnabled()) {
        return
      }

      await removeSupabaseJsonRecord(key)
    },
    isRemoteEnabled: () => isSupabasePersistenceEnabled(),
    shouldUseRemoteForKey: (key: string) => key === SESSION_STORAGE_KEY,
  })
}

export async function loadAuthSessionWithRepository(): Promise<AuthUser | null> {
  const repository = createAuthSessionRepository()
  const stored = await repository.load<Partial<AuthUser> | null>(SESSION_STORAGE_KEY, null)

  if (!stored?.id || !stored?.name || !stored?.slug) {
    return null
  }

  return stored as AuthUser
}

export async function saveAuthSessionWithRepository(user: AuthUser | null) {
  const repository = createAuthSessionRepository()
  await repository.save(SESSION_STORAGE_KEY, user)
}
