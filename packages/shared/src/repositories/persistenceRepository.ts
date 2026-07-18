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

export function createPersistenceRepository<TListResponse = unknown>(dependencies: PersistenceRepositoryDependencies<TListResponse>): PersistenceRepository<TListResponse> {
  const { loadLocal, saveLocal, removeLocal, listLocal, loadRemote, saveRemote, removeRemote, isRemoteEnabled, shouldUseRemoteForKey } = dependencies

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
      await saveLocal(key, value)

      if (isRemoteEnabled() && shouldUseRemoteForKey(key)) {
        try {
          await saveRemote(key, value)
        } catch {
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
