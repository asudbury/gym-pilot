export type RemoteRecordResponse<T> = {
  found: boolean
  value: T | null
}

export type PersistenceRepositoryDependencies<TLocalResponse = unknown> = {
  loadLocal: <T>(key: string, fallback: T) => Promise<T>
  saveLocal: <T>(key: string, value: T) => Promise<void>
  removeLocal: (key: string) => Promise<void>
  listLocal: () => Promise<TLocalResponse>
  loadRemote: <T>(key: string) => Promise<RemoteRecordResponse<T>>
  saveRemote: <T>(key: string, value: T) => Promise<void>
  removeRemote: (key: string) => Promise<void>
  isRemoteEnabled: () => boolean
  shouldUseRemoteForKey: (key: string) => boolean
}

export interface PersistenceRepository<TListResponse = unknown> {
  load<T>(key: string, fallback: T): Promise<T>
  save<T>(key: string, value: T): Promise<void>
  remove(key: string): Promise<void>
  list<TResponse = TListResponse>(): Promise<TResponse>
}

function areValuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true
  }

  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch {
    return false
  }
}

export function createPersistenceRepository<TListResponse = unknown>(dependencies: PersistenceRepositoryDependencies<TListResponse>): PersistenceRepository<TListResponse> {
  const { loadLocal, saveLocal, removeLocal, listLocal, loadRemote, saveRemote, removeRemote, isRemoteEnabled, shouldUseRemoteForKey } = dependencies
  const lastSavedValues = new Map<string, unknown>()

  return {
    async load<T>(key: string, fallback: T): Promise<T> {
      try {
        const localValue = await loadLocal<T>(key, fallback)

        if (isRemoteEnabled() && shouldUseRemoteForKey(key)) {
          try {
            const remote = await loadRemote<T>(key)

            if (remote.found && remote.value !== null) {
              return remote.value as T
            }
          } catch {
            // fall back to the local value
          }
        }

        return localValue
      } catch (error) {
        if (isRemoteEnabled() && shouldUseRemoteForKey(key)) {
          try {
            const remote = await loadRemote<T>(key)

            if (remote.found && remote.value !== null) {
              return remote.value as T
            }
          } catch {
            // fall back to the fallback value
          }
        }

        return fallback
      }
    },
    async save<T>(key: string, value: T): Promise<void> {
      const previousValue = lastSavedValues.get(key)
      const missingMarker = Symbol('missing')

      let shouldSkipRemoteSave = false

      if (previousValue !== undefined && areValuesEqual(previousValue, value)) {
        shouldSkipRemoteSave = true
      } else {
        try {
          const existingValue = await loadLocal<T>(key, missingMarker as T)

          if (existingValue !== missingMarker && areValuesEqual(existingValue, value)) {
            shouldSkipRemoteSave = true
          }
        } catch {
          // fall back to attempting the local save and remote save
        }
      }

      await saveLocal(key, value)
      lastSavedValues.set(key, value)

      if (shouldSkipRemoteSave) {
        return
      }

      if (isRemoteEnabled() && shouldUseRemoteForKey(key)) {
        try {
          await saveRemote(key, value)
        } catch {
          lastSavedValues.delete(key)
          // keep local persistence authoritative
        }
      }
    },
    async remove(key: string): Promise<void> {
      if (isRemoteEnabled() && shouldUseRemoteForKey(key)) {
        try {
          await removeRemote(key)
        } catch {
          // keep local persistence authoritative
        }
      }

      await removeLocal(key)
    },
    async list<TResponse = unknown>(): Promise<TResponse> {
      return listLocal() as unknown as Promise<TResponse>
    },
  }
}
