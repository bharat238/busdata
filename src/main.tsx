import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Service worker registration for PWA - register immediately
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // Guard against infinite reload loops
  const reloadKey = 'sw-reload-pending'
  const hasPendingReload = sessionStorage.getItem(reloadKey)

  navigator.serviceWorker.register('/sw.js').then((registration) => {
    console.log('SW registered: ', registration)

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, reload the page
            console.log('New content available, reloading...')
            sessionStorage.setItem(reloadKey, 'true')
            window.location.reload()
          }
        })
      }
    })
  }).catch((registrationError) => {
    console.log('SW registration failed: ', registrationError)
  })

  // Fix input focus issues in PWA and auto-reload on controllerchange
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Only reload if this is a new update (not from our own reload)
    if (!hasPendingReload) {
      console.log('New service worker activated, reloading...')
      sessionStorage.setItem(reloadKey, 'true')
      window.location.reload()
    } else {
      // Clear the flag after reload completes
      sessionStorage.removeItem(reloadKey)
    }
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
