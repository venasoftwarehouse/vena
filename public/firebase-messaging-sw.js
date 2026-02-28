importScripts("https://www.gstatic.com/firebasejs/9.2.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.2.0/firebase-messaging-compat.js");

// REPLACE WITH YOUR OWN FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: "",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/favicon.svg",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

const CACHE_NAME = "dianova-v1";
// Only cache static assets that are expected to exist in the `public/` folder.
// Do NOT include client-side routed SPA paths like `/scan` or `/pwa` which
// may 404 during install. Instead provide an `offline.html` navigation
// fallback for users who are offline.
const urlsToCache = [
  "/",
  "/offline.html",
  "/favicon.svg",
  "/apple-touch-icon.svg",
  "/favicon-16x16.svg",
  "/favicon-32x32.svg",
  "/site.webmanifest",
];

// Install the service worker and cache assets
self.addEventListener("install", (event) => {
  // Use a resilient caching strategy: attempt to fetch & cache each resource
  // individually and ignore failures so the install step doesn't reject if
  // one resource is unavailable (which causes the TypeError you saw).
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      for (const url of urlsToCache) {
        try {
          // Use no-cache to ensure fresh fetch during install
          const response = await fetch(url, { cache: 'no-cache' });
          if (response && response.ok) {
            await cache.put(url, response.clone());
          } else {
            // Log and skip this resource if not ok
            console.warn('[SW] Resource not cached (status):', url, response && response.status);
          }
        } catch (err) {
          // Fetch failed for this particular resource — log and continue
          console.warn('[SW] Resource not cached (error):', url, err);
        }
      }
      // Activate immediately on successful install tasks
      await self.skipWaiting();
    } catch (err) {
      console.error('[SW] Install step failed:', err);
      // Do not rethrow — swallow to avoid blocking installation due to caching
    }
  })());
});

// Serve cached content when offline
self.addEventListener("fetch", (event) => {
  event.respondWith((async () => {
    try {
      // Handle navigation requests (HTML) specially: try network first, then
      // fallback to the cached offline page.
      if (event.request.mode === 'navigate') {
        try {
          const networkResponse = await fetch(event.request);
          return networkResponse;
        } catch (networkErr) {
          console.warn('[SW] Navigation request failed, returning offline page:', event.request.url, networkErr);
          const fallback = await caches.match('/offline.html');
          return fallback || new Response('Offline', { status: 503, statusText: 'Offline' });
        }
      }

      const cached = await caches.match(event.request);
      if (cached) return cached;
      // If not in cache, try the network
      return await fetch(event.request);
    } catch (err) {
      // Network failed (offline). Return a simple fallback response.
      console.warn('[SW] Fetch failed, returning generic fallback for:', event.request.url, err);
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    }
  })());
});

// Update the service worker and clean up old caches
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
