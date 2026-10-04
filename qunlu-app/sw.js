const CACHE_PREFIX="qunlu-pwa-";
const CACHE_NAME=CACHE_PREFIX+"v5";
const CORE=[
  "./",
  "./index.html",
  "./version.json",
  "./manifest.webmanifest",
  "./assets/css/game.css",
  "./src/bootstrap.js",
  "./src/game-data.js",
  "./src/data-patches.js",
  "./src/asdail-depth-v2.js",
  "./src/runtime.js",
  "./src/market-economy-v2.js",
  "./src/world-autonomy-v1.js",
  "./src/runtime-patches.js",
  "./src/world-autonomy-v2.js",
  "./src/npc-depth-v1.js",
  "./src/pwa.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install",event=>{
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache=>cache.addAll(CORE))
      .catch(()=>null)
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  event.respondWith((async()=>{
    try{
      const fresh=await fetch(request,{cache:"no-store"});
      if(fresh&&fresh.ok){
        const cache=await caches.open(CACHE_NAME);
        cache.put(request,fresh.clone()).catch(()=>{});
      }
      return fresh;
    }catch(error){
      const cached=await caches.match(request,{ignoreSearch:true});
      if(cached)return cached;
      if(request.mode==="navigate"){
        const shell=await caches.match("./index.html");
        if(shell)return shell;
      }
      throw error;
    }
  })());
});
