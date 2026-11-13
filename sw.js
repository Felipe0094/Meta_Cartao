const CACHE = "meta-cartao-v1";
const SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icone.svg",
  "icone-192.png",
  "icone-512.png",
  "icone-maskable-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Supabase e CDNs externos: sempre pela rede (dados precisam estar frescos)
  if (url.origin !== location.origin) return;

  // Arquivos locais: cache-first, atualizando em segundo plano
  e.respondWith(
    caches.match(req).then(cached => {
      const fresh = fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => cached);
      return cached || fresh;
    })
  );
});