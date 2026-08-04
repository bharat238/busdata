// Custom service worker for push notification handling
self.addEventListener('push', (event) => {
  const data = event.data?.json()
  
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

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
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
