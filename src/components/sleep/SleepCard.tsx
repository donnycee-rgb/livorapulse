import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { History, MoonStar, Pencil, Sunrise, X } from 'lucide-react'

import { ActionButton } from '../ui/PageHeader'
import { useAuthStore } from '../../store/useAuthStore'
import { useSleepSession } from '../../store/useSleepSession'
import { fmtClock, fmtDuration } from '../../lib/sleep'
import { Moon, NightSky } from './NightSky'
import { openSleepSheet } from './SleepSheet'
import { useElapsedMinutes } from './SleepBanner'

/**
 * The Sleep tab's main card. Asleep: when it started and "I'm awake".
 * Otherwise: last night (with its times when known), naps, and the two ways
 * to log: "Going to sleep" now, or a past sleep typed in.
 */
export default function SleepCard({ nightHours, napMinutes, nightStart, nightEnd }: {
  nightHours: number
  napMinutes: number
  nightStart?: string | null
  nightEnd?: string | null
}) {
  const userId = useAuthStore((s) => s.user?.id)
  const { startedAt, userId: owner, start, clear } = useSleepSession()
  const asleep = !!startedAt && owner === userId
  const elapsed = useElapsedMinutes(asleep ? startedAt : null)
  const [confirmCancel, setConfirmCancel] = useState(false)
  useEffect(() => { if (!confirmCancel) return; const t = setTimeout(() => setConfirmCancel(false), 4000); return () => clearTimeout(t) }, [confirmCancel])

  const hasTimes = !!(nightStart && nightEnd)
  const nightMinutes = Math.round(nightHours * 60)

  return (
    <section className="lp-card rounded-3xl overflow-hidden" aria-label="Sleep">
      <NightSky className="px-5 pt-5 pb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-indigo-200/70">
              {asleep ? 'Asleep' : 'Last night'}
            </div>
            {asleep ? (
              <>
                <div className="mt-1 text-[30px] font-black tabular-nums leading-tight">{fmtDuration(elapsed)}</div>
                <div className="text-[13px] text-indigo-100/80">since {fmtClock(startedAt!)}</div>
              </>
            ) : nightMinutes > 0 ? (
              <>
                <div className="mt-1 text-[30px] font-black tabular-nums leading-tight">{fmtDuration(nightMinutes)}</div>
                <div className="text-[13px] text-indigo-100/80">
                  {hasTimes ? `${fmtClock(Date.parse(nightStart!))} to ${fmtClock(Date.parse(nightEnd!))}` : 'Logged in hours'}
                  {napMinutes > 0 && ` · plus ${fmtDuration(napMinutes)} of naps`}
                </div>
              </>
            ) : (
              <>
                <div className="mt-1 text-[22px] font-bold leading-tight">Not logged yet</div>
                <div className="text-[13px] text-indigo-100/80">
                  {napMinutes > 0 ? `${fmtDuration(napMinutes)} of naps today` : 'Tap when you go to bed, or add last night’s times.'}
                </div>
              </>
            )}
          </div>
          <Moon size={44} className="mt-1" />
        </div>
      </NightSky>

      <div className="p-4 grid gap-2">
        {asleep ? (
          <>
            <ActionButton icon={Sunrise} primary onClick={() => openSleepSheet({ mode: 'wake' })}>I&apos;m awake</ActionButton>
            <ActionButton icon={X} onClick={() => {
              if (!confirmCancel) { setConfirmCancel(true); return }
              clear(); setConfirmCancel(false); toast('Cancelled. Nothing was saved.')
            }}>{confirmCancel ? 'Tap again to cancel' : 'Cancel'}</ActionButton>
          </>
        ) : (
          <>
            <ActionButton icon={MoonStar} primary onClick={() => {
              if (!userId) return
              start(userId)
              toast('Sleep well. Tap “I’m awake” when you get up.', { icon: <MoonStar size={18} aria-hidden /> })
            }}>Going to sleep</ActionButton>
            {hasTimes ? (
              <ActionButton icon={Pencil} onClick={() => openSleepSheet({ mode: 'log', start: Date.parse(nightStart!), end: Date.parse(nightEnd!), title: 'Edit last night' })}>
                Edit last night
              </ActionButton>
            ) : (
              <ActionButton icon={History} onClick={() => openSleepSheet({ mode: 'log' })}>Log a past sleep</ActionButton>
            )}
          </>
        )}
      </div>
      {!asleep && hasTimes && (
        <button type="button" onClick={() => openSleepSheet({ mode: 'log' })}
          className="px-5 pb-4 -mt-1 text-[12.5px] font-semibold text-ui-muted hover:text-ui-ink">
          Log another sleep or a nap
        </button>
      )}
    </section>
  )
}
