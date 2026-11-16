import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Navigation, Plus, Activity, Moon, Flame, Footprints, TrendingUp, TrendingDown, Minus, Award, Target } from 'lucide-react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

import CaloriesLineChart from '../components/charts/CaloriesLineChart'
import DistanceLineChart from '../components/charts/DistanceLineChart'
import SleepAreaChart from '../components/charts/SleepAreaChart'
import StepsBarChart from '../components/charts/StepsBarChart'
import StepsJourney from '../components/visuals/StepsJourney'
import SleepNightSky from '../components/visuals/SleepNightSky'
import WeekDots from '../components/visuals/WeekDots'
import RingGauge from '../components/ui/RingGauge'
import PageTabs from '../components/ui/PageTabs'
import { ActionButton, MiniStat, PageHeader } from '../components/ui/PageHeader'
import { HABIT } from '../theme/habits'
import { weekSentence } from '../lib/weekStory'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import WalkTracker from '../components/WalkTracker'
import PendingWalksCard from '../components/PendingWalksCard'

import { useAppStore } from '../store/useAppStore'
import { selectDimensionScores, selectLifePulseScore, selectProgressiveGoals } from '../store/selectors'
import { getDayKey } from '../utils/date'
import { formatDistance, formatNumber } from '../utils/format'

