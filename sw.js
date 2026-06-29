// Kill-switch service worker.
// Neutralizes any previously-registered SW (old Vite/v630 app, or a stale
// workbox precache build): clears all caches, unregisters itself, and reloads
// controlled windows so the current Next.js (piwork) app loads fresh.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((c) => { try { c.navigate(c.url); } catch (e) {} });
    } catch (e) {}
  })());
});
