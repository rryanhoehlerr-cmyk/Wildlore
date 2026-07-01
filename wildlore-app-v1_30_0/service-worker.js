const VERSION = 'wildlore-v1.30.0';
const SHELL_CACHE = `${VERSION}-shell`;
const MEDIA_CACHE = `${VERSION}-media`;
const MEDIA_MAX = 220;
const SHELL_ASSETS = [
  './', './index.html', './css/app.css', './manifest.webmanifest',
  './js/app.js', './js/config.js',
  './js/core/db.js', './js/core/auth.js', './js/core/store.js',
  './js/data/gbif.js', './js/data/obis.js', './js/data/catalog.js', './js/data/collections.js', './js/data/regions.js',
  './js/features/identify.js', './js/features/gamify.js', './js/features/vision.js',
  './js/ui/components.js', './js/ui/illustrations.js', './js/ui/shell.js', './js/ui/views.js',
  './js/ui/species.js', './js/ui/capture.js', './js/ui/habitats.js',
  './js/ui/places.js',
  './js/ui/scenes.js',
  './js/ui/composer.js',
  './js/features/artwork.js',
  './js/features/sounds.js',
  './js/data/sceneanalyze.js',
  './assets/icons/icon-192.png', './assets/icons/icon-512.png', './assets/icons/apple-touch-icon.png', './assets/icons/favicon-32.png'
];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => !x.startsWith(VERSION)).map((x) => caches.delete(x)))).then(() => self.clients.claim())); });
const isMedia = (u) => /\.(?:jpg|jpeg|png|webp|gif)$/i.test(u.pathname) || u.hostname.includes('inaturalist');
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return; const url = new URL(req.url);
  if (url.origin !== self.location.origin) { if (isMedia(url)) e.respondWith(mediaCacheFirst(req)); return; }
  e.respondWith(shellNetworkFirst(req));
});
async function shellNetworkFirst(req) {
  const cache = await caches.open(SHELL_CACHE);
  try { const res = await fetch(req); if (res.ok && new URL(req.url).origin === self.location.origin) cache.put(req, res.clone()); return res; }
  catch (e) { const c = await cache.match(req, { ignoreSearch: true }); if (c) return c; if (req.mode === 'navigate') return cache.match('./index.html'); throw e; }
}
async function mediaCacheFirst(req) {
  const cache = await caches.open(MEDIA_CACHE); const c = await cache.match(req); if (c) return c;
  try { const res = await fetch(req, { mode: 'no-cors' }); cache.put(req, res.clone()); trim(MEDIA_CACHE, MEDIA_MAX); return res; } catch (e) { return c || Response.error(); }
}
async function trim(name, max) { const cache = await caches.open(name); const keys = await cache.keys(); if (keys.length <= max) return; for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]); }
self.addEventListener('push', (e) => { let d = { title: 'Wildlore', body: 'Something is stirring in the wild.', url: './' }; try { if (e.data) d = { ...d, ...e.data.json() }; } catch (_) {} e.waitUntil(self.registration.showNotification(d.title, { body: d.body, icon: 'assets/icons/icon-192.png', badge: 'assets/icons/favicon-32.png', data: { url: d.url || './' } })); });
self.addEventListener('notificationclick', (e) => { e.notification.close(); const t = e.notification.data?.url || './'; e.waitUntil(clients.matchAll({ type: 'window' }).then((l) => { for (const c of l) { if ('focus' in c) { c.navigate(t); return c.focus(); } } return clients.openWindow(t); })); });
self.addEventListener('sync', (e) => { if (e.tag === 'wildlore-sync') e.waitUntil(bc({ type: 'SYNC_NOW' })); });
async function bc(m) { (await clients.matchAll({ includeUncontrolled: true })).forEach((c) => c.postMessage(m)); }
