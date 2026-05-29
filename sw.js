const CACHE_NAME = 'workpro-v303';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg'
];

// Install — cache static assets
self.addEventListener('install', function(e) {
  console.log('[SW] Installing v303...');
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    }).catch(function() {
      console.log('[SW] Some assets failed to cache');
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', function(e) {
  console.log('[SW] Activating v303...');
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
             .map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', function(e) {
  // Skip non-GET requests
  if (e.request.method !== 'GET') return;
  // Skip API calls
  if (e.request.url.indexOf('workpro-api') !== -1) return;
  // Skip Pi SDK
  if (e.request.url.indexOf('minepi.com') !== -1) return;

  e.respondWith(
    fetch(e.request).then(function(response) {
      // Cache successful responses
      if (response.ok && response.status === 200) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
      }
      return response;
    }).catch(function() {
      // Fallback to cache
      return caches.match(e.request).then(function(cached) {
        return cached || new Response('Offline', { status: 503 });
      });
    })
  );
});
