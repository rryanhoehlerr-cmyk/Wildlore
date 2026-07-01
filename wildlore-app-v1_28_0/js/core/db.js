const DB_NAME = 'wildlore'; const DB_VERSION = 1; let _db = null;
export function open() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('species')) db.createObjectStore('species', { keyPath: 'taxonKey' });
      if (!db.objectStoreNames.contains('taxa')) db.createObjectStore('taxa', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('regions')) db.createObjectStore('regions', { keyPath: 'regionId' });
      if (!db.objectStoreNames.contains('user_species')) db.createObjectStore('user_species', { keyPath: 'taxonKey' });
      if (!db.objectStoreNames.contains('discoveries')) { const s = db.createObjectStore('discoveries', { keyPath: 'id', autoIncrement: true }); s.createIndex('byTaxon', 'taxonKey', { unique: false }); s.createIndex('byTime', 'capturedAt', { unique: false }); }
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv', { keyPath: 'name' });
      if (!db.objectStoreNames.contains('sync_queue')) db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); }; req.onerror = () => reject(req.error);
  });
}
function tx(store, mode = 'readonly') { return open().then((db) => db.transaction(store, mode).objectStore(store)); }
const done = (req) => new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });
export const get = (s, k) => tx(s).then((o) => done(o.get(k)));
export const put = (s, v) => tx(s, 'readwrite').then((o) => done(o.put(v)));
export const del = (s, k) => tx(s, 'readwrite').then((o) => done(o.delete(k)));
export const add = (s, v) => tx(s, 'readwrite').then((o) => done(o.add(v)));
export function all(store) { return tx(store).then((s) => new Promise((res, rej) => { const out = []; const c = s.openCursor(); c.onsuccess = () => { const cur = c.result; if (cur) { out.push(cur.value); cur.continue(); } else res(out); }; c.onerror = () => rej(c.error); })); }
export const count = (s) => tx(s).then((o) => done(o.count()));
export const kvGet = (n, f = null) => get('kv', n).then((r) => (r ? r.value : f));
export const kvSet = (n, v) => put('kv', { name: n, value: v });
export const clearStore = (name) => tx(name, 'readwrite').then((o) => done(o.clear()));
export async function resetUserData() {
  for (const st of ['species', 'taxa', 'regions', 'user_species', 'discoveries', 'sync_queue']) { try { await clearStore(st); } catch (_) {} }
  const keep = new Set(['local_account', 'appVersion']);
  try { const items = await all('kv'); for (const it of items) { if (!keep.has(it.name)) { try { await del('kv', it.name); } catch (_) {} } } } catch (_) {}
}
