import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

export function useThemeSync() {
  const theme = useAppStore((s) => s.preferences.theme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [theme])
}
