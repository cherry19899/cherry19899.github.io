const CACHE_NAME = 'workpro-v327';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg'
];

// Install — cache static assets
self.addEventListener('install', function(e) {
  console.log('[SW] Installing v321...');
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
  console.log('[SW] Activating v304...');
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
  if (e.request.method !== 'GET') return;
  if (e.request.url.indexOf('workpro-api') !== -1) return;
  if (e.request.url.indexOf('minepi.com') !== -1) return;

  e.respondWith(
    fetch(e.request).then(function(response) {
      if (response.ok && response.status === 200) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
      }
      return response;
    }).catch(function() {
      return caches.match(e.request).then(function(cached) {
        return cached || new Response('Offline', { status: 503 });
      });
    })
  );
});

// Push Notification handling
self.addEventListener('push', function(e) {
  console.log('[SW] Push received:', e);
  var data = {};
  try { data = e.data.json(); } catch(err) { data = { title: 'Work Pro', body: 'New notification' }; }
  
  var title = data.title || 'Work Pro';
  var options = {
    body: data.body || '',
    icon: data.icon || '/vite.svg',
    badge: '/vite.svg',
    tag: data.tag || 'workpro-' + Date.now(),
    requireInteraction: false,
    data: data.data || {}
  };
  
  e.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handling
self.addEventListener('notificationclick', function(e) {
  console.log('[SW] Notification click:', e.notification.tag);
  e.notification.close();
  e.waitUntil(
    clients.openWindow('/')
  );
});
