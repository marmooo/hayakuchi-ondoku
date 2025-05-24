const CACHE_NAME = "2025-05-25 00:00";
const urlsToCache = [
  "/hayakuchi-ondoku/",
  "/hayakuchi-ondoku/index.js",
  "/hayakuchi-ondoku/data/0.csv",
  "/hayakuchi-ondoku/data/1.csv",
  "/hayakuchi-ondoku/data/yomi.csv",
  "/hayakuchi-ondoku/mp3/end.mp3",
  "/hayakuchi-ondoku/mp3/incorrect1.mp3",
  "/hayakuchi-ondoku/mp3/correct3.mp3",
  "/hayakuchi-ondoku/favicon/favicon.svg",
  "/hayakuchi-ondoku/kohacu.webp",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      );
    }),
  );
});
