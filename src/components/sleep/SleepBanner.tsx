import { useEffect, useState } from 'react'
import { Sunrise } from 'lucide-react'

import { useAuthStore } from '../../store/useAuthStore'
import { useSleepSession } from '../../store/useSleepSession'
import { fmtClock, fmtDuration } from '../../lib/sleep'
import { Moon, NightSky } from './NightSky'
import { openSleepSheet } from './SleepSheet'

/** Minutes since `since`, refreshed every 30 seconds */
export function useElapsedMinutes(since: number | null): number {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!since) return
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [since])
  return since ? Math.max(0, Math.floor((now - since) / 60000)) : 0
}

/**
 * While someone is asleep (they tapped "Going to sleep"), a strip of night
 * sky under the header on every page, with the one thing they'll want in the
 * morning: "I'm awake".
 */
export default function SleepBanner() {
  const userId = useAuthStore((s) => s.user?.id)
  const { startedAt, userId: owner } = useSleepSession()
  const elapsed = useElapsedMinutes(startedAt)
  if (!startedAt || !userId || owner !== userId) return null

  const long = elapsed > 16 * 60
  return (
    <NightSky className="border-b border-white/10">
      <div role="status" aria-live="polite"
        className="w-full max-w-[1400px] mx-auto px-4 py-2.5 flex items-center gap-3">
        <Moon size={26} />
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold leading-tight truncate">
            Sleeping since {fmtClock(startedAt)}
          </div>
          <div className="text-[12px] text-indigo-200/80 tabular-nums truncate">
            {long ? 'Forgot to tap? Fix the times when you save.' : `${fmtDuration(elapsed)} so far`}
          </div>
        </div>
        <button type="button" onClick={() => openSleepSheet({ mode: 'wake' })}
          className="flex-shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-[13px] font-bold text-amber-200 bg-amber-300/15 ring-1 ring-amber-300/30 hover:bg-amber-300/25 active:scale-[0.98] transition">
          <Sunrise size={16} /> I&apos;m awake
        </button>
      </div>
    </NightSky>
  )
}
