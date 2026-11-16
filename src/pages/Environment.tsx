import { useMemo, useState, type SVGProps } from 'react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import {
  Bike, BusFront, Car, Check, CookingPot, Footprints, GlassWater, Info, Leaf, Plus, PlugZap,
  Recycle, Salad, ShoppingBag, Trash2, TreePine, type LucideIcon,
} from 'lucide-react'

import GrowingPlant from '../components/visuals/GrowingPlant'
import RingGauge from '../components/ui/RingGauge'
import PageTabs from '../components/ui/PageTabs'
import { ActionButton, MiniStat, PageHeader } from '../components/ui/PageHeader'
import { AreaTrend, BarTrend, Donut } from '../components/charts/kit'
import { CHART, type Duo } from '../theme/chartColors'
import { HABIT } from '../theme/habits'
import { HABITS, HABIT_KEYS, TRIP_MODES, TRIP_MODE_KEYS, isLowCarbon, isTripMode, tripAvoidedKg, type Habit, type TripMode } from '../lib/green'
import { WEEK } from '../lib/weekStory'
import { useAppStore } from '../store/useAppStore'
import { selectProgressiveGoals } from '../store/selectors'
import { getDayKey } from '../utils/date'
import type { DayKey } from '../data/types'

// ---------------------------------------------------------------------------
// Green habits: a daily checklist (each counts once a day, no CO₂ number on
// habits) and trips (the only place CO₂ is worked out: what a car would have
// emitted for the distance minus what you did). See lib/green.ts.
// ---------------------------------------------------------------------------

/** Boda boda: Lucide has no motorbike, so one in the same line style */
function Motorbike(props: SVGProps<SVGSVGElement> & { size?: number }) {
  const { size = 24, ...rest } = props
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <circle cx="5" cy="17" r="3" />
      <circle cx="19" cy="17" r="3" />
      <path d="M8 17h5l3-6h-4" />
      <path d="M14 6h2l3 11" />
      <path d="M5 17l3-5h4" />
    </svg>
  )
}

const HABIT_ICONS: Record<Habit, LucideIcon> = {
  bag: ShoppingBag,
  bottle: GlassWater,
  recycle: Recycle,
  cooking: CookingPot,
  power: PlugZap,
  tree: TreePine,
  meatfree: Salad,
}

const TRIP_ICONS: Record<TripMode, (p: { size?: number; className?: string }) => JSX.Element> = {
  walk: (p) => <Footprints {...p} />,
  bike: (p) => <Bike {...p} />,
  matatu: (p) => <BusFront {...p} />,
  boda: (p) => <Motorbike {...p} />,
  car: (p) => <Car {...p} />,
}

const TRIP_COLORS: Record<TripMode, Duo> = {
  walk: CHART.green,
  bike: CHART.teal,
  matatu: CHART.sky,
  boda: CHART.violet,
  car: CHART.orange,
}

const TABS = [
  { key: 'today', label: 'Today' },
  { key: 'trips', label: 'Trips' },
  { key: 'week', label: 'This week' },
] as const
type EcoTab = (typeof TABS)[number]['key']

const DISTANCES = [1, 2, 5, 10, 20]
const kg = (v: number) => (v >= 10 ? v.toFixed(0) : v.toFixed(1))

