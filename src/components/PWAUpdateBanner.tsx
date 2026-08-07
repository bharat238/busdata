import { useState, useEffect } from 'react'

export default function PWAUpdateBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return

    // Check for waiting service worker on mount
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg && reg.waiting) {
        setRegistration(reg)
        setShowBanner(true)
      }
    })

    // Listen for updatefound
    const handleUpdateFound = (reg: ServiceWorkerRegistration) => {
      const newWorker = reg.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setRegistration(reg)
            setShowBanner(true)
          }
        })
      }
    }

    // Register listener on current registration
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) {
        reg.addEventListener('updatefound', () => handleUpdateFound(reg))
      }
    })

    // Listen for new registrations
    const handleControllerChange = () => {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          reg.addEventListener('updatefound', () => handleUpdateFound(reg))
        }
      })
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [])

  const handleRefresh = () => {
    if (!registration || !registration.waiting) return

    setIsUpdating(true)

    // Tell the waiting service worker to skip waiting
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })

    // Listen for controllerchange, then reload only once that fires
    const handleControllerChange = () => {
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange, { once: true })
  }

  const handleDismiss = () => {
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div style={{
      position: 'fixed',
      top: 16,
      left: 16,
      right: 16,
      background: '#fff',
      border: '1px solid #E5E7EB',
      borderRadius: 12,
      padding: '12px 16px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 2 }}>
          New version available
        </div>
        <div style={{ fontSize: 12, color: '#6B7280' }}>
          Refresh to get the latest updates
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={handleRefresh}
          disabled={isUpdating}
          style={{
            background: '#64748B',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: isUpdating ? 'not-allowed' : 'pointer',
            opacity: isUpdating ? 0.6 : 1,
          }}
        >
          {isUpdating ? 'Updating...' : 'Refresh'}
        </button>
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: '#9CA3AF',
            cursor: 'pointer',
            padding: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
