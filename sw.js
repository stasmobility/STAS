const CACHE_VERSION = 'stas-4.1-network-first-v2-exercise-fix';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './assets/icon.svg',
  './assets/hero.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);

    try {
      // Immer zuerst beim Server prüfen. "no-store" verhindert den Browser-HTTP-Cache.
      const fresh = await fetch(request, { cache: 'no-store' });
      if (fresh && fresh.ok) await cache.put(request, fresh.clone());
      return fresh;
    } catch (error) {
      // Offline: exakte Ressource aus dem Cache verwenden.
      const cached = await cache.match(request, { ignoreSearch: true });
      if (cached) return cached;

      // Navigationen fallen auf die zuletzt gespeicherte Startseite zurück.
      if (request.mode === 'navigate') {
        const fallback = await cache.match('./index.html');
        if (fallback) return fallback;
      }

      throw error;
    }
  })());
});
