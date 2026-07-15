import { safeJsonParse } from './utils'

export interface IPersistenceStore {
  load<T>(key: string, fallback: T): T
  save<T>(key: string, value: T): void
  remove(key: string): void
}

function getDefaultStorage(): Storage | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  return window.localStorage
}

export class LocalStoragePersistence implements IPersistenceStore {
  private readonly storage: Storage | undefined

  constructor(storage?: Storage) {
    this.storage = storage ?? getDefaultStorage()
  }

  load<T>(key: string, fallback: T): T {
    return safeJsonParse<T>(this.storage?.getItem(key), fallback)
  }

  save<T>(key: string, value: T): void {
    this.storage?.setItem(key, JSON.stringify(value))
  }

  remove(key: string): void {
    this.storage?.removeItem(key)
  }
}
