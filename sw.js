const CACHE_NAME = 'catatan-pintar-v3'; 

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './pwa-updates.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  // Sesuaikan dengan nama aset hasil kompilasi Anda saat ini
  './assets/index-BZdFqhWG.js', 
  './assets/web-_2ApSN0m.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
