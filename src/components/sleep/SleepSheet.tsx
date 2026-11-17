import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { AlertTriangle } from 'lucide-react'

import Modal from '../ui/Modal'
import { useAppStore } from '../../store/useAppStore'
import { useSleepSession } from '../../store/useSleepSession'
import { fmtDuration, greeting, sleepKind, spanProblem, timesToSpan, toTimeInput, type SleepKind } from '../../lib/sleep'

// One sheet for every way a sleep gets saved:
//  - 'wake': after "I'm awake", times filled from the tap, ready to save
//  - 'log':  "Log a past sleep" or "Edit last night", times typed in
// Mount <SleepSheetHost /> once (Layout does) and open it with openSleepSheet().

type Opening =
  | { mode: 'wake' }
  | { mode: 'log'; start?: number; end?: number; title?: string }

let opening: Opening | null = null
const subs = new Set<() => void>()
const setOpening = (o: Opening | null) => { opening = o; subs.forEach((f) => f()) }
export const openSleepSheet = (o: Opening) => setOpening(o)

export function SleepSheetHost() {
  const o = useSyncExternalStore((l) => { subs.add(l); return () => { subs.delete(l) } }, () => opening, () => null)
  const startedAt = useSleepSession((s) => s.startedAt)
  // New form state each time it opens
  const key = useMemo(() => (o ? Math.random() : 0), [o])
  const title = !o ? '' : o.mode === 'wake' ? greeting(Date.now()) : o.title ?? 'Log a sleep'
  return (
    <Modal open={!!o} onClose={() => setOpening(null)} title={title}>
      {o && <SleepForm key={key} opening={o} startedAt={startedAt} onDone={() => setOpening(null)} />}
    </Modal>
  )
}

function SleepForm({ opening: o, startedAt, onDone }: { opening: Opening; startedAt: number | null; onDone: () => void }) {
  const logSleep = useAppStore((s) => s.logSleep)
  const clearSession = useSleepSession((s) => s.clear)
  const now = Date.now()

  // Starting times: the tap, the night being edited, or a usual night (22:30 → 06:30)
  const initial = (() => {
    if (o.mode === 'wake' && startedAt) return { start: startedAt, end: now }
    if (o.mode === 'log' && o.start && o.end) return { start: o.start, end: o.end }
    const d = new Date(now)
    const todays = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 6, 30).getTime()
    const end = todays > now ? todays - 24 * 3600000 : todays
    return { start: end - 8 * 3600000, end }
  })()
  const todayStart = new Date(new Date(now).toDateString()).getTime()

  const [bed, setBed] = useState(toTimeInput(initial.start))
  const [wake, setWake] = useState(toTimeInput(initial.end))
  const [wokeYesterday, setWokeYesterday] = useState(initial.end < todayStart)
  const [picked, setPicked] = useState<SleepKind | null>(null)
  const [busy, setBusy] = useState(false)

  const wakeDay = new Date(now - (wokeYesterday ? 86400000 : 0))
  const span = timesToSpan(bed, wake, wakeDay)
  const minutes = Math.round((span.end - span.start) / 60000)
  const problem = spanProblem(span.start, span.end)
  const kind = picked ?? sleepKind(span.start, span.end)

  useEffect(() => { if (o.mode === 'wake' && !startedAt) onDone() }, [o.mode, startedAt, onDone])

  const save = async () => {
    if (problem) return
    setBusy(true)
    try {
      await logSleep({ start: span.start, end: span.end, kind })
      if (o.mode === 'wake') clearSession()
      toast.success(`${kind === 'nap' ? 'Nap' : 'Sleep'} saved: ${fmtDuration(minutes)}`)
      onDone()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save your sleep")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="-mt-1">
      {o.mode === 'wake' && (
        <p className="text-[13.5px] text-ui-muted">Check the times, then save. Change them if you fell asleep later than you tapped.</p>
      )}

      {/* The total, big */}
      <div className="mt-4 text-center">
        <div className={clsx('text-[40px] font-black tracking-tight tabular-nums leading-none', problem ? 'text-ui-muted' : 'text-ui-ink')}>
          {minutes > 0 ? fmtDuration(minutes) : '0m'}
        </div>
        <div className="mt-2 inline-grid grid-cols-2 gap-1 p-1 rounded-xl bg-ui-raised" role="radiogroup" aria-label="Kind of sleep">
          {(['night', 'nap'] as const).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setPicked(k)}
              className={clsx('px-4 h-8 rounded-lg text-[12.5px] font-semibold transition-colors',
                kind === k ? 'bg-ui-card text-ui-ink shadow-sm' : 'text-ui-muted')}>
              {k === 'night' ? 'Night sleep' : 'Nap'}
            </button>
          ))}
        </div>
      </div>

      {/* The two times */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <label className="rounded-2xl bg-ui-raised p-3">
          <span className="block text-[12px] font-semibold text-ui-muted">Fell asleep</span>
          <input type="time" value={bed} onChange={(e) => e.target.value && setBed(e.target.value)}
            className="mt-1 w-full min-w-0 bg-transparent text-[18px] font-bold text-ui-ink tabular-nums outline-none" />
        </label>
        <label className="rounded-2xl bg-ui-raised p-3">
          <span className="block text-[12px] font-semibold text-ui-muted">Woke up</span>
          <input type="time" value={wake} onChange={(e) => e.target.value && setWake(e.target.value)}
            className="mt-1 w-full min-w-0 bg-transparent text-[18px] font-bold text-ui-ink tabular-nums outline-none" />
        </label>
      </div>

      {o.mode === 'log' && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-[12.5px] text-ui-muted">Woke up</span>
          <div className="inline-grid grid-cols-2 gap-1 p-1 rounded-xl bg-ui-raised" role="radiogroup" aria-label="Day you woke up">
            {[false, true].map((y) => (
              <button key={String(y)} type="button" role="radio" aria-checked={wokeYesterday === y} onClick={() => setWokeYesterday(y)}
                className={clsx('px-3 h-8 rounded-lg text-[12.5px] font-semibold transition-colors',
                  wokeYesterday === y ? 'bg-ui-card text-ui-ink shadow-sm' : 'text-ui-muted')}>
                {y ? 'Yesterday' : 'Today'}
              </button>
            ))}
          </div>
        </div>
      )}

      {problem && (
        <p className="mt-3 flex items-start gap-2 text-[13px] text-amber-700 dark:text-amber-300">
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" aria-hidden /> {problem}
        </p>
      )}

      <button type="button" onClick={save} disabled={!!problem || busy}
        className="mt-5 w-full h-11 rounded-2xl text-sm font-bold bg-lp-btn text-lp-btn-ink disabled:opacity-40 active:scale-[0.99] transition">
        {busy ? 'Saving…' : 'Save'}
      </button>
      {o.mode === 'wake' && (
        <button type="button" onClick={() => { clearSession(); toast('Discarded. Nothing was saved.'); onDone() }}
          className="mt-2 w-full h-10 rounded-2xl text-[13px] font-semibold text-ui-muted hover:text-ui-ink">
          I didn&apos;t sleep, discard
        </button>
      )}
    </div>
  )
}
