// Custom service worker for push notification handling and update lifecycle

const CACHE_VERSION = 'v1'
const CACHE_NAME = `busdata-${CACHE_VERSION}`

// Install event - skip waiting to activate immediately
self.addEventListener('install', (event) => {
  console.log('[SW] Installing new service worker')
  self.skipWaiting()
})

// Activate event - claim clients and clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new service worker')
  event.waitUntil(
    Promise.all([
      // Take control of all clients immediately
      self.clients.claim(),
      // Delete old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName.startsWith('busdata-')) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
    ])
  )
})

// Fetch event - network-first for navigation, cache-first for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Network-first for navigation requests (HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the fresh response
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
          return response
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request)
        })
    )
    return
  }

  // For non-navigation requests, let Workbox handle caching
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
    })
  )
})

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received')

  try {
    const data = event.data?.json()
    console.log('[SW] Push payload:', data)

    const title = data?.title || 'Log your bus trip'
    const body = data?.body || 'Tap to record the bus you just rode'
    const icon = '/icon-192.png'

    const options = {
      body,
      icon,
      badge: '/icon-192.png',
      requireInteraction: false, // Makes notification dismissible (standard OS behavior)
      tag: 'bus-reminder', // Allows replacing notifications with same tag
    }

    console.log('[SW] Showing notification:', title, options)
    event.waitUntil(
      self.registration.showNotification(title, options)
    )
  } catch (error) {
    console.error('[SW] Error in push event handler:', error)
    // Still attempt to show a fallback notification
    event.waitUntil(
      self.registration.showNotification('Log your bus trip', {
        body: 'Tap to record the bus you just rode',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'bus-reminder'
      })
    )
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  // Focus or open the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url === self.location.origin && 'focus' in client) {
          return client.focus()
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow('/')
      }
    })
  )
})
