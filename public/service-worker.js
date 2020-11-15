const {
  response
} = require("express");

// const DATA_CACHE_NAME = '';
const FILES_TO_CACHE = [

];

const CACHE_NAME = 'static-cache-v1';
const DATA_CACHE_NAME = 'data-cache-v1';
//install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Your files were pre-cached successfully!');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

//
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          console.log(key);
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log('rm old cache data', key);
            return cache.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.url.includes('/api/')) {
    console.log('[Service Worker] Fetch (data)', event.request.url);
    event.respondWith(
      caches.open(DATA_CACHE_NAME)
      .then(cache => {
        return fetch(event.request)
          .then(response => {
            if (response.status === 200) {
              cache.put(event.request.url, response.clone());
            }
            return response();
          })
          .catch(error => {
            return cache.match(event.request);
          });
      })
    );
    return;
  }
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        return response || fetch(event.request);
      });
    })
  );
});