// ---------------------------------------------------------------------------
// Goal progress bar
// ---------------------------------------------------------------------------
function GoalBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(Math.round((value / max) * 100), 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-black/40 dark:text-white/35">Goal progress</span>
        <span className="font-semibold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.06] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
interface StatCardProps {
  label: string
  value: string
  context: string
  icon: React.ReactNode
  color: string
  goalValue?: number
  goalMax?: number
  trend?: 'up' | 'down' | 'flat'
}

function StatCard({ label, value, context, icon, color, goalValue, goalMax, trend }: StatCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? '#4CAF50' : trend === 'down' ? '#FF6B6B' : '#94a3b8'

  return (
    <div className="rounded-3xl p-4 lp-card">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + '18' }}>
          <div style={{ color }}>{icon}</div>
        </div>
        {trend && <TrendIcon size={13} style={{ color: trendColor }} className="mt-1 flex-shrink-0" />}
      </div>
      <div className="text-[10px] font-bold text-black/35 dark:text-white/30 uppercase tracking-wider">{label}</div>
      <div className="mt-1 text-xl font-black text-black/85 dark:text-white/90 leading-none">{value}</div>
      <div className="mt-1 text-xs text-black/45 dark:text-white/40 leading-relaxed">{context}</div>
      {goalValue !== undefined && goalMax !== undefined && goalMax > 0 && (
        <div className="mt-3">
          <GoalBar value={goalValue} max={goalMax} color={color} />
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Score impact sidebar card
// ---------------------------------------------------------------------------
function ScoreImpactCard({ steps, sleep }: { steps: number; sleep: number }) {
  // Server-calculated physical score and today's goals (after the streak multiplier)
  const physicalScore = useAppStore((s) => selectDimensionScores(s).physical)
  const goals = useAppStore(selectProgressiveGoals)
  const stepsNeeded = Math.max(0, goals.goalStepsPerDay - steps)
  const sleepGap = Math.max(0, goals.goalSleepHours - sleep)
  // Points the overall score would gain by reaching both goals (physical weighs 23%)
  const potentialGain = Math.round(
    (Math.min(stepsNeeded / goals.goalStepsPerDay, 1) * 70 +
      Math.min(sleepGap / goals.goalSleepHours, 1) * 30) * 0.23,
  )

  return (
    <div className="rounded-3xl p-4 lp-card">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-lp-primary/15 flex items-center justify-center">
          <Target size={14} className="text-lp-primary" />
        </div>
        <span className="text-sm font-semibold text-black/70 dark:text-white/70">Score Impact</span>
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-black text-black/85 dark:text-white/90">{physicalScore}</span>
        <span className="text-xs text-black/35 dark:text-white/30">/ 100 physical score</span>
      </div>
      {potentialGain > 0 ? (
        <p className="text-xs text-black/50 dark:text-white/45 leading-relaxed mt-2">
          {stepsNeeded > 0
            ? `Walk ${formatNumber(stepsNeeded)} more steps`
            : `Get ${sleepGap.toFixed(1)}h more sleep`} to gain up to{' '}
          <span className="font-bold text-lp-primary">+{potentialGain} points</span> on your overall score.
        </p>
      ) : (
        <p className="text-xs text-lp-primary font-semibold mt-2">Physical goal reached today!</p>
      )}
      <div className="mt-3 pt-3 border-t border-black/[0.05] dark:border-white/[0.05]">
        <div className="text-[10px] text-black/30 dark:text-white/25 uppercase tracking-wider mb-2">Physical contribution</div>
        <div className="h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.06] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-lp-primary"
            initial={{ width: 0 }}
            animate={{ width: `${physicalScore}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Weekly summary sidebar card
// ---------------------------------------------------------------------------
function WeeklySummaryCard({ weeklySteps, sleepHours }: {
  weeklySteps: Array<{ day: string; steps: number }>
  sleepHours: Array<{ day: string; hours: number }>
}) {
  const stepGoal = useAppStore((s) => selectProgressiveGoals(s).goalStepsPerDay)
  const totalSteps = weeklySteps.reduce((s, x) => s + x.steps, 0)
  const activeDays = weeklySteps.filter(x => x.steps > 0).length
  const sleepWithData = sleepHours.filter(x => x.hours > 0)
  const avgSleep = sleepWithData.length > 0
    ? sleepWithData.reduce((s, x) => s + x.hours, 0) / sleepWithData.length
    : 0

  return (
    <div className="rounded-3xl p-4 lp-card">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-lp-accent/15 flex items-center justify-center">
          <TrendingUp size={14} className="text-lp-accent" />
        </div>
        <span className="text-sm font-semibold text-black/70 dark:text-white/70">This Week</span>
      </div>
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-black/45 dark:text-white/40">Total steps</span>
          <span className="text-sm font-bold text-black/80 dark:text-white/80">{formatNumber(totalSteps)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-black/45 dark:text-white/40">Active days</span>
          <span className="text-sm font-bold text-black/80 dark:text-white/80">{activeDays} / 7</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-black/45 dark:text-white/40">Avg sleep</span>
          <span className="text-sm font-bold text-black/80 dark:text-white/80">
            {avgSleep > 0 ? `${avgSleep.toFixed(1)}h` : '—'}
          </span>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-black/[0.05] dark:border-white/[0.05]">
        <div className="flex items-end gap-1 h-10">
          {weeklySteps.map((x) => {
            const h = Math.max(3, Math.round((x.steps / 10000) * 40))
            return (
              <div key={x.day} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className="w-full rounded-sm"
                  style={{
                    height: h,
                    backgroundColor: x.steps >= stepGoal ? '#4CAF50' : x.steps > 0 ? '#4CAF5055' : '#0000000A',
                  }}
                />
                <span className="text-[8px] text-black/25 dark:text-white/20">{x.day.slice(0, 1)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sleep quick logger sidebar card
// ---------------------------------------------------------------------------
function SleepLogger({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const levels = [5, 6, 6.5, 7, 7.5, 8, 8.5, 9]
  const getColor = (h: number) => h >= 8 ? '#4CAF50' : h >= 7 ? '#00BCD4' : h >= 6 ? '#FFA500' : '#FF6B6B'
  const getLabel = (h: number) => h >= 8 ? 'Great' : h >= 7 ? 'Good' : h >= 6 ? 'Fair' : 'Short'

  return (
    <div className="rounded-3xl p-4 lp-card">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-[#6366F1]/15 flex items-center justify-center">
          <Moon size={14} className="text-[#6366F1]" />
        </div>
        <span className="text-sm font-semibold text-black/70 dark:text-white/70">Log Sleep</span>
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-black" style={{ color: value > 0 ? getColor(value) : '#94a3b8' }}>
          {value > 0 ? `${value}h` : '—'}
        </span>
        {value > 0 && (
          <span className="text-xs font-semibold" style={{ color: getColor(value) }}>
            {getLabel(value)}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {levels.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => onChange(h)}
            className={clsx(
              'px-2.5 py-1 max-sm:px-3 max-sm:py-2 rounded-lg text-xs font-semibold transition-all duration-150',
              value === h
                ? 'text-white shadow-sm'
                : 'bg-black/[0.04] dark:bg-white/[0.05] text-black/50 dark:text-white/45 hover:bg-black/[0.08] dark:hover:bg-white/[0.09]'
            )}
            style={value === h ? { backgroundColor: getColor(h) } : undefined}
          >
            {h}h
          </button>
        ))}
      </div>
    </div>
  )
}

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'activity', label: 'Activity' },
  { key: 'sleep', label: 'Sleep' },
  { key: 'charts', label: 'Charts' },
] as const
type PhysicalTab = (typeof TABS)[number]['key']

// ---------------------------------------------------------------------------
// Physical page root
// ---------------------------------------------------------------------------
export default function Physical() {
  const stepGoal = useAppStore((s) => selectProgressiveGoals(s).goalStepsPerDay)
  const units = useAppStore((s) => s.preferences.units)
  const physical = useAppStore((s) => s.physical)
  const addActivity = useAppStore((s) => s.addActivity)
  const updateSleepForToday = useAppStore((s) => s.updateSleepForToday)

  const day = getDayKey()
  const goals = useAppStore(selectProgressiveGoals)
  // Distance from walks; where only steps were logged, about 0.75 m per step
  const weekKm = physical.weeklyDistanceKm.reduce((sum, d) => sum + (d.km || 0), 0) ||
    physical.weeklySteps.reduce((sum, d) => sum + d.steps, 0) * 0.00075
  const stepsSentence = weekSentence({ values: physical.weeklySteps.map((x) => ({ day: x.day, value: x.steps || null })), today: day, goal: stepGoal, noun: 'step goal' })
  const sleepSentence = weekSentence({ values: physical.sleepHours.map((x) => ({ day: x.day, value: x.hours || null })), today: day, goal: goals.goalSleepHours, noun: 'sleep goal' })
  const todaySteps = physical.weeklySteps.find((x) => x.day === day)?.steps ?? 0
  const todayDistance = physical.weeklyDistanceKm.find((x) => x.day === day)?.km ?? 0
  const todayCalories = physical.weeklyCaloriesKcal.find((x) => x.day === day)?.kcal ?? 0
  const todaySleep = physical.sleepHours.find((x) => x.day === day)?.hours ?? 0

  const [walkOpen, setWalkOpen] = useState(false)
  const [tab, setTab] = useState<PhysicalTab>('overview')
  const [otherOpen, setOtherOpen] = useState(false)
  const [stepsOpen, setStepsOpen] = useState(false)
  const [phoneStepsInput, setPhoneStepsInput] = useState('')
  const [caloriesInput, setCaloriesInput] = useState('100')
  const [noteInput, setNoteInput] = useState('')

  const stepPct = Math.min(100, Math.round((todaySteps / stepGoal) * 100))
  const recent = useMemo(() => physical.activityLog.slice(0, 5), [physical.activityLog])

  const headline = useMemo(() => {
    if (todaySteps >= 10000) return `Outstanding — ${formatNumber(todaySteps)} steps today. Daily goal exceeded.`
    if (todaySteps >= stepGoal) return `Great progress — ${formatNumber(todaySteps)} steps. Daily goal reached.`
    if (todaySteps >= 5000) return `${formatNumber(todaySteps)} steps so far — ${formatNumber(stepGoal - todaySteps)} more to hit your goal.`
    if (todaySteps > 0) return `${formatNumber(todaySteps)} steps logged. Keep going — ${formatNumber(stepGoal - todaySteps)} steps to go.`
    return 'No activity logged yet today — tap Start Walk to begin.'
  }, [todaySteps])

  return (
    <div className="space-y-5">

      {/* Walks saved on this phone that haven't uploaded yet */}
      <PendingWalksCard />

      {/* Header */}
      <PageHeader icon={Activity} tint={HABIT.steps.rgb} title="Physical" subtitle={headline} />

      {/* Hero: today's steps as a ring, the other numbers beside it, and the ways to log */}
      <section className="lp-card rounded-3xl p-5 relative overflow-hidden" aria-label="Today's steps">
        <div className="pointer-events-none absolute -top-16 -left-16 w-48 h-48 rounded-full blur-3xl" style={{ background: `rgb(${HABIT.steps.rgb} / 0.12)` }} />
        <div className="relative flex items-center gap-5">
          <RingGauge value={todaySteps / stepGoal} color={HABIT.steps.hex} size={124} stroke={11}
            label={`${formatNumber(todaySteps)} of ${formatNumber(stepGoal)} steps`}>
            <Footprints size={30} style={{ color: HABIT.steps.hex }} />
          </RingGauge>
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-ui-muted">Daily steps</div>
            <div className="text-[28px] font-extrabold text-ui-ink leading-tight tabular-nums">
              {formatNumber(todaySteps)} <span className="text-[14px] font-semibold text-ui-muted">/ {formatNumber(stepGoal)}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-ui-line/[0.08] overflow-hidden w-40 max-w-full">
              <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${stepPct}%`, background: HABIT.steps.hex }} />
            </div>
            <div className="mt-1 text-[12px] font-semibold" style={{ color: HABIT.steps.hex }}>{stepPct}% of your goal</div>
          </div>
        </div>
        <div className="relative mt-4 grid grid-cols-3 gap-2.5">
          <MiniStat icon={Flame} tint={HABIT.meals.rgb} value={`${todayCalories} kcal`} label="Burned" />
          <MiniStat icon={Navigation} tint={HABIT.screen.rgb} value={formatDistance(todayDistance, units)} label="Distance" />
          <MiniStat icon={Moon} tint={HABIT.sleep.rgb} value={todaySleep > 0 ? `${todaySleep}h` : '—'} label="Sleep" />
        </div>
        <div className="relative mt-4 grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          <div className="col-span-2 grid sm:block"><ActionButton icon={Navigation} primary onClick={() => setWalkOpen(true)}>Start walk</ActionButton></div>
          <ActionButton icon={Footprints} onClick={() => { setPhoneStepsInput(''); setStepsOpen(true) }}>Enter steps</ActionButton>
          <ActionButton icon={Plus} onClick={() => setOtherOpen(true)}>Other</ActionButton>
        </div>
      </section>

      {todaySteps >= stepGoal && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl p-4 flex items-center gap-3 bg-lp-primary/[0.08] border border-lp-primary/20">
          <span className="w-9 h-9 rounded-xl bg-lp-primary/20 flex items-center justify-center flex-shrink-0">
            <Award size={16} className="text-lp-primary" />
          </span>
          <div>
            <div className="text-sm font-bold text-ui-ink">Daily goal reached</div>
            <div className="text-xs text-ui-muted mt-0.5">You hit {formatNumber(stepGoal)} steps today</div>
          </div>
        </motion.div>
      )}

      <PageTabs label="Physical sections" value={tab} onChange={setTab} tabs={TABS} />

      {tab === 'overview' && (
        <div className="grid lg:grid-cols-[1fr_300px] gap-4">
          <div className="lp-card rounded-3xl p-5 min-w-0">
            <div className="text-[13px] font-bold text-ui-ink mb-1">Your walking journey</div>
            <StepsJourney km={weekKm} />
            <div className="mt-1 flex items-center gap-3 max-sm:flex-col max-sm:items-start">
              <span className="text-[13px] font-semibold text-ui-muted w-24 flex-shrink-0">Step goal</span>
              <WeekDots values={physical.weeklySteps.map((x) => ({ day: x.day, value: x.steps || null }))} goal={stepGoal}
                today={day} color={HABIT.steps.hex} format={(v) => `${formatNumber(v)} steps`} />
            </div>
            {stepsSentence && <p className="text-[13px] text-ui-muted mt-3">{stepsSentence}</p>}
          </div>
          <div className="space-y-4">
            <ScoreImpactCard steps={todaySteps} sleep={todaySleep} />
            <WeeklySummaryCard weeklySteps={physical.weeklySteps} sleepHours={physical.sleepHours} />
          </div>
        </div>
      )}

      {tab === 'activity' && (
        <div className="rounded-3xl p-5 lp-card">
          <div className="text-[15px] font-bold text-ui-ink">Recent activity</div>
          <div className="text-xs text-ui-muted mt-0.5 mb-4">Your latest logged sessions</div>
          {recent.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-ui-raised flex items-center justify-center mx-auto mb-3">
                <Navigation size={20} className="text-ui-muted" />
              </div>
              <p className="text-sm font-semibold text-ui-ink">No activity logged yet</p>
              <p className="text-xs text-ui-muted mt-1">Tap <span className="font-semibold text-lp-primary">Start walk</span> to track your first walk</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((a, i) => (
                <motion.div key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-ui-raised">
                  <div className="w-9 h-9 rounded-xl bg-lp-primary/10 flex items-center justify-center flex-shrink-0">
                    {a.note?.includes('Walk') ? <Navigation size={14} className="text-lp-primary" /> : <Activity size={14} className="text-lp-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-ui-ink truncate">{a.note?.trim() || 'Activity'}</div>
                    <div className="text-xs text-ui-muted mt-0.5">
                      {new Date(a.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-ui-ink">{formatNumber(a.steps)} steps</div>
                    <div className="text-xs text-ui-muted">{formatDistance(a.distanceKm, units)} · {a.caloriesKcal} kcal</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'sleep' && (
        <div className="grid lg:grid-cols-[300px_1fr] gap-4">
          <SleepLogger value={todaySleep} onChange={(h) => { updateSleepForToday(h); toast.success(`Sleep logged: ${h}h`) }} />
          <div className="rounded-3xl p-5 lp-card min-w-0">
            <div className="text-[13px] font-bold text-ui-ink mb-1">Your nights</div>
            <p className="text-[15px] text-ui-muted leading-snug mb-4">
              {sleepSentence ?? 'Log your sleep each morning and your week of nights appears here.'}
            </p>
            <SleepNightSky nights={physical.sleepHours} goalHours={goals.goalSleepHours} today={day} />
          </div>
        </div>
      )}

      {tab === 'charts' && (
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { title: 'Steps this week', sub: 'Daily step count', chart: <StepsBarChart data={physical.weeklySteps} /> },
            { title: 'Distance this week', sub: 'Kilometres walked', chart: <DistanceLineChart data={physical.weeklyDistanceKm} /> },
            { title: 'Calories burned', sub: 'Daily calorie burn', chart: <CaloriesLineChart data={physical.weeklyCaloriesKcal} /> },
            { title: 'Sleep pattern', sub: 'Hours per night', chart: <SleepAreaChart data={physical.sleepHours} /> },
          ].map(({ title, sub, chart }) => (
            <div key={title} className="lp-card rounded-3xl p-5">
              <div className="text-sm font-bold text-ui-ink">{title}</div>
              <div className="text-xs text-ui-muted mt-0.5 mb-3">{sub}</div>
              <div className="h-44">{chart}</div>
            </div>
          ))}
        </div>
      )}

      {/* Walk Tracker overlay */}
      <WalkTracker open={walkOpen} onClose={() => setWalkOpen(false)} />

      {/* Steps counted by the phone itself (the app can't read them in the background) */}
      <Modal open={stepsOpen} onClose={() => setStepsOpen(false)} title="Enter today's steps">
        <p className="text-sm text-black/55 dark:text-white/45 -mt-1 mb-4">
          Your phone counts steps all day, even when LivoraPulse is closed. Open its health or fitness app and type
          in today&apos;s total. Steps already counted here ({formatNumber(todaySteps)}) aren&apos;t added twice.
        </p>
        <Input label="Today's steps on your phone" value={phoneStepsInput} onChange={(e) => setPhoneStepsInput(e.target.value)}
          inputMode="numeric" placeholder="e.g. 6400" autoFocus />
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setStepsOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            const total = Math.round(Number(phoneStepsInput.replace(/[,\s]/g, '')))
            if (!Number.isFinite(total) || total <= 0 || total > 100000) {
              toast.error('Enter the number of steps your phone shows for today')
              return
            }
            const extra = total - todaySteps
            setStepsOpen(false)
            if (extra <= 0) {
              toast.success(`Already counted: you have ${formatNumber(todaySteps)} steps today`)
              return
            }
            // About 0.75 m a step, as elsewhere on this page
            addActivity({ steps: extra, distanceKm: Math.round(extra * 0.00075 * 100) / 100, caloriesKcal: 0, note: "Steps from my phone's step counter" })
              .then(() => toast.success(`Added ${formatNumber(extra)} steps (${formatNumber(total)} today)`))
              .catch((err: Error) => toast.error(err.message))
          }}>Save</Button>
        </div>
      </Modal>

      {/* Log other activity modal */}
      <Modal open={otherOpen} onClose={() => setOtherOpen(false)} title="Log other activity">
        <p className="text-sm text-black/55 dark:text-white/45 -mt-1 mb-4">
          For gym sessions, cycling, swimming, or any activity where GPS tracking doesn&apos;t apply.
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          <Input label="Calories burned (kcal)" value={caloriesInput} onChange={(e) => setCaloriesInput(e.target.value)} inputMode="numeric" />
          <Input label="Activity note" value={noteInput} onChange={(e) => setNoteInput(e.target.value)} placeholder="e.g. Gym session, Cycling…" />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOtherOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            const c = Math.max(0, Math.round(Number(caloriesInput) || 0))
            addActivity({ steps: 0, distanceKm: 0, caloriesKcal: c, note: noteInput.trim() || 'Other activity' })
            setOtherOpen(false)
            toast.success('Activity logged')
            setNoteInput('')
            setCaloriesInput('100')
          }}>Save</Button>
        </div>
      </Modal>
    </div>
  )
}