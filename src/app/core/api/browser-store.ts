// Einfacher Schlüssel-Wert-Speicher für den Browser-Modus (Lebenslauf und Fotos), aufgebaut auf IndexedDB.
const DB_NAME = 'cv-studio';
const STORE = 'kv';

/** Schlüssel-Wert-Speicher in IndexedDB; weicht auf Arbeitsspeicher aus, wo IndexedDB fehlt (z. B. manche privaten Modi). */
export interface BrowserStore {
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
}

/** Verpackt einen callback-basierten IndexedDB-Request in ein Promise. */
function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB'));
  });
}

/** Öffnet die Datenbank und legt beim ersten Start den Object-Store an. */
function openDatabase(): Promise<IDBDatabase> {
  const open = indexedDB.open(DB_NAME, 1);
  open.onupgradeneeded = () => open.result.createObjectStore(STORE);
  return request(open);
}

/** Flüchtiger Ersatz ohne Persistenz; klont Werte, damit er sich wie IndexedDB verhält. */
function memoryStore(): BrowserStore {
  const values = new Map<string, unknown>();
  return {
    get: <T>(key: string) => Promise.resolve(structuredClone(values.get(key)) as T | undefined),
    set: (key, value) => {
      values.set(key, structuredClone(value));
      return Promise.resolve();
    },
    delete: (key) => {
      values.delete(key);
      return Promise.resolve();
    },
  };
}

/** Öffnet den Browser-Speicher; jede Operation läuft in einer eigenen kurzen Transaktion. */
export async function openBrowserStore(): Promise<BrowserStore> {
  let db: IDBDatabase;
  try {
    db = await openDatabase();
  } catch {
    return memoryStore();
  }
  const run = <T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> =>
    request(action(db.transaction(STORE, mode).objectStore(STORE)));
  return {
    get: <T>(key: string) => run('readonly', (store) => store.get(key) as IDBRequest<T | undefined>),
    set: async (key, value) => {
      await run('readwrite', (store) => store.put(value, key));
    },
    delete: async (key) => {
      await run('readwrite', (store) => store.delete(key));
    },
  };
}
