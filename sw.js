const CACHE_NAME = 'pickme-services-v1';
const urlsToCache = [
  '/PickMe-Services/',
  '/PickMe-Services/fashion.html',
  '/PickMe-Services/template.html',
  '/PickMe-Services/callback.html',
  '/PickMe-Services/images/icon-192.png',
  '/PickMe-Services/images/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});


self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
