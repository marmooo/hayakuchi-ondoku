var CACHE_NAME="2022-11-26 12:58",urlsToCache=["/hayakuchi-ondoku/","/hayakuchi-ondoku/index.js","/hayakuchi-ondoku/data/0.csv","/hayakuchi-ondoku/data/1.csv","/hayakuchi-ondoku/data/yomi.csv","/hayakuchi-ondoku/mp3/end.mp3","/hayakuchi-ondoku/mp3/incorrect1.mp3","/hayakuchi-ondoku/mp3/correct3.mp3","/hayakuchi-ondoku/favicon/favicon.svg","/hayakuchi-ondoku/kohacu.webp","https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css"];self.addEventListener("install",function(a){a.waitUntil(caches.open(CACHE_NAME).then(function(a){return a.addAll(urlsToCache)}))}),self.addEventListener("fetch",function(a){a.respondWith(caches.match(a.request).then(function(b){return b||fetch(a.request)}))}),self.addEventListener("activate",function(a){var b=[CACHE_NAME];a.waitUntil(caches.keys().then(function(a){return Promise.all(a.map(function(a){if(b.indexOf(a)===-1)return caches.delete(a)}))}))})