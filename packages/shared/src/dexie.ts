import Dexie, { type Table } from 'dexie'

type JsonRecord = {
  key: string
  value: string
}

export class GymPilotDatabase extends Dexie {
  records!: Table<JsonRecord, string>

  constructor(name = 'gym-pilot-db') {
    super(name)

    this.version(1).stores({
      records: 'key',
    })
  }
}

export const gymPilotDb = new GymPilotDatabase()

export async function saveJsonRecord<T>(key: string, value: T) {
  await gymPilotDb.records.put({ key, value: JSON.stringify(value) })
}

export async function loadJsonRecord<T>(key: string, fallback: T): Promise<T> {
  const record = await gymPilotDb.records.get(key)

  if (!record) {
    return fallback
  }

  try {
    return JSON.parse(record.value) as T
  } catch {
    return fallback
  }
}

export async function removeJsonRecord(key: string) {
  await gymPilotDb.records.delete(key)
}

export async function listJsonRecords() {
  const records = await gymPilotDb.records.toArray()

  return records.map((record) => ({
    key: record.key,
    value: (() => {
      try {
        return JSON.parse(record.value)
      } catch {
        return record.value
      }
    })(),
  }))
}
