// Work Pro Service Worker — v403 mainnet
// Network-first for HTML, stale-while-revalidate for static assets, network-only for API
const CACHE_NAME = 'workpro-v406';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/app-v182.js',
  '/assets/app-v173.css'
];

self.addEventListener('install', function(e) {
  console.log('[SW] v403 install');
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e) {
  console.log('[SW] v403 activate');
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

  // HTML pages: network-first, fallback to cache
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(e.request).then(function(networkResponse) {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }

  // CSS/JS: stale-while-revalidate
  e.respondWith(
    caches.match(e.request).then(function(response) {
      var fetchPromise = fetch(e.request).then(function(networkResponse) {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(function() { return response; });
      return response || fetchPromise;
    })
  );
});
