import { useState, useEffect } from 'react'
import { X, Download, Share2 } from 'lucide-react'
import logoImage from '../imports/image_8d0608d.png'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const isInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    if (isInstalled) return

    // Check if user dismissed in this session
    const dismissed = sessionStorage.getItem('installPromptDismissed')
    if (dismissed) return

    // Detect iOS Safari
    const ua = navigator.userAgent
    const isIosSafari = /iPad|iPhone|iPod/.test(ua) && 
                        /Safari/.test(ua) && 
                        !/CriOS|FxiOS|OPiOS/.test(ua)
    
    setIsIOS(isIosSafari)

    // For iOS Safari, show banner immediately
    if (isIosSafari) {
      setShowBanner(true)
      return
    }

    // For Android/Chrome, listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowBanner(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    sessionStorage.setItem('installPromptDismissed', 'true')
  }

  if (!showBanner) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#0B0F0E',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '16px 20px',
      zIndex: 1000,
      boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
    }}>
      <div style={{
        maxWidth: 560,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        {/* Logo */}
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          <img src={logoImage} alt="BusData" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        {/* Message */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 2 }}>
            Install BusData
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.7)' }}>
            {isIOS ? 'Tap the Share icon, then "Add to Home Screen"' : 'For quick access on your home screen'}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {!isIOS && (
            <button
              onClick={handleInstall}
              style={{
                background: '#F59E0B',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Download size={16} />
              Install
            </button>
          )}
          {isIOS && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255, 255, 255, 0.7)' }}>
              <Share2 size={18} />
            </div>
          )}
          <button
            onClick={handleDismiss}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              padding: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
