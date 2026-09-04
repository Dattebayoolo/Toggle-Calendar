/**
 * sw.js — Toggle Calendar Service Worker (V0.2)
 * Cache-first strategy for offline-first PWA support.
 * Caches all core app assets on install, serves from cache on fetch.
 */

const CACHE_NAME = 'toggle-cal-v0.3.0';
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './js/constants.js',
  './js/state.js',
  './js/utils.js',
  './js/render.js',
  './js/listeners.js',
  './js/main.js',
  './js/components/modal.js',
  './js/components/popover.js',
  './js/components/sidebar.js',
  './js/views/miniCal.js',
  './js/views/monthView.js',
  './js/views/weekView.js',
  './js/views/dayView.js',
  './js/views/agendaView.js',
];

/* ── Install: pre-cache all core assets ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CORE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

/* ── Activate: clean up old caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

/* ── Fetch: network-first for the app shell, cache-first for assets ──
   index.html is network-first so users always get the latest release
   without waiting for a CACHE_NAME bump; hashed/immutable assets are
   cache-first for speed. */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Google Fonts (CSS + woff2): stale-while-revalidate so the app works
  // offline after first load instead of falling back to system fonts.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          const network = fetch(event.request).then(response => {
            if (response && response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          }).catch(() => cached);
          return cached || network;
        })
      )
    );
    return;
  }

  // Same-origin only beyond this point
  if (url.origin !== self.location.origin) return;

  // Navigations (index.html): try network first, fall back to cache offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() =>
        caches.match('./index.html').then(cached => cached || Response.error())
      )
    );
    return;
  }

  // Everything else: cache-first, network fallback
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Only cache successful same-origin responses
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback for asset requests — serve the shell
        return caches.match('./index.html');
      });
    })
  );
});

/* ── Push Notifications (prayer times + event reminders) ── */
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body: data.body || '',
    icon: './icons/icon-192.svg',
    badge: './icons/icon-192.svg',
    tag: data.tag || 'toggle-cal',
    data: { url: data.url || './' },
    vibrate: [200, 100, 200],
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'Toggle Calendar', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      for (const client of cls) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
