import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import {
  CalendarDays, ChevronLeft, ChevronRight, Droplet, Droplets, Info, Minus, Plus, Repeat, Sparkles, Timer,
} from 'lucide-react'

import { apiGet, apiPut } from '../api/client'
import { saveLog } from '../offline/outbox'
import { scheduleScoreSync } from '../store/useAppStore'
import RingGauge from './ui/RingGauge'
import PageTabs from './ui/PageTabs'
import Modal from './ui/Modal'
import { ActionButton, MiniStat } from './ui/PageHeader'
import { BarTrend } from './charts/kit'
import { CHART } from '../theme/chartColors'
import {
  FLOWS, PHASES, SYMPTOMS, addDaysKey, dateRange, monthGrid, shortDate, todayKey,
  type CycleStatus, type DayMark, type Flow, type PeriodDay, type PeriodSummary,
} from '../lib/cycle'

// ---------------------------------------------------------------------------
// Cycle tracker. The person marks each day of a period (flow and symptoms are
// optional); the server works out the periods, the averages, where today
// falls and when the next period is likely, with a range as wide as their
// cycles vary. Logging works offline (it uploads later).
// ---------------------------------------------------------------------------

const ROSE = PHASES.menstrual
const AMBER = PHASES.ovulation

type History = { periods: PeriodSummary[]; stats: { cycleLength: number; periodLength: number; spread: number; cyclesUsed: number }; cycles: number }
type Settings = { cycleLength: number; periodDuration: number; tracking: boolean }
type Tab = 'today' | 'calendar' | 'history'

