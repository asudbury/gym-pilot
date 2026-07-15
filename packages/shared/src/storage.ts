import { loadJsonRecord, removeJsonRecord, saveJsonRecord } from './dexie'

export interface IPersistenceStore {
  load<T>(key: string, fallback: T): Promise<T>
  save<T>(key: string, value: T): Promise<void>
  remove(key: string): Promise<void>
}

export class DexiePersistence implements IPersistenceStore {
  async load<T>(key: string, fallback: T): Promise<T> {
    return loadJsonRecord<T>(key, fallback)
  }

  async save<T>(key: string, value: T): Promise<void> {
    await saveJsonRecord(key, value)
  }

  async remove(key: string): Promise<void> {
    await removeJsonRecord(key)
  }
}