export default function Environment() {
  const ecoActions = useAppStore((s) => s.environment.ecoActions)
  const toggleHabit = useAppStore((s) => s.toggleHabit)
  const addTrip = useAppStore((s) => s.addTrip)
  const removeEcoEntry = useAppStore((s) => s.removeEcoEntry)
  const goal = Math.min(HABIT_KEYS.length, Math.max(1, useAppStore(selectProgressiveGoals).goalEcoActionsPerDay))
  const day = getDayKey()

  const [tab, setTab] = useState<EcoTab>('today')
  const [mode, setMode] = useState<TripMode>('walk')
  const [distance, setDistance] = useState('2')

  // ── This week's entries, by kind ───────────────────────────────────────
  const view = useMemo(() => {
    const now = new Date()
    const monday = new Date(now)
    monday.setHours(0, 0, 0, 0)
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    const dayOf = (t: number) => WEEK[(new Date(t).getDay() + 6) % 7] as DayKey
    const today = now.toDateString()

    const week = ecoActions.filter((a) => a.timestamp >= monday.getTime())
    const habits = week.filter((a) => a.category === 'HABIT')
    const trips = week.filter((a) => a.category === 'TRANSPORT' && isTripMode(a.type))
    const todayHabits = new Set(habits.filter((a) => new Date(a.timestamp).toDateString() === today).map((a) => a.type))

    // Habits per day (distinct), CO₂ avoided per day, trips by mode
    const habitsByDay = WEEK.map((d) => ({ day: d, habits: new Set(habits.filter((a) => dayOf(a.timestamp) === d).map((a) => a.type)).size }))
    const kgByDay = WEEK.map((d) => ({ day: d, kg: Math.round(trips.filter((a) => dayOf(a.timestamp) === d).reduce((s, a) => s + a.impactKgCO2, 0) * 100) / 100 }))
    const byMode = TRIP_MODE_KEYS.map((m) => ({ mode: m, trips: trips.filter((a) => a.type === m).length }))

    // Green streak: days in a row (up to today, or yesterday if nothing yet today) with a habit
    const habitDays = new Set(ecoActions.filter((a) => a.category === 'HABIT').map((a) => new Date(a.timestamp).toDateString()))
    let streak = 0
    const cursor = new Date()
    if (!habitDays.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1)
    while (habitDays.has(cursor.toDateString())) { streak++; cursor.setDate(cursor.getDate() - 1) }

    return {
      todayHabits,
      habitDaysThisWeek: habits.length,
      habitsByDay,
      kgByDay,
      byMode,
      trips,
      weekKg: trips.reduce((s, a) => s + a.impactKgCO2, 0),
      lowShare: trips.length ? Math.round((trips.filter((a) => isLowCarbon(a.type)).length / trips.length) * 100) : null,
      streak,
    }
  }, [ecoActions])

  const done = view.todayHabits.size
  const subtitle = done >= goal
    ? `Daily goal reached: ${done} green ${done === 1 ? 'habit' : 'habits'} today.`
    : done > 0
    ? `${done} of ${goal} green habits today. ${goal - done} more to reach your goal.`
    : 'Tick the green things you did today. Each one counts once.'

  const tick = (h: Habit) => {
    const wasDone = view.todayHabits.has(h)
    toggleHabit(h)
      .then(() => { if (!wasDone) toast.success('Nice. That counts for today') })
      .catch((e: Error) => toast.error(e.message))
  }

  const saveTrip = () => {
    const km = Number(distance)
    if (!(km > 0 && km <= 500)) { toast.error('Enter roughly how far, in km'); return }
    addTrip(mode, km)
      .then(() => toast.success(isLowCarbon(mode) ? `Trip saved: about ${kg(tripAvoidedKg(mode, km))} kg CO₂ less than by car` : 'Trip saved'))
      .catch((e: Error) => toast.error(e.message))
  }

  const preview = Number(distance) > 0 ? tripAvoidedKg(mode, Number(distance)) : null

  return (
    <div className="space-y-5">
      <PageHeader icon={Leaf} tint={HABIT.eco.rgb} title="Green habits" subtitle={subtitle} />

      {/* Hero: today's habits as a ring; the week's trips beside it */}
      <section className="lp-card rounded-3xl p-5 relative overflow-hidden" aria-label="Green habits today">
        <div className="pointer-events-none absolute -top-16 -left-16 w-48 h-48 rounded-full blur-3xl" style={{ background: `rgb(${HABIT.eco.rgb} / 0.14)` }} />
        <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:items-center lg:gap-8">
          <div className="flex items-center gap-5">
            <RingGauge value={done / goal} color={HABIT.eco.hex} size={124} stroke={11} label={`${done} of ${goal} green habits today`}>
              <span className="text-[28px] font-extrabold leading-none text-ui-ink tabular-nums">{done}<span className="text-[15px] text-ui-muted">/{goal}</span></span>
              <span className="text-[11px] text-ui-muted mt-1">habits</span>
            </RingGauge>
            <div className="min-w-0">
              <div className="text-[12px] font-semibold text-ui-muted">Today</div>
              <div className="text-[20px] font-extrabold text-ui-ink leading-tight">{done >= goal ? 'Goal reached' : `${goal - done} to go`}</div>
              <div className="text-[12px] font-semibold mt-0.5" style={{ color: HABIT.eco.hex }}>Each habit counts once a day</div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2.5">
              <MiniStat icon={Leaf} tint={HABIT.eco.rgb} value={`${kg(view.weekKg)} kg`} label="CO₂ saved (week)" />
              <MiniStat icon={Footprints} tint={HABIT.steps.rgb} value={view.lowShare === null ? '—' : `${view.lowShare}%`} label="Green trips" />
              <MiniStat icon={Check} tint={HABIT.focus.rgb} value={`${view.streak} ${view.streak === 1 ? 'day' : 'days'}`} label="Green streak" />
            </div>
            <div className="grid grid-cols-2 sm:flex gap-2">
              <ActionButton icon={Plus} primary onClick={() => setTab('trips')}>Log a trip</ActionButton>
              <ActionButton icon={Check} onClick={() => setTab('today')}>Tick habits</ActionButton>
            </div>
          </div>
        </div>
      </section>

      <PageTabs label="Green habits sections" value={tab} onChange={setTab} tabs={TABS} />

      {tab === 'today' && (
        <div className="grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4">
          <section className="lp-card rounded-3xl p-5 min-w-0" aria-label="Today's green habits">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-bold text-ui-ink">What did you do today?</h2>
              <span className="text-[12px] font-semibold text-ui-muted rounded-full bg-ui-raised px-2.5 py-1 tabular-nums">{done} / {HABIT_KEYS.length}</span>
            </div>
            <ul className="space-y-2">
              {HABIT_KEYS.map((h) => {
                const on = view.todayHabits.has(h)
                const Icon = HABIT_ICONS[h]
                return (
                  <li key={h}>
                    <button type="button" onClick={() => tick(h)} aria-pressed={on}
                      className={clsx('w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors',
                        on ? 'bg-lp-primary/12 ring-1 ring-lp-primary/40' : 'bg-ui-raised hover:bg-ui-line/[0.06]')}>
                      <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `rgb(${HABIT.eco.rgb} / ${on ? 0.22 : 0.12})`, color: HABIT.eco.hex }}>
                        <Icon size={17} />
                      </span>
                      <span className={clsx('flex-1 text-[14px]', on ? 'font-semibold text-ui-ink' : 'text-ui-ink')}>{HABITS[h]}</span>
                      <span className={clsx('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                        on ? 'bg-lp-primary text-white' : 'border-2 border-ui-line/15')}>
                        {on && <Check size={13} strokeWidth={3} />}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="lp-card rounded-3xl p-5 min-w-0 flex flex-col" aria-label="Your plant">
            <div className="text-[12px] font-semibold text-ui-muted">Your plant this week</div>
            <p className="text-[15px] font-bold text-ui-ink mt-1">
              {view.habitDaysThisWeek > 0
                ? `${view.habitDaysThisWeek} ${view.habitDaysThisWeek === 1 ? 'leaf' : 'leaves'}: one for every habit this week.`
                : 'Tick a habit and your plant grows its first leaf.'}
            </p>
            <div className="flex-1 flex items-end justify-center mt-2">
              <GrowingPlant leaves={view.habitDaysThisWeek} />
            </div>
            <p className="text-[11px] text-ui-muted mt-2">It starts again every Monday.</p>
          </section>
        </div>
      )}

      {tab === 'trips' && (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4">
          <section className="lp-card rounded-3xl p-5 min-w-0" aria-label="Log a trip">
            <h2 className="text-[15px] font-bold text-ui-ink">Log a trip</h2>
            <p className="text-[12px] text-ui-muted mt-0.5 mb-3">How you got there, and roughly how far.</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {TRIP_MODE_KEYS.map((m) => {
                const Icon = TRIP_ICONS[m]
                return (
                  <button key={m} type="button" onClick={() => setMode(m)} aria-pressed={mode === m}
                    className={clsx('flex flex-col items-center gap-1 rounded-2xl py-2.5 text-[12px] font-semibold transition',
                      mode === m ? 'bg-lp-primary/15 text-ui-ink ring-2 ring-lp-primary' : 'bg-ui-raised text-ui-muted hover:text-ui-ink')}>
                    <Icon size={18} className={mode === m ? 'text-lp-primary' : undefined} />
                    {TRIP_MODES[m].label}
                  </button>
                )
              })}
            </div>
            <div className="text-[12px] font-semibold text-ui-muted mt-4 mb-2">About how far?</div>
            <div className="flex flex-wrap items-center gap-1.5">
              {DISTANCES.map((d) => (
                <button key={d} type="button" onClick={() => setDistance(String(d))}
                  className={clsx('px-3 py-2 rounded-xl text-xs font-bold transition',
                    distance === String(d) ? 'bg-lp-btn text-lp-btn-ink' : 'bg-ui-raised text-ui-muted hover:text-ui-ink')}>
                  {d} km
                </button>
              ))}
              <input value={distance} onChange={(e) => setDistance(e.target.value.replace(/[^0-9.]/g, ''))} inputMode="decimal" aria-label="Kilometres"
                className="w-20 px-3 py-2 rounded-xl bg-ui-raised text-ui-ink text-xs font-bold border border-ui-line/10 focus:outline-none focus:ring-2 focus:ring-lp-primary/40" />
            </div>
            {preview !== null && (
              <div className="mt-3 rounded-2xl bg-ui-raised p-3 text-[13px] text-ui-ink">
                {isLowCarbon(mode)
                  ? <>≈ <b>{kg(preview)} kg CO₂</b> less than making this trip by car</>
                  : <>A car trip: nothing avoided, but logging it keeps your trip share honest</>}
              </div>
            )}
            <div className="mt-4"><ActionButton icon={Plus} primary onClick={saveTrip}>Save trip</ActionButton></div>
          </section>

          <section className="lp-card rounded-3xl p-5 min-w-0" aria-label="This week's trips">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-bold text-ui-ink">This week's trips</h2>
              {view.trips.length > 0 && <span className="text-[12px] font-semibold text-ui-muted rounded-full bg-ui-raised px-2.5 py-1">{view.trips.length}</span>}
            </div>
            {view.trips.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-semibold text-ui-ink">No trips yet this week</p>
                <p className="text-xs text-ui-muted mt-1">Walked to the stage? Took a matatu? Log it on the left.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {view.trips.slice(0, 12).map((t) => {
                  const m = t.type as TripMode
                  const Icon = TRIP_ICONS[m]
                  return (
                    <li key={t.id} className="flex items-center gap-3 rounded-2xl bg-ui-raised px-3 py-2.5">
                      <span className="w-8 h-8 rounded-xl bg-lp-primary/10 flex items-center justify-center flex-shrink-0 text-lp-primary"><Icon size={15} /></span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-ui-ink">{TRIP_MODES[m].label} · {t.distanceKm ?? '?'} km</div>
                        <div className="text-[11px] text-ui-muted">
                          {new Date(t.timestamp).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
                          {t.id.startsWith('queued:') ? ' · waiting to upload' : ''}
                        </div>
                      </div>
                      <span className="text-[12px] font-bold text-ui-ink tabular-nums">{t.impactKgCO2 > 0 ? `−${kg(t.impactKgCO2)} kg` : '—'}</span>
                      <button type="button" aria-label="Remove trip" onClick={() => removeEcoEntry(t.id).catch((e: Error) => toast.error(e.message))}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-ui-muted hover:text-lp-alert hover:bg-lp-alert/10 transition">
                        <Trash2 size={13} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === 'week' && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="lp-card rounded-3xl p-5">
            <div className="text-sm font-bold text-ui-ink">Green habits per day</div>
            <div className="text-xs text-ui-muted mt-0.5 mb-3">Different habits ticked each day</div>
            <div className="h-48">
              <BarTrend data={view.habitsByDay} dataKey="habits" label="Habits" color={CHART.teal} highlight={day}
                goal={goal} text={(r) => `${r.habits} ${r.habits === 1 ? 'habit' : 'habits'}`} />
            </div>
          </div>
          <div className="lp-card rounded-3xl p-5">
            <div className="text-sm font-bold text-ui-ink">CO₂ avoided</div>
            <div className="text-xs text-ui-muted mt-0.5 mb-3">From your trips, compared with going by car</div>
            <div className="h-48">
              <AreaTrend data={view.kgByDay}
                series={[{ key: 'kg', label: 'Avoided', color: CHART.teal, text: (r) => `${kg(r.kg)} kg CO₂` }]} />
            </div>
          </div>
          <div className="lp-card rounded-3xl p-5 md:col-span-2">
            <div className="text-sm font-bold text-ui-ink">How you got around</div>
            <div className="text-xs text-ui-muted mt-0.5 mb-3">This week's trips</div>
            <div className="max-w-sm mx-auto">
              <Donut format={(v) => `${v} ${v === 1 ? 'trip' : 'trips'}`}
                data={view.byMode.map((b) => ({ label: TRIP_MODES[b.mode].label, value: b.trips, color: TRIP_COLORS[b.mode] }))} />
            </div>
          </div>
        </div>
      )}

      {/* How the numbers work, in a sentence */}
      <p className="flex items-start gap-2 text-[11.5px] text-ui-muted px-1">
        <Info size={13} className="mt-0.5 flex-shrink-0" />
        Habits are counted, not turned into kilograms. Trip CO₂ compares your trip with an average petrol car
        (about 0.17 kg per km; matatu 0.10, boda boda 0.11), so the numbers are estimates.
      </p>
    </div>
  )
}
