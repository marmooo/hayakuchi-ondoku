const CACHE_NAME="2025-02-07 12:00",urlsToCache=["/hayakuchi-ondoku/","/hayakuchi-ondoku/index.js","/hayakuchi-ondoku/data/0.csv","/hayakuchi-ondoku/data/1.csv","/hayakuchi-ondoku/data/yomi.csv","/hayakuchi-ondoku/mp3/end.mp3","/hayakuchi-ondoku/mp3/incorrect1.mp3","/hayakuchi-ondoku/mp3/correct3.mp3","/hayakuchi-ondoku/favicon/favicon.svg","/hayakuchi-ondoku/kohacu.webp"];self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE_NAME).then(e=>e.addAll(urlsToCache)))}),self.addEventListener("fetch",e=>{e.respondWith(caches.match(e.request).then(t=>t||fetch(e.request)))}),self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(e=>Promise.all(e.filter(e=>e!==CACHE_NAME).map(e=>caches.delete(e)))))})