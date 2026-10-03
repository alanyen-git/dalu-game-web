const CACHE = "dalu-travel-log-v0.4.0";
const ASSETS = ["./", "./index.html?v=0.4.0", "./styles.css?v=0.4.0", "./app.js?v=0.4.0", "./app.webmanifest", "./battle.js?v=0.4.0"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS))));
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request))));







