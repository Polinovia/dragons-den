const CACHE_NAME = "dragons-den-v1";
const PRECACHE_URLS = ["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never intercept API routes or server actions — always hit the network.
  // Caching authenticated responses here could leak one user's data to
  // another user of the same shared/public device.
  if (url.pathname.startsWith("/api/") || request.headers.get("Next-Action")) {
    return;
  }

  if (request.mode === "navigate") {
    // Network-first for pages, so signed-in users always see fresh, correctly
    // scoped content. Only falls back to a cached shell when fully offline.
    event.respondWith(fetch(request).catch(() => caches.match("/")));
    return;
  }

  // Cache-first for genuinely static assets (icons, avatars, built chunks).
  if (
    url.pathname.startsWith("/icon") ||
    url.pathname.startsWith("/avatars/") ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        });
      }),
    );
  }
});
