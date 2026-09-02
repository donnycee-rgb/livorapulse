import { useEffect, useRef } from 'react'
import { Toaster, useToasterStore, toast } from 'react-hot-toast'
import { useAppStore } from '../../store/useAppStore'

// Limit visible toasts and collapse when too many arrive
const MAX_VISIBLE = 3

export default function AppToaster() {
  const theme = useAppStore((s) => s.preferences.theme)
  const { toasts } = useToasterStore()

  // Dismiss oldest toasts when limit is exceeded
  useEffect(() => {
    const visible = toasts.filter(t => t.visible)
    if (visible.length > MAX_VISIBLE) {
      // Dismiss the oldest ones beyond the limit
      visible
        .slice(0, visible.length - MAX_VISIBLE)
        .forEach(t => toast.dismiss(t.id))
    }
  }, [toasts])

  const isDark = theme === 'dark'

  return (
    <Toaster
      position="bottom-right"
      reverseOrder={false}
      gutter={8}
      containerStyle={{ bottom: 80 }} // above bottom nav on mobile
      toastOptions={{
        duration: 2800,
        style: isDark
          ? {
              background: 'rgba(15,23,42,0.92)',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              borderRadius: '14px',
              fontSize: '13px',
              fontWeight: '500',
              padding: '10px 14px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              maxWidth: '320px',
            }
          : {
              background: 'rgba(255,255,255,0.94)',
              color: '#0f172a',
              border: '1px solid rgba(0,0,0,0.07)',
              backdropFilter: 'blur(12px)',
              borderRadius: '14px',
              fontSize: '13px',
              fontWeight: '500',
              padding: '10px 14px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              maxWidth: '320px',
            },
        success: {
          iconTheme: {
            primary: '#4CAF50',
            secondary: isDark ? '#0f172a' : '#fff',
          },
          duration: 2200,
        },
        error: {
          iconTheme: {
            primary: '#FF6B6B',
            secondary: isDark ? '#0f172a' : '#fff',
          },
          duration: 3500,
        },
      }}
    />
  )
}