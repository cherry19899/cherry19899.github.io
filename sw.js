// Work Pro Service Worker — v400 mainnet
// Stale-while-revalidate for static assets, network-first for API
const CACHE_NAME = 'workpro-v400';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js'
];

self.addEventListener('install', function(e) {
  console.log('[SW] v400 install');
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e) {
  console.log('[SW] v400 activate');
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
          .map(function(n) { return caches.delete(n); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  const url = new URL(e.request.url);
  
  // API requests: always network
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(fetch(e.request));
    return;
  }
  
  // Static assets: cache first, then network
  e.respondWith(
    caches.match(e.request).then(function(response) {
      if (response) {
        // Update cache in background
        fetch(e.request).then(function(networkResponse) {
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, networkResponse.clone());
          });
        }).catch(function() {});
        return response;
      }
      return fetch(e.request).then(function(networkResponse) {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, networkResponse.clone());
        });
        return networkResponse;
      });
    })
  );
});
