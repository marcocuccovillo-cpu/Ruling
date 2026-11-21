// Service worker: rende il sito installabile e utilizzabile offline.
// - file del sito e indice carte: prima la rete (contenuti aggiornati), poi la cache se offline;
// - dettagli delle carte (data/cards/*): prima la cache, aggiornata in background.
const CACHE = "ruling-bot-v2";
const SHELL = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "manifest.webmanifest",
  "vendor/marked.min.js",
  "vendor/purify.min.js",
  "icons/icon-192.png",
  "faq/domande.md",
  "knowledge/01-regole-base.md",
  "knowledge/02-catena-e-timing.md",
  "knowledge/03-meccaniche-e-carte.md",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch (err) {
    const cached = await cache.match(request, { ignoreSearch: request.mode === "navigate" });
    if (cached) return cached;
    if (request.mode === "navigate") return cache.match("index.html");
    throw err;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const update = fetch(request).then((res) => {
    if (res.ok) cache.put(request, res.clone());
    return res;
  });
  if (cached) {
    update.catch(() => {});
    return cached;
  }
  return update;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // API esterne: nessuna cache
  if (url.pathname.includes("/data/cards/")) event.respondWith(staleWhileRevalidate(request));
  else event.respondWith(networkFirst(request));
});
