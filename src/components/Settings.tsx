import { useState, useEffect } from 'react'
import { Bell, X, Info } from 'lucide-react'
import { supabase, supabaseConfigured } from '../lib/supabase'

export default function Settings({ showFloatingButton = true }: { showFloatingButton?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showOptIn, setShowOptIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handleSettingsTrigger = () => setIsOpen(true)
    document.addEventListener('settings-trigger', handleSettingsTrigger as any)
    return () => document.removeEventListener('settings-trigger', handleSettingsTrigger as any)
  }, [])

  useEffect(() => {
    // Check if user has already seen the opt-in
    const hasSeenOptIn = localStorage.getItem('pushOptInSeen')
    if (!hasSeenOptIn && Notification.permission === 'default') {
      setShowOptIn(true)
    }

    // Check current subscription status
    checkSubscriptionStatus()
  }, [])

  // Re-check subscription status when settings modal is opened
  useEffect(() => {
    if (isOpen) {
      checkSubscriptionStatus()
    }
  }, [isOpen])

  const checkSubscriptionStatus = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)

      if (subscription && supabaseConfigured && supabase) {
        // Check mute status from Supabase
        console.log('[Settings] Checking mute status for endpoint:', subscription.endpoint)
        const { data, error } = await supabase
          .from('push_subscriptions')
          .select('muted')
          .eq('endpoint', subscription.endpoint)
          .single()
        
        console.log('[Settings] Mute status query result:', { data, error })
        
        if (error) {
          console.error('[Settings] Error fetching mute status:', error)
          // Default to muted=true if we can't fetch the status to avoid showing incorrect ON state
          setIsMuted(true)
        } else if (data) {
          setIsMuted(data.muted || false)
        } else {
          // No data found - subscription might not be in database yet
          // Default to muted=true to be safe
          setIsMuted(true)
        }
      } else if (!subscription) {
        // No subscription exists
        setIsMuted(false)
      }
    } catch (e) {
      console.error('Error checking subscription:', e)
      // Default to muted=true on error to avoid showing incorrect ON state
      setIsMuted(true)
    }
  }

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      setError('Notifications are not supported in this browser.')
      return
    }

    // Check if this is iOS Safari not installed as PWA
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches
    
    if (isIOS && !isStandalone) {
      setError('To receive notifications on iOS, please add this app to your home screen first (iOS 16.4+).')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const permission = await Notification.requestPermission()

      if (permission === 'granted') {
        await subscribeToPush()
      } else if (permission === 'denied') {
        setError('Notification permission was denied. You can enable it in your browser settings.')
      }
    } catch (e) {
      setError('Failed to request notification permission.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToPush = async () => {
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
    if (!vapidPublicKey) {
      setError('VAPID public key is not configured.')
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const convertedKey = urlBase64ToUint8Array(vapidPublicKey)
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey as any
      })

      // Send subscription to Supabase
      if (supabaseConfigured && supabase) {
        const { error } = await supabase
          .from('push_subscriptions')
          .insert({
            endpoint: subscription.endpoint,
            p256dh: subscription.toJSON().keys?.p256dh,
            auth: subscription.toJSON().keys?.auth,
            muted: false
          })

        if (error) {
          setError('Failed to save subscription.')
          return
        }
      }

      setIsSubscribed(true)
      setIsMuted(false) // Explicitly set muted to false for new subscriptions
      setShowOptIn(false)
      localStorage.setItem('pushOptInSeen', 'true')
    } catch (e) {
      setError('Failed to subscribe to push notifications.')
      console.error(e)
    }
  }

  const toggleMute = async () => {
    if (!supabaseConfigured || !supabase) {
      setError('Supabase is not configured.')
      return
    }

    const newMutedState = !isMuted
    setIsMuted(newMutedState)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (!subscription) {
        setError('No active subscription found.')
        setIsMuted(!newMutedState)
        return
      }

      console.log('[Settings] Toggle mute:', newMutedState, 'for endpoint:', subscription.endpoint)
      
      const { data, error, count } = await supabase
        .from('push_subscriptions')
        .update({ muted: newMutedState })
        .eq('endpoint', subscription.endpoint)
        .select()

      console.log('[Settings] Update response:', { data, error, count })

      if (error) {
        console.error('[Settings] Update failed:', error)
        setIsMuted(!newMutedState) // Revert on error
        setError('Failed to update mute status.')
      } else if (count === 0) {
        console.error('[Settings] Update matched 0 rows - endpoint might not exist in database')
        setIsMuted(!newMutedState) // Revert if no rows were updated
        setError('Failed to update mute status - subscription not found in database.')
      }
    } catch (e) {
      console.error('[Settings] Toggle mute error:', e)
      setIsMuted(!newMutedState) // Revert on error
      setError('Failed to update mute status.')
    }
  }

  const dismissOptIn = () => {
    setShowOptIn(false)
    localStorage.setItem('pushOptInSeen', 'true')
  }

  // Helper function to convert VAPID key
  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  if (!isOpen) {
    return (
      <>
        {/* Opt-in Banner */}
        {showOptIn && (
          <div style={{
            position: 'fixed',
            bottom: 80,
            left: 16,
            right: 16,
            background: '#fff',
            borderRadius: 16,
            padding: 16,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            zIndex: 100,
            border: '1px solid #E5E7EB'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#FEF3C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Bell size={20} color="#D97706" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 4 }}>
                  Get trip reminders
                </div>
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12, lineHeight: 1.5 }}>
                  Receive gentle reminders to log your bus trips at 8:30 AM, 1:30 PM, and 6:30 PM IST.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={requestPermission}
                    disabled={loading}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      background: loading ? '#CBD5E1' : '#F59E0B',
                      color: '#fff',
                      border: 'none',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? 'Enabling...' : 'Enable reminders'}
                  </button>
                  <button
                    onClick={dismissOptIn}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      background: '#F3F4F6',
                      color: '#6B7280',
                      border: 'none',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Maybe later
                  </button>
                </div>
                {error && (
                  <div style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <Info size={12} /> {error}
                  </div>
                )}
              </div>
              <button
                onClick={dismissOptIn}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  color: '#9CA3AF'
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Settings Button - only show if showFloatingButton is true */}
        {showFloatingButton && (
          <button
            onClick={() => setIsOpen(true)}
            style={{
              position: 'fixed',
              top: 16,
              right: 16,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '9999px',
              padding: '6px',
              color: '#6B7280',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              cursor: 'pointer',
              zIndex: 50,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        )}
      </>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '24px 24px 0 0',
        width: '100%',
        maxWidth: 560,
        maxHeight: '80vh',
        overflowY: 'auto',
        padding: '24px 20px 32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: 0 }}>
            Settings
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              color: '#9CA3AF'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Notification Settings */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#6B7280', marginBottom: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Notifications
          </div>

          <div style={{
            background: '#F9FAFB',
            borderRadius: 16,
            padding: 16,
            border: '1px solid #E5E7EB'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 4 }}>
                  Bus data reminders
                </div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>
                  {isSubscribed ? 'Enabled' : 'Not enabled'}
                </div>
              </div>
              {isSubscribed ? (
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: '#DCFCE7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Bell size={16} color="#15803D" />
                </div>
              ) : (
                <button
                  onClick={requestPermission}
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: loading ? '#CBD5E1' : '#F59E0B',
                    color: '#fff',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Enabling...' : 'Enable'}
                </button>
              )}
            </div>

            {isSubscribed && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid #E5E7EB' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 4 }}>
                    Mute reminders
                  </div>
                  <div style={{ fontSize: 13, color: '#6B7280' }}>
                    Temporarily stop receiving notifications
                  </div>
                </div>
                <button
                  onClick={toggleMute}
                  style={{
                    width: 52,
                    height: 28,
                    borderRadius: 14,
                    background: isMuted ? '#E5E7EB' : '#10B981',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: 4,
                    left: isMuted ? 4 : 28,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    transition: 'left 0.2s'
                  }} />
                </button>
              </div>
            )}
          </div>

          {error && (
            <div style={{
              marginTop: 12,
              padding: 12,
              background: '#FEE2E2',
              borderRadius: 10,
              border: '1px solid #FECACA',
              fontSize: 13,
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <Info size={16} /> {error}
            </div>
          )}

          <div style={{
            marginTop: 12,
            padding: 12,
            background: '#F3F4F6',
            borderRadius: 10,
            fontSize: 12,
            color: '#6B7280',
            lineHeight: 1.5
          }}>
            <strong>Reminder schedule:</strong> 8:30 AM, 1:30 PM, 6:30 PM IST. Notifications are dismissible and can be muted anytime.
          </div>
        </div>

        {/* App Info */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#6B7280', marginBottom: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            About
          </div>
          <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
            BusData helps you share real bus arrival and departure times with your community.
          </div>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 8 }}>
            Version 1.0.0
          </div>
        </div>
      </div>
    </div>
  )
}
