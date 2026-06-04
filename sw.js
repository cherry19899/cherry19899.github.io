// Work Pro Service Worker — NO FETCH HANDLER (v455)
// No fetch interception = browser goes directly to network
self.addEventListener('install', function(e) {
  console.log('[SW] v455 — no fetch interception');
  self.skipWaiting();
});
self.addEventListener('activate', function(e) {
  console.log('[SW] v455 — clearing all old caches');
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
