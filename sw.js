// Work Pro Service Worker — PWA support for Pi Browser
const CACHE_NAME = 'workpro-v231';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/privacy-policy.html',
  '/clear.html',
];

function addCacheBustingHeaders(response) {
  if (!response || !response.headers) return response;
  const h = new Headers(response.headers);
  h.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  h.set('Pragma', 'no-cache');
  h.set('Expires', '0');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: h });
}

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(names => 
      Promise.all(names.map(name => {
        if(name !== CACHE_NAME) return caches.delete(name);
      }))
    )
  );
  self.clients.claim();
});

// Background Sync: queue offline form submissions
self.addEventListener('sync', e => {
  if (e.tag === 'workpro-sync') {
    e.waitUntil(syncOfflineRequests());
  }
});

async function syncOfflineRequests() {
  // Read queued requests from IndexedDB and retry
  const db = await openDB('workpro-offline', 1);
  const requests = await db.getAll('requests') || [];
  for (const req of requests) {
    try {
      await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: JSON.stringify(req.body)
      });
      await db.delete('requests', req.id);
    } catch(e) {
      console.log('[SW] Sync failed for:', req.url);
    }
  }
}

function openDB(name, version) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('requests', {keyPath: 'id', autoIncrement: true});
    };
  });
}

// Push notifications (for new job applications, messages)
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'Work Pro', {
      body: data.body || 'New notification',
      icon: '/vite.svg',
      badge: '/vite.svg',
      tag: data.tag || 'workpro',
      requireInteraction: true,
      data: { url: data.url || '/' }
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.openWindow(e.notification.data.url || '/')
  );
});

// Main fetch handler
self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;

  const url = new URL(req.url);

  // NEVER cache API calls — always network-first
  if(url.pathname.startsWith('/api/') || url.host !== self.location.host) {
    e.respondWith(
      fetch(req).then(response => {
        return addCacheBustingHeaders(response);
      }).catch(() => {
        return new Response(JSON.stringify({error:'Network unavailable. Check your connection.'}), 
          {status: 503, headers:{'Content-Type':'application/json'}});
      })
    );
    return;
  }

  // HTML pages: network-first with cache fallback
  if (req.headers.get('Accept') && req.headers.get('Accept').includes('text/html')) {
    e.respondWith(
      fetch(req).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, clone));
        return addCacheBustingHeaders(response);
      }).catch(() => {
        return caches.match(req).then(cached => cached || new Response(
          '<h1>Work Pro — Offline</h1><p>You are offline. Some features may not work.</p>', 
          {status: 503, headers:{'Content-Type':'text/html'}}
        ));
      })
    );
    return;
  }

  // Static assets: cache-first, update cache in background
  e.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req).then(response => {
        if(response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
        }
        return addCacheBustingHeaders(response);
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
