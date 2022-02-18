var CACHE_NAME = '2022-02-19 00:40';
var urlsToCache = [
  "/hayakuchi-ondoku/",
  "/hayakuchi-ondoku/index.js",
  "/hayakuchi-ondoku/data/0.csv",
  "/hayakuchi-ondoku/data/1.csv",
  "/hayakuchi-ondoku/data/yomi.csv",
  "/hayakuchi-ondoku/mp3/end.mp3",
  "/hayakuchi-ondoku/mp3/incorrect1.mp3",
  "/hayakuchi-ondoku/mp3/correct3.mp3",
  "/hayakuchi-ondoku/favicon/original.svg",
  "/hayakuchi-ondoku/kohacu.webp",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(urlsToCache);
      }),
  );
});

self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request)
      .then(function (response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }),
  );
});

self.addEventListener("activate", function (event) {
  var cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});
