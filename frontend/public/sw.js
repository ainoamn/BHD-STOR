/**
 * BHD Marketplace Service Worker
 * Provides offline support, caching, background sync, and push notifications
 * @version 1.0.0
 */

const SW_VERSION = "1.0.0";
const CACHE_PREFIX = "bhd-marketplace";
const STATIC_CACHE = `${CACHE_PREFIX}-static-${SW_VERSION}`;
const DYNAMIC_CACHE = `${CACHE_PREFIX}-dynamic-${SW_VERSION}`;
const IMAGE_CACHE = `${CACHE_PREFIX}-images-${SW_VERSION}`;
const API_CACHE = `${CACHE_PREFIX}-api-${SW_VERSION}`;

// Precache assets - core shell
const PRECACHE_ASSETS = [
  "/",
  "/offline",
  "/offline.html",
  "/ar",
  "/en",
  // Critical CSS
  "/_next/static/css/app.css",
  "/_next/static/css/app-layout.css",
  // Main JS bundles (will be updated by Next.js)
  "/_next/static/chunks/main.js",
  "/_next/static/chunks/app.js",
  "/_next/static/chunks/webpack.js",
  // Fonts
  "https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;600;700;800;900&display=swap",
  // Default icons
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  // Logo
  "/images/logo.png",
  "/images/logo-dark.png",
];

// Routes that should always try network first
const NETWORK_FIRST_ROUTES = [
  "/api/",
  "/graphql",
  "/auth",
  "/checkout",
  "/payment",
];

// Static asset extensions - cache first
const STATIC_EXTENSIONS = [
  ".js",
  ".css",
  ".woff2",
  ".woff",
  ".ttf",
  ".eot",
  ".otf",
];

// Image extensions
const IMAGE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".ico",
];

// Install Event - Precache static assets
self.addEventListener("install", (event) => {
  console.log(`[SW] Installing v${SW_VERSION}`);

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Precaching static assets");
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log("[SW] Precache complete");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("[SW] Precache failed:", error);
        // Continue installation even if some assets fail
        return self.skipWaiting();
      })
  );
});

