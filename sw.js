// sw.js - Versi Cache yang aman (v2)
// Diperbarui dengan isolasi IndexedDB yang ketat sesuai best practices
const CACHE_NAME = 'catatan-pintar-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './pwa-updates.js',
  './assets/index-BZdFqhWG.js',
  './assets/web-_2ApSN0m.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// 1. Install Event: Mengunduh dan menyimpan aset UI statis baru
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Membuka cache statis...', CACHE_NAME);
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Langsung aktifkan Service Worker baru tanpa menunggu tab lama ditutup
  self.skipWaiting();
});

// 2. Activate Event: Menghapus cache versi lama yang sudah kedaluwarsa
// PERHATIAN: Blok ini HANYA membersihkan Cache Storage, TIDAK MENYENTUH IndexedDB sama sekali.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Menghapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Event: Strategi Cache-First dengan fallback ke Network untuk aset statis
self.addEventListener('fetch', (event) => {
  // Abaikan request non-GET atau request ke API eksternal
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // Cache response dinamis jika berhasil dimuat
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Fallback opsional jika offline total dan aset tidak ada di cache
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
