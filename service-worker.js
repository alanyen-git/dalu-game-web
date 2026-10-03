const CACHE = "dalu-travel-log-v0.3.1";
const ASSETS = ["./", "./index.html?v=0.3.1", "./styles.css?v=0.3.1", "./app.js?v=0.3.1", "./app.webmanifest"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS))));
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request))));