// Activate Event - Clean old caches
self.addEventListener("activate", (event) => {
  console.log(`[SW] Activating v${SW_VERSION}`);

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old versioned caches
              return (
                cacheName.startsWith(CACHE_PREFIX) &&
                cacheName !== STATIC_CACHE &&
                cacheName !== DYNAMIC_CACHE &&
                cacheName !== IMAGE_CACHE &&
                cacheName !== API_CACHE
              );
            })
            .map((cacheName) => {
              console.log(`[SW] Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log("[SW] Activation complete");
        // Claim all clients immediately
        return self.clients.claim();
      })
      .then(() => {
        // Notify all clients that SW is activated
        return self.clients.matchAll({ type: "window" }).then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: "SW_ACTIVATED", version: SW_VERSION });
          });
        });
      })
  );
});

// Helper: Check if URL matches any pattern
function matchesPatterns(url, patterns) {
  return patterns.some((pattern) => {
    if (typeof pattern === "string") {
      return url.includes(pattern);
    }
    if (pattern instanceof RegExp) {
      return pattern.test(url);
    }
    return false;
  });
}

// Helper: Check if URL has extension
function hasExtension(url, extensions) {
  const pathname = new URL(url).pathname.toLowerCase();
  return extensions.some((ext) => pathname.endsWith(ext));
}

// Fetch Event - Caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip Chrome extensions and third-party analytics
  if (
    url.protocol !== "https:" &&
    url.protocol !== "http:" &&
    !url.hostname.includes("localhost")
  ) {
    return;
  }

  // API requests - Network first with cache fallback
  if (matchesPatterns(url.href, NETWORK_FIRST_ROUTES)) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Image requests - Cache first with network fallback
  if (hasExtension(url.href, IMAGE_EXTENSIONS) || request.destination === "image") {
    event.respondWith(imageCacheStrategy(request));
    return;
  }

  // Static assets (JS, CSS, fonts) - Cache first
  if (
    hasExtension(url.href, STATIC_EXTENSIONS) ||
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font"
  ) {
    event.respondWith(staticCacheStrategy(request));
    return;
  }

  // Navigation requests (page loads) - Network first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(navigationStrategy(request));
    return;
  }

  // Default: Stale while revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// Cache Strategy: Static assets - Cache First
async function staticCacheStrategy(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error("[SW] Static fetch failed:", error);
    // Return a minimal fallback for critical assets
    if (request.destination === "style") {
      return new Response("/* CSS fallback */", {
        headers: { "Content-Type": "text/css" },
      });
    }
    return new Response("", { status: 408, statusText: "Request Timeout" });
  }
}

// Cache Strategy: Images - Cache First with size limit
async function imageCacheStrategy(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(IMAGE_CACHE);
      // Clone before reading
      const responseToCache = networkResponse.clone();

      // Check response size (skip caching very large images)
      const contentLength = networkResponse.headers.get("content-length");
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (!contentLength || parseInt(contentLength) < maxSize) {
        cache.put(request, responseToCache);
      }

      // Clean up old image cache entries periodically
      cleanupImageCache(cache);

      return networkResponse;
    }
    return networkResponse;
  } catch (error) {
    console.error("[SW] Image fetch failed:", error);
    // Return transparent 1x1 pixel as fallback
    const transparentPixel =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    return fetch(transparentPixel);
  }
}

// Cache Strategy: Navigation - Network First with offline fallback
async function navigationStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache successful page loads
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    throw new Error(`HTTP ${networkResponse.status}`);
  } catch (error) {
    console.log("[SW] Navigation failed, trying cache:", error);

    // Try to serve from cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Try to serve the root page (for SPA routing)
    const rootCached = await caches.match("/");
    if (rootCached) {
      return rootCached;
    }

    // Return offline page
    const offlinePage = await caches.match("/offline.html");
    if (offlinePage) {
      return offlinePage;
    }

    // Ultimate fallback
    return new Response(
      `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head><meta charset="utf-8"><title>غير متصل</title></head>
      <body style="font-family:system-ui;text-align:center;padding:40px;">
        <h1>أنت غير متصل بالإنترنت</h1>
        <p>يرجى التحقق من اتصالك والمحاولة مرة أخرى.</p>
        <button onclick="location.reload()">إعادة المحاولة</button>
      </body></html>
      `,
      {
        headers: { "Content-Type": "text/html; charset=utf-8" },
        status: 503,
        statusText: "Service Unavailable",
      }
    );
  }
}

// Cache Strategy: Network First (for API calls)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    throw new Error(`HTTP ${networkResponse.status}`);
  } catch (error) {
    console.log("[SW] API request failed, trying cache:", error);
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response(
      JSON.stringify({
        error: "offline",
        message: "You are offline. Showing cached data if available.",
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 503,
      }
    );
  }
}

// Cache Strategy: Stale While Revalidate
async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        caches.open(cacheName).then((cache) => {
          cache.put(request, networkResponse.clone());
        });
      }
      return networkResponse;
    })
    .catch((error) => {
      console.error("[SW] Stale-while-revalidate fetch failed:", error);
      return cached;
    });

  return cached || fetchPromise;
}

// Clean up old image cache entries (keep last 100)
async function cleanupImageCache(cache) {
  const keys = await cache.keys();
  const maxEntries = 100;
  if (keys.length > maxEntries) {
    const toDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(toDelete.map((key) => cache.delete(key)));
  }
}

// Background Sync - Queue offline actions
self.addEventListener("sync", (event) => {
  console.log(`[SW] Background sync: ${event.tag}`);

  switch (event.tag) {
    case "sync-cart-actions":
      event.waitUntil(syncCartActions());
      break;
    case "sync-wishlist":
      event.waitUntil(syncWishlistActions());
      break;
    case "sync-reviews":
      event.waitUntil(syncReviewActions());
      break;
    case "sync-orders":
      event.waitUntil(syncOrderActions());
      break;
    default:
      console.log(`[SW] Unknown sync tag: ${event.tag}`);
  }
});

// Sync queued cart actions
async function syncCartActions() {
  try {
    const db = await openDB("bhd-sync", 1);
    const actions = await db.getAll("cart-actions");

    for (const action of actions) {
      try {
        const response = await fetch("/api/cart/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action),
        });

        if (response.ok) {
          await db.delete("cart-actions", action.id);
          console.log("[SW] Cart action synced:", action.id);
        }
      } catch (error) {
        console.error("[SW] Cart sync failed for action:", action.id, error);
      }
    }
  } catch (error) {
    console.error("[SW] Cart sync error:", error);
  }
}

// Sync wishlist actions
async function syncWishlistActions() {
  try {
    const db = await openDB("bhd-sync", 1);
    const actions = await db.getAll("wishlist-actions");

    for (const action of actions) {
      try {
        await fetch("/api/wishlist/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action),
        });
        await db.delete("wishlist-actions", action.id);
      } catch (error) {
        console.error("[SW] Wishlist sync failed:", error);
      }
    }
  } catch (error) {
    console.error("[SW] Wishlist sync error:", error);
  }
}

// Sync review actions
async function syncReviewActions() {
  try {
    const db = await openDB("bhd-sync", 1);
    const actions = await db.getAll("review-actions");

    for (const action of actions) {
      try {
        await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action),
        });
        await db.delete("review-actions", action.id);
      } catch (error) {
        console.error("[SW] Review sync failed:", error);
      }
    }
  } catch (error) {
    console.error("[SW] Review sync error:", error);
  }
}

// Sync order actions
async function syncOrderActions() {
  try {
    const db = await openDB("bhd-sync", 1);
    const actions = await db.getAll("order-actions");

    for (const action of actions) {
      try {
        await fetch("/api/orders/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action),
        });
        await db.delete("order-actions", action.id);
      } catch (error) {
        console.error("[SW] Order sync failed:", error);
      }
    }
  } catch (error) {
    console.error("[SW] Order sync error:", error);
  }
}

// Push Event Handler
self.addEventListener("push", (event) => {
  console.log("[SW] Push received:", event);

  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {
    data = { title: event.data?.text() || "BHD Marketplace" };
  }

  const {
    title = "BHD Marketplace",
    body = "لديك إشعار جديد",
    icon = "/icons/icon-192x192.png",
    badge = "/icons/icon-72x72.png",
    tag = "bhd-notification",
    requireInteraction = false,
    actions = [],
    data: notificationData = {},
  } = data;

  const options = {
    body,
    icon,
    badge,
    tag,
    requireInteraction,
    dir: "rtl",
    lang: "ar",
    vibrate: [200, 100, 200],
    renotify: true,
    data: {
      ...notificationData,
      url: notificationData.url || "/",
      timestamp: Date.now(),
    },
    actions: actions.length
      ? actions
      : [
          {
            action: "open",
            title: "فتح",
            icon: "/icons/action-open.png",
          },
          {
            action: "dismiss",
            title: "تجاهل",
            icon: "/icons/action-dismiss.png",
          },
        ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification Click Handler
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event);

  const { notification } = event;
  const { url = "/" } = notification.data || {};

  event.notification.close();

  switch (event.action) {
    case "open":
    case "":
    default:
      event.waitUntil(openOrFocusWindow(url));
      break;

    case "dismiss":
      // Just close the notification
      break;

    case "view-order":
      event.waitUntil(openOrFocusWindow(notification.data?.orderUrl || url));
      break;

    case "reply":
      // Handle reply action
      event.waitUntil(openOrFocusWindow(url));
      break;
  }
});

// Close notification handler
self.addEventListener("notificationclose", (event) => {
  console.log("[SW] Notification closed:", event);
});

// Helper: Open or focus window
async function openOrFocusWindow(url) {
  const urlToOpen = new URL(url, self.location.origin).href;

  const windowClients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });

  // Focus existing client with matching URL
  for (const client of windowClients) {
    if (client.url === urlToOpen && "focus" in client) {
      return client.focus();
    }
  }

  // Focus any existing client and navigate
  if (windowClients.length > 0) {
    const client = windowClients[0];
    if ("navigate" in client) {
      await client.navigate(urlToOpen);
    }
    if ("focus" in client) {
      return client.focus();
    }
  }

  // Open new window
  return self.clients.openWindow(urlToOpen);
}

// Message handler - Communication with main thread
self.addEventListener("message", (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case "SKIP_WAITING":
      console.log("[SW] Skip waiting message received");
      self.skipWaiting();
      break;

    case "GET_VERSION":
      event.source?.postMessage({
        type: "SW_VERSION",
        version: SW_VERSION,
      });
      break;

    case "CACHE_URLS":
      if (payload?.urls && Array.isArray(payload.urls)) {
        event.waitUntil(
          caches
            .open(DYNAMIC_CACHE)
            .then((cache) => cache.addAll(payload.urls))
        );
      }
      break;

    case "CLEAR_CACHE":
      event.waitUntil(
        caches
          .keys()
          .then((names) =>
            Promise.all(
              names
                .filter((name) => name.startsWith(CACHE_PREFIX))
                .map((name) => caches.delete(name))
            )
          )
          .then(() => {
            event.source?.postMessage({
              type: "CACHE_CLEARED",
            });
          })
      );
      break;

    case "SYNC_NOW":
      // Trigger background sync
      if ("sync" in self.registration) {
        self.registration.sync
          .register(payload?.tag || "sync-cart-actions")
          .then(() => {
            console.log("[SW] Sync registered:", payload?.tag);
          })
          .catch((err) => {
            console.error("[SW] Sync registration failed:", err);
          });
      }
      break;

    default:
      break;
  }
});

// Periodic background sync (if supported)
self.addEventListener("periodicsync", (event) => {
  switch (event.tag) {
    case "daily-content-update":
      event.waitUntil(updateCachedContent());
      break;
    default:
      console.log(`[SW] Unknown periodic sync: ${event.tag}`);
  }
});

// Update cached content periodically
async function updateCachedContent() {
  try {
    // Update homepage
    const homeResponse = await fetch("/");
    if (homeResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put("/", homeResponse);
    }

    // Update featured products
    const productsResponse = await fetch("/api/products/featured");
    if (productsResponse.ok) {
      const cache = await caches.open(API_CACHE);
      await cache.put("/api/products/featured", productsResponse);
    }

    console.log("[SW] Periodic content update complete");
  } catch (error) {
    console.error("[SW] Content update failed:", error);
  }
}

// Simple IndexedDB helper for sync queue
function openDB(dbName, version) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(createDBWrapper(request.result));

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("cart-actions")) {
        db.createObjectStore("cart-actions", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("wishlist-actions")) {
        db.createObjectStore("wishlist-actions", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("review-actions")) {
        db.createObjectStore("review-actions", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("order-actions")) {
        db.createObjectStore("order-actions", { keyPath: "id" });
      }
    };
  });
}

// Wrap IndexedDB with promise-based API
function createDBWrapper(db) {
  return {
    getAll: (storeName) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
    delete: (storeName, id) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const request = store.delete(id);
        request.onsuccess = () => resolve(undefined);
        request.onerror = () => reject(request.error);
      }),
  };
}