export default function CycleTracker() {
  const today = todayKey()
  const [status, setStatus] = useState<CycleStatus | null>(null)
  const [history, setHistory] = useState<History | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [days, setDays] = useState<Record<string, PeriodDay>>({})
  const [marks, setMarks] = useState<Record<string, DayMark>>({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('today')
  const [month, setMonth] = useState(() => ({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 }))
  const [editing, setEditing] = useState<string | null>(null)

  /** Days and marks for a range; merged into what's already here */
  const loadRange = useCallback(async (from: string, to: string) => {
    const res = await apiGet<{ data: { days: PeriodDay[]; marks: Record<string, DayMark> } | null }>(`/api/cycle/days?from=${from}&to=${to}`)
    // An empty answer (an older server, or nothing back) means nothing logged, never a crash
    const data = { days: res.data?.days ?? [], marks: res.data?.marks ?? {} }
    setDays((prev) => {
      const next = { ...prev }
      for (const k of Object.keys(next)) if (k >= from && k <= to) delete next[k]
      for (const d of data.days) next[d.date] = d
      return next
    })
    setMarks((prev) => {
      const next = { ...prev }
      for (const k of Object.keys(next)) if (k >= from && k <= to) delete next[k]
      return { ...next, ...data.marks }
    })
  }, [])

  const monthRange = (y: number, m: number) => {
    const grid = monthGrid(y, m).filter((k): k is string => k !== null)
    return [grid[0], grid[grid.length - 1]] as const
  }

  const loadAll = useCallback(async () => {
    try {
      const [s, h, st] = await Promise.all([
        apiGet<{ data: CycleStatus | null }>('/api/cycle'),
        apiGet<{ data: History }>('/api/cycle/history'),
        apiGet<{ data: Settings }>('/api/cycle/settings'),
      ])
      setStatus(s.data)
      setHistory(h.data)
      setSettings(st.data)
      // the last two months and the next two: covers today, the calendar and its predictions
      await loadRange(addDaysKey(today, -59), addDaysKey(today, 60))
    } catch {
      // offline: keep what's showing
    } finally {
      setLoading(false)
    }
  }, [loadRange, today])

  useEffect(() => { void loadAll() }, [loadAll])

  // Calendar: fetch a month when it's first shown outside the loaded window
  useEffect(() => {
    const [from, to] = monthRange(month.y, month.m)
    if (from >= addDaysKey(today, -59) && to <= addDaysKey(today, 60)) return
    loadRange(from, to).catch(() => null)
  }, [month, loadRange, today])

  /** Save a day (or remove it): uploads now, or later when offline */
  const saveDay = async (date: string, day: Omit<PeriodDay, 'date'> | null) => {
    try {
      const result = day
        ? await saveLog('/api/cycle/days', { date, flow: day.flow, symptoms: day.symptoms, notes: day.notes })
        : await saveLog('/api/cycle/days/remove', { date })
      // show it straight away; the server's view (periods, predictions) follows when it's sent
      setDays((prev) => {
        const next = { ...prev }
        if (day) next[date] = { date, ...day }
        else delete next[date]
        return next
      })
      setMarks((prev) => {
        const next = { ...prev }
        if (day) next[date] = 'period'
        else delete next[date]
        return next
      })
      if (result === 'sent') {
        toast.success(day ? 'Saved' : 'Removed')
        scheduleScoreSync()
        await loadAll()
      }
      return true
    } catch {
      toast.error("Couldn't save that day")
      return false
    }
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-busy>
        <div className="lp-card rounded-3xl h-56 animate-pulse" />
        <div className="lp-card rounded-3xl h-72 animate-pulse" />
      </div>
    )
  }

  const openCalendarAt = (k: string) => {
    setMonth({ y: Number(k.slice(0, 4)), m: Number(k.slice(5, 7)) - 1 })
    setTab('calendar')
  }

  return (
    <div className="space-y-4">
      <Hero status={status} today={today} onLogToday={() => setEditing(today)} onCalendar={() => setTab('calendar')} />

      <PageTabs label="Cycle tracker" value={tab} onChange={setTab}
        tabs={[{ key: 'today', label: 'Today' }, { key: 'calendar', label: 'Calendar' }, { key: 'history', label: 'History' }] as const} />

      {tab === 'today' && (
        <div className="grid gap-4 md:grid-cols-2 items-start">
          <section className="lp-card rounded-3xl p-5" aria-label="Today">
            <DayEditor key={today + JSON.stringify(days[today] ?? null)} date={today} today={today} day={days[today]} onSave={saveDay} />
          </section>
          <PhaseCard status={status} />
        </div>
      )}

      {tab === 'calendar' && (
        <section className="lp-card rounded-3xl p-5" aria-label="Cycle calendar">
          <Calendar month={month} setMonth={setMonth} today={today} marks={marks} days={days} onPick={setEditing} />
        </section>
      )}

      {tab === 'history' && (
        <HistoryView history={history} settings={settings} onOpen={openCalendarAt}
          onSettings={async (patch) => {
            try {
              await apiPut('/api/cycle/settings', patch)
              setSettings((s) => (s ? { ...s, ...patch } : s))
              toast.success('Saved')
              await loadAll()
            } catch {
              toast.error("Couldn't save. Check your connection.")
            }
          }} />
      )}

      <p className="flex items-start gap-2 text-[12px] text-ui-muted px-1 leading-relaxed">
        <Info size={14} className="flex-shrink-0 mt-0.5" aria-hidden />
        Predictions are estimates from your own logs. They can't be used to prevent pregnancy.
      </p>

      <Modal open={editing !== null} onClose={() => setEditing(null)}
        title={editing ? (editing === today ? 'Today' : shortDate(editing, true)) : ''}>
        {editing && (
          <DayEditor key={editing} date={editing} today={today} day={days[editing]} compact
            onSave={async (d, v) => { const ok = await saveDay(d, v); if (ok) setEditing(null); return ok }} />
        )}
      </Modal>
    </div>
  )
}

// ── Hero: where today falls ─────────────────────────────────────────────────

function Hero({ status, today, onLogToday, onCalendar }: {
  status: CycleStatus | null
  today: string
  onLogToday: () => void
  onCalendar: () => void
}) {
  if (!status) {
    return (
      <section className="lp-card rounded-3xl p-6 text-center" aria-label="Start tracking">
        <span className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `rgb(${ROSE.rgb} / 0.14)`, color: ROSE.hex }}>
          <Droplets size={26} />
        </span>
        <h2 className="mt-3 text-lg font-bold text-ui-ink">Log your period days</h2>
        <p className="mt-1 text-sm text-ui-muted max-w-sm mx-auto">
          Mark each day you're on your period. From those days LivoraPulse works out your cycle and when your next period is likely.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <ActionButton icon={Plus} primary onClick={onLogToday}>I'm on my period today</ActionButton>
          <ActionButton icon={CalendarDays} onClick={onCalendar}>Log an earlier period</ActionButton>
        </div>
      </section>
    )
  }

  const phase = PHASES[status.phase]
  const cycle = status.smartCycleLength
  const fertileFrom = addDaysKey(status.lastPeriodStart, status.fertileWindowStart - 1)
  const fertileTo = addDaysKey(status.lastPeriodStart, status.fertileWindowEnd - 1)
  const fertileDone = fertileTo < today

  let headline: string
  if (status.periodActive) headline = `Period, day ${status.dayOfCycle}`
  else if (status.isLate) headline = `Period ${status.daysLate} day${status.daysLate === 1 ? '' : 's'} later than expected`
  else if (status.periodDueToday) headline = 'Your period may start today'
  else if (status.daysUntilNextPeriod === 0) headline = 'Your period may start any day'
  else headline = `Next period in about ${status.daysUntilNextPeriod} day${status.daysUntilNextPeriod === 1 ? '' : 's'}`

  return (
    <section className="lp-card rounded-3xl p-5" aria-label="Your cycle today">
      <div className="flex items-center gap-5 max-sm:flex-col max-sm:text-center">
        <RingGauge value={Math.min(1, status.dayOfCycle / cycle)} color={phase.hex} size={148} stroke={12}
          label={`Day ${status.dayOfCycle} of about ${cycle}`}>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ui-muted">Day</span>
          <span className="text-4xl font-black text-ui-ink tabular-nums leading-none">{status.dayOfCycle}</span>
          <span className="text-[11px] text-ui-muted mt-0.5">of ~{cycle}</span>
        </RingGauge>

        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold"
            style={{ background: `rgb(${phase.rgb} / 0.14)`, color: phase.hex }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: phase.hex }} /> {phase.label}
          </span>
          <h2 className="mt-2 text-[19px] font-bold text-ui-ink leading-snug">{headline}</h2>
          <p className="mt-1 text-[13.5px] text-ui-muted">
            {status.isLate
              ? `It was expected around ${shortDate(status.nextPeriodDate)}.`
              : <>Expected around {shortDate(status.nextPeriodDate, true)}.<br />Likely between {dateRange(status.nextPeriodEarliest, status.nextPeriodLatest)}.</>}
          </p>
          {status.isLate && (
            <p className="mt-2 text-[13px] text-ui-ink/80 leading-relaxed">
              Stress, illness, travel and weight changes can all move a period. If there's any chance you're pregnant, a pregnancy test can tell you.
              If periods keep coming very late, it's worth talking to a health worker.
            </p>
          )}
          <p className="mt-2 text-[12px] text-ui-muted">
            {status.cyclesUsed >= 3
              ? `From your last ${status.cyclesUsed} cycles.`
              : 'From your usual cycle length for now. Predictions get closer after about 3 logged cycles.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 max-sm:justify-center">
            <ActionButton icon={status.periodActive ? Droplet : Plus} primary onClick={onLogToday}>
              {status.periodActive ? 'Log today' : 'My period started'}
            </ActionButton>
            <ActionButton icon={CalendarDays} onClick={onCalendar}>Calendar</ActionButton>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniStat icon={Repeat} tint={ROSE.rgb} value={`${cycle} days`} label="Usual cycle" />
        <MiniStat icon={Timer} tint={ROSE.rgb} value={`${status.smartDuration} days`} label="Usual period" />
        <MiniStat icon={Sparkles} tint={AMBER.rgb}
          value={fertileDone ? 'Passed' : dateRange(fertileFrom, fertileTo)}
          label="Fertile days (est.)" />
      </div>
    </section>
  )
}

