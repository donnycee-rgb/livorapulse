import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/useAuthStore'
import { useSleepSession } from '../../store/useSleepSession'
import { openSleepSheet } from './SleepSheet'

/**
 * Links from notifications: ?sleep=start ("Going to sleep" on the bedtime
 * reminder) and ?sleep=wake ("I'm awake" on the morning one). Acted on once,
 * then removed from the address so a refresh doesn't repeat it.
 */
export function useSleepLinks(): void {
  const { search, pathname } = useLocation()
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.user?.id)

  useEffect(() => {
    const params = new URLSearchParams(search)
    const action = params.get('sleep')
    if (!action || !userId) return
    const session = useSleepSession.getState()
    const running = !!session.startedAt && session.userId === userId

    if (action === 'start') {
      if (!running) {
        session.start(userId)
        toast('Sleep well. Tap “I’m awake” when you get up.')
      }
    } else if (action === 'wake') {
      openSleepSheet(running ? { mode: 'wake' } : { mode: 'log', title: 'Log last night' })
    }
    params.delete('sleep')
    params.set('tab', 'sleep')
    navigate({ pathname, search: `?${params}` }, { replace: true })
  }, [search, pathname, navigate, userId])
}
