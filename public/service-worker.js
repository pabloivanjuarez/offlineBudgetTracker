const FILES_TO_CACHE = [
  '/',
  '/index.html',
  'assets/css/styles.css',
  'assets/js/index.js',
  'assets/js/db.js',
  'assets/icons/icon-192x192.png',
  'assets/icons/icon-512x512.png',
  '/manifest.webmanifest'
];

const CACHE_NAME = 'static-cache-v2';
const DATA_CACHE_NAME = 'data-cache-v2';

// install
self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => {
    return cache.addAll(FILES_TO_CACHE);
  }));
  self.skipWaiting();
});

// activate
self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(keyList => {
    return Promise.all(
      keyList.map(key => {
        if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
          console.log('RM old key: ', key);
          return caches.delete(key);
        };
      }));
  }));
  self.clients.claim();
});

// fetch
self.addEventListener('fetch', function (evt) {
  if (evt.request.url.includes('/api/')) {
    evt.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(evt.request)
          .then(response => {
            // Clone and store in cache, if response is 200.
            if (response.status === 200) {
              cache.put(evt.request.url, response.clone());
            }
            return response;
          })
          .catch(err => {
            return cache.match(evt.request);
          });
      }).catch(err => console.log(err))
    );
    return;
  }
  evt.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(evt.request).then(response => {
        return response || fetch(evt.request);
      });
    })
  );
});