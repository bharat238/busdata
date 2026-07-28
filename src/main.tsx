import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Service worker registration for PWA - register immediately
if ('serviceWorker' in navigator && import.meta.env.PROD) {
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
            window.location.reload()
          }
        })
      }
    })
  }).catch((registrationError) => {
    console.log('SW registration failed: ', registrationError)
  })

  // Fix input focus issues in PWA
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Reload when a new service worker takes control
    window.location.reload()
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
