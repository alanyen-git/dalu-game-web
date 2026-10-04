const CACHE = "dalu-travel-log-v0.4.24";
const ASSETS = [
  "./",
  "./index.html?v=0.4.24",
  "./styles.css?v=0.4.24",
  "./map-navigation.css?v=0.4.24",
  "./art-direction.css?v=0.4.24",
  "./event-system.js?v=0.4.24",
  "./region-content.js?v=0.4.24",
  "./app.js?v=0.4.24",
  "./map-navigation.js?v=0.4.24",
  "./battle.js?v=0.4.24",
  "./profession.js?v=0.4.24",
  "./formation.js?v=0.4.24",
  "./battle-ui.js?v=0.4.24",
  "./character-creation.js?v=0.4.24",
  "./app-update.js?v=0.4.24",
  "./save-system.js?v=0.4.24",
  "./story-progression.js?v=0.4.24",
  "./qunlu-database.js?v=0.4.24", "./character-data.js?v=0.4.24",
  "./character-growth.js?v=0.4.24",
  "./assets/art/locations/mist-harbor.svg",
  "./assets/art/locations/bell-hill.svg",
  "./assets/art/tidebook-shoreline.svg",
  "./assets/art/dalu-emblem.svg",
  "./assets/art/portraits/loen.svg",
  "./assets/art/portraits/idda.svg",
  "./assets/art/portraits/warden.svg",
  "./assets/art/portraits/salt-hound.svg",
  "./assets/art/app-icon.svg",
  "./assets/art/app-icon-192.png",
  "./assets/art/app-icon-512.png",
  "./app.webmanifest",
  "./version.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .catch((error) => caches.delete(CACHE).then(() => { throw error; }))
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith("dalu-travel-log-") && key !== CACHE)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const isAppShell = event.request.mode === "navigate" || url.pathname.endsWith("/") || /\.(html|js|css|json)$/.test(url.pathname);
  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);
      if (response.ok) {
        const cache = await caches.open(CACHE);
        await cache.put(event.request, response.clone());
        return response;
      }
      const fallback = await caches.match(event.request);
      return fallback || response;
    } catch (error) {
      const fallback = await caches.match(event.request);
      if (fallback) return fallback;
      throw error;
    }
  })());
});
