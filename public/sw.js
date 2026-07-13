/* CineTrack service worker — offline-first for the app shell,
   stale-while-revalidate for fonts and TMDB images. */
const SHELL_CACHE = 'cinetrack-shell-v1';
const RUNTIME_CACHE = 'cinetrack-runtime-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  // Never cache API calls — always live data when online.
  if (url.hostname === 'api.themoviedb.org') return;
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) return;

  const isSameOrigin = url.origin === self.location.origin;
  const isAsset =
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    url.hostname === 'image.tmdb.org';

  if (isSameOrigin) {
    // Network-first for the shell so deploys show up, cache fallback offline.
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match(event.request, { ignoreSearch: true }))
    );
  } else if (isAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fresh = fetch(event.request)
          .then((res) => {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(event.request, copy));
            return res;
          })
          .catch(() => cached);
        return cached || fresh;
      })
    );
  }
});
