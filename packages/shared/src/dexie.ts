import Dexie, { type Table } from "dexie";
import { logger } from "./logging";

type JsonRecord = {
  key: string;
  value: string;
};

export class GymPilotDatabase extends Dexie {
  records!: Table<JsonRecord, string>;

  constructor(name = "gym-pilot-db") {
    super(name);

    this.version(1).stores({
      records: "key",
    });
  }
}

export const gymPilotDb = new GymPilotDatabase();

const pendingWrites = new Map<string, Promise<void>>();

async function ensureDbOpen() {
  if (!gymPilotDb.isOpen()) {
    await gymPilotDb.open();
  }
}

gymPilotDb.on("blocked", () => {
  logger.warn("Dexie blocked");
});

gymPilotDb.on("versionchange", (event) => {
  logger.warn("Dexie version change", event);
});

gymPilotDb.on("close", () => {
  logger.warn("Dexie database closed");
});

export async function saveJsonRecord<T>(key: string, value: T) {
  let json: string;

  try {
    json = JSON.stringify(value);
  } catch (error) {
    logger.error("Failed serialising record", key, error);
    throw error;
  }

  await ensureDbOpen();

  const previousWrite = pendingWrites.get(key) ?? Promise.resolve();
  const nextWrite = previousWrite
    .catch(() => undefined)
    .then(async () => {
      await ensureDbOpen();
      await gymPilotDb.records.put({
        key,
        value: json,
      });
    });

  pendingWrites.set(key, nextWrite);
  await nextWrite;
}

export async function loadJsonRecord<T>(key: string, fallback: T): Promise<T> {
  await ensureDbOpen();

  const record = await gymPilotDb.records.get(key);

  if (!record) {
    return fallback;
  }

  try {
    return JSON.parse(record.value) as T;
  } catch (error) {
    logger.error("Corrupt IndexedDB record:", key, error);
    logger.info("Raw value:", record.value);

    return fallback;
  }
}

export async function removeJsonRecord(key: string) {
  await gymPilotDb.records.delete(key);
}

export async function listJsonRecords() {
  const records = await gymPilotDb.records.toArray();

  return records.map((record) => ({
    key: record.key,
    value: (() => {
      try {
        return JSON.parse(record.value);
      } catch {
        return record.value;
      }
    })(),
  }));
}
