/**
 * Carries a resume chosen on the public careers pages across the login step.
 *
 * A `File` cannot go through the URL, and login may be a full page load (OAuth,
 * email verification), so it is parked in IndexedDB and picked up once by the
 * portal's resume matcher.
 */
const DB_NAME = "careers-pending";
const STORE = "resume";
const KEY = "current";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export const ACCEPTED_RESUME_TYPES = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

interface PendingRecord {
  file: File;
  savedAt: number;
}

async function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return null;
  const { promise, resolve } = Promise.withResolvers<IDBDatabase | null>();
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => request.result.createObjectStore(STORE);
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => resolve(null);
  return promise;
}

/** Resolves `false` when the browser refuses storage (e.g. private mode); callers still continue to login. */
export async function savePendingResume(file: File): Promise<boolean> {
  const db = await openDb();
  if (!db) return false;
  const { promise, resolve } = Promise.withResolvers<boolean>();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put({ file, savedAt: Date.now() } satisfies PendingRecord, KEY);
  tx.oncomplete = () => resolve(true);
  tx.onerror = () => resolve(false);
  tx.onabort = () => resolve(false);
  return promise;
}

/** Returns the parked resume (if fresh) and removes it. */
export async function takePendingResume(): Promise<File | null> {
  const db = await openDb();
  if (!db) return null;
  const { promise, resolve } = Promise.withResolvers<File | null>();
  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);
  const request = store.get(KEY);
  let result: File | null = null;
  request.onsuccess = () => {
    const record = request.result as PendingRecord | undefined;
    if (record && Date.now() - record.savedAt < MAX_AGE_MS) result = record.file;
    store.delete(KEY);
  };
  tx.oncomplete = () => resolve(result);
  tx.onerror = () => resolve(null);
  tx.onabort = () => resolve(null);
  return promise;
}
