import { useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'

export function useChartTheme() {
  const theme = useAppStore((s) => s.preferences.theme)

  return useMemo(() => {
    if (theme === 'dark') {
      return {
        grid: 'rgba(255,255,255,0.10)',
        axis: 'rgba(255,255,255,0.60)',
        tooltipBg: '#0B1220',
        tooltipBorder: 'rgba(255,255,255,0.12)',
        cursor: 'rgba(0,188,212,0.10)',
      }
    }

    return {
      grid: 'rgba(0,0,0,0.07)',
      axis: 'rgba(0,0,0,0.60)',
      tooltipBg: '#FFFFFF',
      tooltipBorder: 'rgba(0,0,0,0.10)',
      cursor: 'rgba(76,175,80,0.08)',
    }
  }, [theme])
}
