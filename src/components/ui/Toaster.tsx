import { Toaster } from 'react-hot-toast'
import { useAppStore } from '../../store/useAppStore'

export default function AppToaster() {
  const theme = useAppStore((s) => s.preferences.theme)

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style:
          theme === 'dark'
            ? { background: '#0B1220', color: '#E5E7EB', border: '1px solid rgba(255,255,255,0.10)' }
            : { background: '#FFFFFF', color: '#111827', border: '1px solid rgba(0,0,0,0.08)' },
      }}
    />
  )
}
