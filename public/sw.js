// WorkPro service worker — safe caching for a hashed-asset SPA.
// - Navigations (HTML): network-first, fall back to cache/offline so users never
//   get a stale index.html pointing at old bundles.
// - Hashed static assets (/assets/*): cache-first (content-addressed, immutable).
// v5 purges caches written by v4, which could hold a 404 page as the app shell
// and stale copies of the legal pages and the manifest.
const CACHE_NAME = 'workpro-v5';
const OFFLINE_URL = '/index.html';

// Content-addressed build output: the filename changes whenever the bytes do,
// so these are the only responses safe to serve from cache without asking.
const isImmutable = (url) => url.pathname.startsWith('/assets/');

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
        // Only a real shell may become the offline fallback. fetch() resolves
        // for a 404 as happily as for a 200, and on GitHub Pages every deep
        // link answers 404.html — the stub that redirects to '/'. Cached as
        // the shell, it was served to offline users, whose browsers then ran
        // its redirect, which was itself offline, which served the stub again:
        // an unbreakable reload loop instead of the app.
        if (fresh.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(OFFLINE_URL, fresh.clone());
        }
        return fresh;
      } catch {
        return (await caches.match(req)) || (await caches.match(OFFLINE_URL));
      }
    })());
    return;
  }

  const store = async (res) => {
    if (res && res.status === 200 && res.type === 'basic') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, res.clone());
    }
    return res;
  };

  // Hashed build output → cache-first. It can never go stale under its name.
  if (isImmutable(url)) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        return await store(await fetch(req));
      } catch {
        return Response.error();
      }
    })());
    return;
  }

  // Everything else same-origin → network-first, cache only as the offline
  // fallback. These filenames never change: manifest.json, the icons, the
  // privacy policy and the terms. Cache-first held them forever, so an
  // install that had once loaded the old terms would go on showing them no
  // matter how many times they were revised.
  event.respondWith((async () => {
    try {
      return await store(await fetch(req));
    } catch {
      return (await caches.match(req)) || Response.error();
    }
  })());
});
