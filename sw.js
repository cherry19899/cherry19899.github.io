// Work Pro Service Worker — SELF-DESTRUCT (v458)
// This SW uninstalls itself to clear all cache
self.addEventListener('install', function(e) {
  self.skipWaiting();
});
self.addEventListener('activate', function(e) {
  e.waitUntil(
    Promise.all([
      caches.keys().then(function(names) {
        return Promise.all(names.map(function(n) { return caches.delete(n); }));
      }),
      self.registration.unregister().then(function() {
        console.log('[SW] Self-unregistered');
      })
    ]).then(function() {
      return self.clients.claim();
    })
  );
});