// ── Logging one day ─────────────────────────────────────────────────────────

function DayEditor({ date, today, day, onSave, compact = false }: {
  date: string
  today: string
  day: PeriodDay | undefined
  onSave: (date: string, day: Omit<PeriodDay, 'date'> | null) => Promise<boolean>
  compact?: boolean
}) {
  const [on, setOn] = useState(!!day)
  const [flow, setFlow] = useState<Flow | null>(day?.flow ?? null)
  const [symptoms, setSymptoms] = useState<string[]>(day?.symptoms ?? [])
  const [notes, setNotes] = useState(day?.notes ?? '')
  const [busy, setBusy] = useState(false)

  const changed = on !== !!day || (on && (flow !== (day?.flow ?? null) || notes !== (day?.notes ?? '') ||
    symptoms.slice().sort().join() !== (day?.symptoms ?? []).slice().sort().join()))
  const future = date > today

  const save = async () => {
    setBusy(true)
    await onSave(date, on ? { flow, symptoms, notes: notes.trim() || null } : null)
    setBusy(false)
  }

  return (
    <div>
      {!compact && (
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-[15px] font-bold text-ui-ink">Today</h3>
          <span className="text-[12px] text-ui-muted">{shortDate(date, true)}</span>
        </div>
      )}

      {future ? (
        <p className="text-sm text-ui-muted">You can log a day once it comes.</p>
      ) : (
        <>
          <button type="button" role="switch" aria-checked={on} onClick={() => setOn((v) => !v)}
            className={clsx('w-full flex items-center gap-3 rounded-2xl p-3 text-left transition-colors', !compact && 'mt-3',
              on ? '' : 'bg-ui-raised')}
            style={on ? { background: `rgb(${ROSE.rgb} / 0.12)` } : undefined}>
            <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: on ? ROSE.hex : `rgb(${ROSE.rgb} / 0.14)`, color: on ? '#fff' : ROSE.hex }}>
              <Droplet size={17} fill={on ? 'currentColor' : 'none'} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-ui-ink">Period day</span>
              <span className="block text-[12px] text-ui-muted">{on ? 'Marked. Add flow and symptoms if you like.' : 'Tap if you had any bleeding'}</span>
            </span>
            <span className={clsx('relative w-11 h-6 rounded-full transition-colors flex-shrink-0', on ? '' : 'bg-ui-line/20')}
              style={on ? { background: ROSE.hex } : undefined} aria-hidden>
              <span className={clsx('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all', on ? 'left-[22px]' : 'left-0.5')} />
            </span>
          </button>

          {on && (
            <div className="mt-4 space-y-4">
              <fieldset>
                <legend className="text-[12px] font-semibold text-ui-muted mb-2">Flow</legend>
                <div className="grid grid-cols-4 gap-1.5">
                  {FLOWS.map((f, i) => (
                    <button key={f.value} type="button" aria-pressed={flow === f.value}
                      onClick={() => setFlow(flow === f.value ? null : f.value)}
                      className={clsx('h-14 rounded-xl flex flex-col items-center justify-center gap-1 text-[11.5px] font-semibold transition-colors',
                        flow === f.value ? 'text-white' : 'bg-ui-raised text-ui-ink')}
                      style={flow === f.value ? { background: ROSE.hex } : undefined}>
                      <span className="flex gap-0.5" aria-hidden>
                        {Array.from({ length: i + 1 }, (_, j) => (
                          <Droplet key={j} size={i === 0 ? 9 : 10} fill="currentColor"
                            style={flow === f.value ? undefined : { color: ROSE.hex }} strokeWidth={0} />
                        ))}
                      </span>
                      {f.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-[12px] font-semibold text-ui-muted mb-2">Symptoms</legend>
                <div className="flex flex-wrap gap-1.5">
                  {SYMPTOMS.map((s) => {
                    const picked = symptoms.includes(s)
                    return (
                      <button key={s} type="button" aria-pressed={picked}
                        onClick={() => setSymptoms((cur) => (picked ? cur.filter((x) => x !== s) : [...cur, s]))}
                        className={clsx('px-3 py-1.5 rounded-full text-[12.5px] font-medium transition-colors border',
                          picked ? 'text-ui-ink' : 'bg-transparent text-ui-muted border-ui-line/15 hover:text-ui-ink')}
                        style={picked ? { background: `rgb(${ROSE.rgb} / 0.14)`, borderColor: `rgb(${ROSE.rgb} / 0.45)` } : undefined}>
                        {s}
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <label className="block">
                <span className="text-[12px] font-semibold text-ui-muted">Note (optional)</span>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 500))} rows={2}
                  placeholder="Anything you want to remember"
                  className="mt-1.5 w-full rounded-xl bg-ui-raised px-3 py-2 text-sm text-ui-ink placeholder:text-ui-muted/70 outline-none focus:ring-2 focus:ring-lp-primary/40 resize-none" />
              </label>
            </div>
          )}

          {!on && day && (
            <p className="mt-3 text-[12.5px] text-ui-muted">Saving will remove this day from your period.</p>
          )}

          <button type="button" onClick={save} disabled={!changed || busy}
            className="mt-4 w-full h-11 rounded-2xl text-sm font-bold bg-lp-btn text-lp-btn-ink disabled:opacity-40 active:scale-[0.99] transition">
            {busy ? 'Saving…' : !on && day ? 'Remove period day' : 'Save'}
          </button>
        </>
      )}
    </div>
  )
}

// ── What this phase tends to mean ───────────────────────────────────────────

function PhaseCard({ status }: { status: CycleStatus | null }) {
  if (!status) {
    return (
      <section className="lp-card rounded-3xl p-5" aria-label="How it works">
        <h3 className="text-[15px] font-bold text-ui-ink">How it works</h3>
        <ul className="mt-3 space-y-2 text-[13.5px] text-ui-muted list-disc pl-5">
          <li>Mark every day you bleed, even spotting.</li>
          <li>Missed a day? Fill it in from the calendar any time.</li>
          <li>After a few cycles, predictions use your own pattern instead of an average.</li>
        </ul>
      </section>
    )
  }
  const phase = PHASES[status.phase]
  return (
    <section className="lp-card rounded-3xl p-5" aria-label="This phase">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: phase.hex }} />
        <h3 className="text-[15px] font-bold text-ui-ink">{phase.label}</h3>
      </div>
      <p className="mt-2 text-[13.5px] text-ui-ink/85 leading-relaxed">{phase.line}</p>
      <p className="mt-2 text-[13.5px] text-ui-muted leading-relaxed">{phase.tip}</p>
      <p className="mt-3 text-[12px] text-ui-muted">Everyone's body is different, so these are common patterns, not rules.</p>
    </section>
  )
}

// ── Calendar ────────────────────────────────────────────────────────────────

const MARK_STYLE: Record<DayMark, { style: CSSProperties; label: string }> = {
  period: { style: { background: ROSE.hex, color: '#fff' }, label: 'period day' },
  'predicted-period': { style: { border: `1.5px dashed ${ROSE.hex}`, color: ROSE.hex }, label: 'period expected' },
  fertile: { style: { background: `rgb(${AMBER.rgb} / 0.16)` }, label: 'fertile window (estimate)' },
  ovulation: { style: { background: `rgb(${AMBER.rgb} / 0.16)`, border: `1.5px solid ${AMBER.hex}` }, label: 'estimated ovulation' },
}

function Calendar({ month, setMonth, today, marks, days, onPick }: {
  month: { y: number; m: number }
  setMonth: (m: { y: number; m: number }) => void
  today: string
  marks: Record<string, DayMark>
  days: Record<string, PeriodDay>
  onPick: (k: string) => void
}) {
  const grid = useMemo(() => monthGrid(month.y, month.m), [month])
  const title = new Date(Date.UTC(month.y, month.m, 1)).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })
  const shift = (n: number) => {
    const d = new Date(Date.UTC(month.y, month.m + n, 1))
    setMonth({ y: d.getUTCFullYear(), m: d.getUTCMonth() })
  }
  const nowMonth = Number(today.slice(0, 4)) * 12 + Number(today.slice(5, 7)) - 1
  const canForward = month.y * 12 + month.m < nowMonth + 3

  return (
    <div>
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => shift(-1)} aria-label="Previous month"
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-ui-raised text-ui-ink"><ChevronLeft size={18} /></button>
        <h3 className="text-[15px] font-bold text-ui-ink">{title}</h3>
        <button type="button" onClick={() => shift(1)} disabled={!canForward} aria-label="Next month"
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-ui-raised text-ui-ink disabled:opacity-30"><ChevronRight size={18} /></button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center" role="grid">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="text-[11px] font-semibold text-ui-muted pb-1" aria-hidden>{d.slice(0, 1)}</div>
        ))}
        {grid.map((k, i) => {
          if (!k) return <div key={`b${i}`} />
          const mark = marks[k]
          const future = k > today
          const logged = days[k]
          const isToday = k === today
          const desc = [shortDate(k, true), isToday && 'today', mark && MARK_STYLE[mark].label, logged?.flow && `${logged.flow} flow`].filter(Boolean).join(', ')
          return (
            <button key={k} type="button" disabled={future} onClick={() => onPick(k)} aria-label={desc}
              className="aspect-square flex items-center justify-center rounded-full disabled:cursor-default">
              <span className={clsx('w-full max-w-[42px] aspect-square rounded-full flex items-center justify-center text-[13px] tabular-nums relative',
                isToday ? 'font-black' : 'font-medium', !mark && (future ? 'text-ui-muted/60' : 'text-ui-ink'),
                !mark && !future && 'hover:bg-ui-raised')}
                style={mark ? MARK_STYLE[mark].style : undefined}>
                {Number(k.slice(8))}
                {isToday && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-current" />}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-ui-muted">
        {(['period', 'predicted-period', 'fertile', 'ovulation'] as const).map((m) => (
          <span key={m} className="inline-flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full" style={MARK_STYLE[m].style} />
            {m === 'period' ? 'Period' : m === 'predicted-period' ? 'Expected period' : m === 'fertile' ? 'Fertile window (est.)' : 'Ovulation (est.)'}
          </span>
        ))}
      </div>
      <p className="mt-3 text-[12px] text-ui-muted">Tap a day to mark it as a period day, or to change it.</p>
    </div>
  )
}

// ── History ─────────────────────────────────────────────────────────────────

function HistoryView({ history, settings, onOpen, onSettings }: {
  history: History | null
  settings: Settings | null
  onOpen: (k: string) => void
  onSettings: (patch: Partial<Pick<Settings, 'cycleLength' | 'periodDuration'>>) => Promise<void>
}) {
  const periods = history?.periods ?? []
  const stats = history?.stats
  // completed cycles, oldest first, for the chart
  const bars = periods.filter((p) => p.cycleLength !== null).slice(0, 8).reverse()
    .map((p) => ({ day: shortDate(p.start), length: p.cycleLength as number }))

  return (
    <div className="grid gap-4 md:grid-cols-2 items-start">
      <section className="lp-card rounded-3xl p-5 md:col-span-2" aria-label="Your cycles">
        <h3 className="text-[15px] font-bold text-ui-ink">Your cycles</h3>
        {stats && history && history.cycles > 0 ? (
          <>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <MiniStat icon={Repeat} tint={ROSE.rgb} value={`${stats.cycleLength} days`} label="Average cycle" />
              <MiniStat icon={Timer} tint={ROSE.rgb} value={`${stats.periodLength} days`} label="Average period" />
              <MiniStat icon={CalendarDays} tint={ROSE.rgb} value={stats.cyclesUsed >= 3 ? `±${stats.spread} days` : 'Not yet'}
                label={stats.cyclesUsed >= 3 ? (stats.spread <= 2 ? 'Varies (regular)' : 'Varies') : 'How much it varies'} />
              <MiniStat icon={Droplets} tint={ROSE.rgb} value={String(periods.length)} label="Periods logged" />
            </div>
            {bars.length >= 2 ? (
              <div className="mt-4 h-48" aria-label="Cycle length by cycle">
                <BarTrend data={bars} dataKey="length" label="Cycle length" color={CHART.rose}
                  text={(r) => `${r.length} days`} goal={stats.cycleLength} goalLabel="Average"
                  domain={[0, Math.max(40, ...bars.map((b) => b.length + 3))]} />
              </div>
            ) : (
              <p className="mt-3 text-[13px] text-ui-muted">A chart of your cycle lengths shows up after two full cycles.</p>
            )}
            {stats.cyclesUsed >= 3 && stats.spread >= 7 && (
              <p className="mt-3 text-[13px] text-ui-ink/80">
                Your cycles vary quite a lot. That's common, especially with stress or in the teen years, but if it's new for you a health worker can check why.
              </p>
            )}
          </>
        ) : (
          <p className="mt-2 text-[13.5px] text-ui-muted">Once you've logged two periods, your average cycle shows here.</p>
        )}
      </section>

      <section className="lp-card rounded-3xl p-5" aria-label="Past periods">
        <h3 className="text-[15px] font-bold text-ui-ink">Past periods</h3>
        {periods.length === 0 ? (
          <p className="mt-2 text-[13.5px] text-ui-muted">Nothing logged yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-ui-line/[0.08]">
            {periods.map((p, i) => (
              <li key={p.start}>
                <button type="button" onClick={() => onOpen(p.start)} className="w-full py-3 text-left flex items-start gap-3">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `rgb(${ROSE.rgb} / 0.14)`, color: ROSE.hex }}>
                    <Droplet size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-ui-ink">{dateRange(p.start, p.end)}</span>
                      <span className="text-[12px] text-ui-muted flex-shrink-0">
                        {i === 0 ? 'Current cycle' : p.cycleLength ? `${p.cycleLength}-day cycle` : ''}
                      </span>
                    </span>
                    <span className="block text-[12px] text-ui-muted">
                      {p.days} day{p.days === 1 ? '' : 's'}{p.heaviestFlow ? ` · up to ${p.heaviestFlow} flow` : ''}
                    </span>
                    {p.symptoms.length > 0 && (
                      <span className="mt-1.5 flex flex-wrap gap-1">
                        {p.symptoms.map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded-full text-[11px] bg-ui-raised text-ui-muted">{s}</span>
                        ))}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {settings && (
        <section className="lp-card rounded-3xl p-5" aria-label="Your usual cycle">
          <h3 className="text-[15px] font-bold text-ui-ink">Your usual cycle</h3>
          <p className="mt-1 text-[13px] text-ui-muted">
            Used for predictions until you've logged about 3 cycles. After that, your own logs take over.
          </p>
          <div className="mt-3 space-y-2">
            <Stepper label="Cycle length" value={settings.cycleLength} min={21} max={45} onChange={(v) => onSettings({ cycleLength: v })} />
            <Stepper label="Period length" value={settings.periodDuration} min={1} max={10} onChange={(v) => onSettings({ periodDuration: v })} />
          </div>
        </section>
      )}
    </div>
  )
}

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const [v, setV] = useState(value)
  useEffect(() => setV(value), [value])
  // save once the person stops tapping
  useEffect(() => {
    if (v === value) return
    const t = setTimeout(() => onChange(v), 700)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v])
  return (
    <div className="flex items-center justify-between rounded-2xl bg-ui-raised px-3 py-2">
      <span className="text-sm font-medium text-ui-ink">{label}</span>
      <span className="flex items-center gap-2">
        <button type="button" onClick={() => setV((x) => Math.max(min, x - 1))} disabled={v <= min} aria-label={`Shorter ${label.toLowerCase()}`}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-ui-card text-ui-ink disabled:opacity-30"><Minus size={14} /></button>
        <span className="w-16 text-center text-sm font-bold text-ui-ink tabular-nums">{v} days</span>
        <button type="button" onClick={() => setV((x) => Math.min(max, x + 1))} disabled={v >= max} aria-label={`Longer ${label.toLowerCase()}`}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-ui-card text-ui-ink disabled:opacity-30"><Plus size={14} /></button>
      </span>
    </div>
  )
}

