import { logger } from "../logging";

/**
 * The shape returned when a remote persistence layer has already stored a value.
 */
export type RemoteRecordResponse<T> = {
  found: boolean;
  value: T | null;
};

/**
 * The dependencies required to create a persistence repository that can read and
 * write through local and remote stores.
 */
export type PersistenceRepositoryDependencies<TLocalResponse = unknown> = {
  loadLocal: <T>(key: string, fallback: T) => Promise<T>;
  saveLocal: <T>(key: string, value: T) => Promise<void>;
  removeLocal: (key: string) => Promise<void>;
  listLocal: () => Promise<TLocalResponse>;
  loadRemote: <T>(key: string) => Promise<RemoteRecordResponse<T>>;
  saveRemote: <T>(key: string, value: T) => Promise<void>;
  removeRemote: (key: string) => Promise<void>;
  isRemoteEnabled: () => boolean;
  shouldUseRemoteForKey: (key: string) => boolean;
};

/**
 * A small repository abstraction that coordinates storage across local and
 * remote persistence layers.
 */
export interface PersistenceRepository<TListResponse = unknown> {
  load<T>(key: string, fallback: T): Promise<T>;
  save<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  list<TResponse = TListResponse>(): Promise<TResponse>;
}

function logPersistenceWarning(
  operation: string,
  key: string,
  error: unknown,
): void {
  logger.warn("[persistenceRepository] Non-fatal persistence error", {
    operation,
    key,
    error,
  });
}

function areValuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }

  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

/**
 * Creates a repository that prefers local storage but can fall back to or sync
 * with a remote store when enabled for a given key.
 */
export function createPersistenceRepository<TListResponse = unknown>(
  dependencies: PersistenceRepositoryDependencies<TListResponse>,
): PersistenceRepository<TListResponse> {
  const {
    loadLocal,
    saveLocal,
    removeLocal,
    listLocal,
    loadRemote,
    saveRemote,
    removeRemote,
    isRemoteEnabled,
    shouldUseRemoteForKey,
  } = dependencies;
  const lastSavedValues = new Map<string, unknown>();

  return {
    async load<T>(key: string, fallback: T): Promise<T> {
      const missingMarker = Symbol("missing");

      try {
        const localValue = await loadLocal<T>(key, missingMarker as T);

        if (localValue !== missingMarker) {
          return localValue;
        }

        if (isRemoteEnabled() && shouldUseRemoteForKey(key)) {
          try {
            const remote = await loadRemote<T>(key);

            if (remote.found && remote.value !== null) {
              return remote.value as T;
            }
          } catch (error) {
            logPersistenceWarning("load-remote-after-local-miss", key, error);
          }
        }

        return fallback;
      } catch (error) {
        logPersistenceWarning("load-local", key, error);
        if (isRemoteEnabled() && shouldUseRemoteForKey(key)) {
          try {
            const remote = await loadRemote<T>(key);

            if (remote.found && remote.value !== null) {
              return remote.value as T;
            }
          } catch (remoteError) {
            logPersistenceWarning(
              "load-remote-after-local-error",
              key,
              remoteError,
            );
          }
        }

        return fallback;
      }
    },
    async save<T>(key: string, value: T): Promise<void> {
      const previousValue = lastSavedValues.get(key);
      const missingMarker = Symbol("missing");

      let shouldSkipRemoteSave = false;

      if (previousValue !== undefined && areValuesEqual(previousValue, value)) {
        shouldSkipRemoteSave = true;
      } else {
        try {
          const existingValue = await loadLocal<T>(key, missingMarker as T);

          if (
            existingValue !== missingMarker &&
            areValuesEqual(existingValue, value)
          ) {
            shouldSkipRemoteSave = true;
          }
        } catch (error) {
          logPersistenceWarning("load-local-before-save", key, error);
        }
      }

      await saveLocal(key, value);
      lastSavedValues.set(key, value);

      if (shouldSkipRemoteSave) {
        return;
      }

      if (isRemoteEnabled() && shouldUseRemoteForKey(key)) {
        try {
          await saveRemote(key, value);
        } catch (error) {
          logPersistenceWarning("save-remote", key, error);
          lastSavedValues.delete(key);
        }
      }
    },
    async remove(key: string): Promise<void> {
      if (isRemoteEnabled() && shouldUseRemoteForKey(key)) {
        try {
          await removeRemote(key);
        } catch (error) {
          logPersistenceWarning("remove-remote", key, error);
        }
      }

      await removeLocal(key);
    },
    async list<TResponse = unknown>(): Promise<TResponse> {
      return listLocal() as unknown as Promise<TResponse>;
    },
  };
}
