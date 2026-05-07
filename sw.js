// Network-first for HTML and API, cache-first for static assets
const CACHE_NAME = 'workpro-v47';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/validation-key.txt',
  '/.well-known/pi-validation.txt',
  '/sitemap.xml',
  '/robots.txt',
];

function addCacheBustingHeaders(response) {
  // Only modify same-origin responses
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

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;

  const url = new URL(req.url);

  // ─── NEVER cache API calls — always network-first ─────────────
  if(url.pathname.startsWith('/api/') || url.host !== self.location.host) {
    e.respondWith(
      fetch(req).then(response => {
        return addCacheBustingHeaders(response);
      }).catch(() => {
        // If network fails for API, don't return cached HTML
        return new Response(JSON.stringify({error:'Network unavailable'}), {status: 503, headers:{'Content-Type':'application/json'}});
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
        return caches.match(req).then(cached => cached || new Response('Offline', {status: 503}));
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
