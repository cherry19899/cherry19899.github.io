// WorkPro service worker — safe caching for a hashed-asset SPA.
// - Navigations (HTML): network-first, fall back to cache/offline so users never
//   get a stale index.html pointing at old bundles.
// - Hashed static assets (/assets/*): cache-first (content-addressed, immutable).
const CACHE_NAME = 'workpro-v4';
const OFFLINE_URL = '/index.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(['/', OFFLINE_URL])).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // don't touch API / Pi SDK

  // Navigations → network-first (always try fresh HTML).
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(OFFLINE_URL, fresh.clone());
        return fresh;
      } catch {
        return (await caches.match(req)) || (await caches.match(OFFLINE_URL));
      }
    })());
    return;
  }

  // Static assets → cache-first, populate on miss.
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res && res.status === 200 && res.type === 'basic') {
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, res.clone());
      }
      return res;
    } catch {
      return cached || Response.error();
    }
  })());
});
