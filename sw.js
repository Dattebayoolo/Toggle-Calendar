/**
 * sw.js — Toggle Calendar Service Worker (V0.2)
 * Cache-first strategy for offline-first PWA support.
 * Caches all core app assets on install, serves from cache on fetch.
 */

const CACHE_NAME = 'toggle-cal-v0.2';
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
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

/* ── Fetch: cache-first, network fallback ── */
self.addEventListener('fetch', event => {
  // Skip non-GET and cross-origin (Google Fonts etc) — let them go to network
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

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
        // Offline fallback for navigation requests — serve index.html
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
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
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
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
