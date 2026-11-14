import { useEffect } from 'react'
import { useInterval } from '../hooks/useInterval'
import { useAppStore } from '../store/useAppStore'

/**
 * Keeps a running focus session going on every page, not just Productivity.
 * The timer itself runs off the clock (see utils/focusTimer), so this only
 * refreshes the time left and finishes the session when it reaches zero.
 * Renders nothing.
 */
export default function FocusTimerTicker() {
  const running = useAppStore((s) => s.productivity.focusTimer.status === 'running')
  const tick = useAppStore((s) => s.tickFocusTimer)

  useInterval(() => tick(), running ? 1000 : null)

  // Browsers slow timers in background tabs: catch up as soon as the tab is back
  useEffect(() => {
    if (!running) return
    tick()
    const onVisible = () => { if (document.visibilityState === 'visible') tick() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [running, tick])

  return null
}
