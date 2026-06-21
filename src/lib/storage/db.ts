import { openDB, type IDBPDatabase } from "idb";
import type { Scenario } from "../fi/types";

const DB_NAME = "finastic";
const DB_VERSION = 1;

interface Meta {
  key: string;
  value: unknown;
}

interface SnapshotRow {
  id?: IDBValidKey;
  label: string;
  payload: unknown;
  createdAt: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function isBrowser() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function getDB() {
  if (!isBrowser()) return null;
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("scenarios")) {
          db.createObjectStore("scenarios", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("meta")) {
          db.createObjectStore("meta", { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains("snapshots")) {
          db.createObjectStore("snapshots", { keyPath: "id", autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}

export async function loadAllScenarios(): Promise<Scenario[]> {
  const db = await getDB();
  if (!db) return [];
  return (await db.getAll("scenarios")) as Scenario[];
}

export async function saveScenario(s: Scenario) {
  const db = await getDB();
  if (!db) return;
  await db.put("scenarios", s);
}

export async function deleteScenario(id: string) {
  const db = await getDB();
  if (!db) return;
  await db.delete("scenarios", id);
}

export async function getMeta<T = unknown>(key: string): Promise<T | null> {
  const db = await getDB();
  if (!db) return null;
  const row = (await db.get("meta", key)) as Meta | undefined;
  return (row?.value as T) ?? null;
}

export async function setMeta(key: string, value: unknown) {
  const db = await getDB();
  if (!db) return;
  await db.put("meta", { key, value });
}

export async function wipeAll() {
  const db = await getDB();
  if (!db) return;
  await db.clear("scenarios");
  await db.clear("meta");
  await db.clear("snapshots");
}

export async function snapshot(label: string, payload: unknown) {
  const db = await getDB();
  if (!db) return;
  await db.add("snapshots", {
    label,
    payload,
    createdAt: Date.now(),
  });
  // ring buffer of 50
  const all = (await db.getAll("snapshots")) as SnapshotRow[];
  if (all.length > 50) {
    const sorted = all.sort((a, b) => a.createdAt - b.createdAt);
    const toDelete = sorted.slice(0, all.length - 50);
    for (const s of toDelete) {
      if (s.id !== undefined) await db.delete("snapshots", s.id);
    }
  }
}
