// Work Pro Service Worker — disabled (cache-busting mode)
// This SW intentionally does NOT cache anything
// to ensure users always get the latest version.
self.addEventListener('install', function(e) {
  console.log('[SW] v338 — cache disabled');
  self.skipWaiting();
});
self.addEventListener('activate', function(e) {
  console.log('[SW] v333 — clearing all old caches');
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.map(function(name) {
        console.log('[SW] Deleting cache:', name);
        return caches.delete(name);
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});
self.addEventListener('fetch', function(e) {
  // Always go to network, never cache
  e.respondWith(fetch(e.request));
});
