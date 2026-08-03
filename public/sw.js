const CACHE_NAME = 'sipopay-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Memaksa SW baru untuk segera aktif
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Cache and return requests
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;

  // Network First untuk request navigasi (HTML) agar selalu mendapat file JS/CSS terbaru
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache First untuk asset lainnya
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Update Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim()); // Mengambil alih semua client terbuka
  
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
  );
});
