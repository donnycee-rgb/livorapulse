import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Navigation, Plus, Activity, Moon, Flame, Footprints, TrendingUp, TrendingDown, Minus, Award, Target } from 'lucide-react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

import CaloriesLineChart from '../components/charts/CaloriesLineChart'
import DistanceLineChart from '../components/charts/DistanceLineChart'
import SleepAreaChart from '../components/charts/SleepAreaChart'
import StepsBarChart from '../components/charts/StepsBarChart'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import WalkTracker from '../components/WalkTracker'

import { useAppStore } from '../store/useAppStore'
import { selectLifePulseScore } from '../store/selectors'
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
    <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #4CAF500A 0%, #4CAF5005 100%)`, border: `1px solid #4CAF5020` }}>
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
  const physicalScore = Math.round(
    0.7 * Math.min((steps / 8000) * 100, 100) +
    0.3 * Math.min((sleep / 8) * 100, 100)
  )
  const stepsNeeded = Math.max(0, 8000 - steps)
  const sleepGap = Math.max(0, 7.5 - sleep)
  const potentialGain = Math.min(
    Math.round((stepsNeeded / 8000) * 0.7 * 26 + (sleepGap / 8) * 0.3 * 26),
    12
  )

  return (
    <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #4CAF500A 0%, #4CAF5005 100%)`, border: `1px solid #4CAF5020` }}>
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
  const totalSteps = weeklySteps.reduce((s, x) => s + x.steps, 0)
  const activeDays = weeklySteps.filter(x => x.steps > 0).length
  const sleepWithData = sleepHours.filter(x => x.hours > 0)
  const avgSleep = sleepWithData.length > 0
    ? sleepWithData.reduce((s, x) => s + x.hours, 0) / sleepWithData.length
    : 0

  return (
    <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #4CAF500A 0%, #4CAF5005 100%)`, border: `1px solid #4CAF5020` }}>
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
                    backgroundColor: x.steps >= 8000 ? '#4CAF50' : x.steps > 0 ? '#4CAF5055' : '#0000000A',
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
  const getLabel = (h: number) => h >= 8 ? 'Great' : h >= 7 ? 'Good' : h >= 6 ? 'Fair' : 'Low'

  return (
    <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #4CAF500A 0%, #4CAF5005 100%)`, border: `1px solid #4CAF5020` }}>
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
              'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150',
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

// ---------------------------------------------------------------------------
// Physical page root
// ---------------------------------------------------------------------------
export default function Physical() {
  const units = useAppStore((s) => s.preferences.units)
  const physical = useAppStore((s) => s.physical)
  const addActivity = useAppStore((s) => s.addActivity)
  const updateSleepForToday = useAppStore((s) => s.updateSleepForToday)

  const day = getDayKey()
  const todaySteps = physical.weeklySteps.find((x) => x.day === day)?.steps ?? 0
  const todayDistance = physical.weeklyDistanceKm.find((x) => x.day === day)?.km ?? 0
  const todayCalories = physical.weeklyCaloriesKcal.find((x) => x.day === day)?.kcal ?? 0
  const todaySleep = physical.sleepHours.find((x) => x.day === day)?.hours ?? 0

  const [walkOpen, setWalkOpen] = useState(false)
  const [otherOpen, setOtherOpen] = useState(false)
  const [caloriesInput, setCaloriesInput] = useState('100')
  const [noteInput, setNoteInput] = useState('')

  const recent = useMemo(() => physical.activityLog.slice(0, 5), [physical.activityLog])

  const headline = useMemo(() => {
    if (todaySteps >= 10000) return `Outstanding — ${formatNumber(todaySteps)} steps today. Daily goal exceeded.`
    if (todaySteps >= 8000) return `Great progress — ${formatNumber(todaySteps)} steps. Daily goal reached.`
    if (todaySteps >= 5000) return `${formatNumber(todaySteps)} steps so far — ${formatNumber(8000 - todaySteps)} more to hit your goal.`
    if (todaySteps > 0) return `${formatNumber(todaySteps)} steps logged. Keep going — ${formatNumber(8000 - todaySteps)} steps to go.`
    return 'No activity logged yet today — tap Start Walk to begin.'
  }, [todaySteps])

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-black/85 dark:text-white/90">Physical Activity</h1>
          <p className="text-sm text-black/45 dark:text-white/40 mt-0.5 max-w-lg">{headline}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setWalkOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-bold rounded-2xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200" style={{ background: 'linear-gradient(135deg, #4CAF50, #00BCD4)' }}
          >
            <Navigation size={15} />
            Start Walk
          </button>
          <button
            type="button"
            onClick={() => setOtherOpen(true)}
            className="flex items-center gap-2 px-3 py-2.5 bg-black/[0.05] dark:bg-white/[0.06] text-black/60 dark:text-white/55 text-sm font-semibold rounded-xl hover:bg-black/[0.09] dark:hover:bg-white/[0.10] transition-all duration-200"
          >
            <Plus size={15} />
            Other
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-[1fr_280px] gap-5">

        {/* Left — main content */}
        <div className="space-y-5 min-w-0">

          {/* Today's stats */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <StatCard
              label="Steps"
              value={formatNumber(todaySteps)}
              context={todaySteps >= 8000 ? 'Daily goal reached' : `${formatNumber(Math.max(0, 8000 - todaySteps))} to reach 8,000`}
              icon={<Footprints size={17} />}
              color="#4CAF50"
              goalValue={todaySteps}
              goalMax={8000}
              trend={todaySteps >= 8000 ? 'up' : todaySteps >= 4000 ? 'flat' : 'down'}
            />
            <StatCard
              label="Distance"
              value={formatDistance(todayDistance, units)}
              context={todayDistance >= 5 ? 'Great distance today' : todayDistance > 0 ? `${(5 - todayDistance).toFixed(1)} km to 5 km goal` : 'No distance yet'}
              icon={<Navigation size={17} />}
              color="#00BCD4"
              goalValue={todayDistance}
              goalMax={5}
              trend={todayDistance >= 5 ? 'up' : todayDistance > 0 ? 'flat' : 'down'}
            />
            <StatCard
              label="Calories"
              value={`${todayCalories} kcal`}
              context={todayCalories >= 300 ? 'Active calorie burn' : todayCalories > 0 ? 'Keep moving to burn more' : 'Start a walk to burn calories'}
              icon={<Flame size={17} />}
              color="#FFA500"
              goalValue={todayCalories}
              goalMax={300}
              trend={todayCalories >= 300 ? 'up' : todayCalories > 0 ? 'flat' : 'down'}
            />
            <StatCard
              label="Sleep"
              value={todaySleep > 0 ? `${todaySleep}h` : 'Not logged'}
              context={todaySleep >= 8 ? 'Excellent rest' : todaySleep >= 7 ? 'Good sleep' : todaySleep >= 6 ? 'Slightly below ideal' : todaySleep > 0 ? 'Low sleep affects your score' : "Log last night's sleep"}
              icon={<Moon size={17} />}
              color="#6366F1"
              goalValue={todaySleep}
              goalMax={8}
              trend={todaySleep >= 7.5 ? 'up' : todaySleep >= 6 ? 'flat' : todaySleep > 0 ? 'down' : undefined}
            />
          </div>

          {/* Recent activity */}
          <div className="rounded-3xl p-5" style={{ background: `linear-gradient(135deg, #4CAF500A 0%, #4CAF5005 100%)`, border: `1px solid #4CAF5020` }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-semibold text-black/80 dark:text-white/85">Recent activity</div>
                <div className="text-xs text-black/40 dark:text-white/35 mt-0.5">Your latest logged sessions</div>
              </div>
            </div>
            {recent.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                  <Navigation size={20} className="text-black/20 dark:text-white/20" />
                </div>
                <p className="text-sm font-medium text-black/40 dark:text-white/35">No activity logged yet</p>
                <p className="text-xs text-black/30 dark:text-white/25 mt-1">
                  Tap <span className="font-semibold text-lp-primary">Start Walk</span> to track your first walk
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recent.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors duration-150"
                  >
                    <div className="w-9 h-9 rounded-xl bg-lp-primary/10 flex items-center justify-center flex-shrink-0">
                      {a.note?.includes('Walk') ? <Navigation size={14} className="text-lp-primary" /> : <Activity size={14} className="text-lp-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-black/75 dark:text-white/75 truncate">{a.note?.trim() || 'Activity'}</div>
                      <div className="text-xs text-black/35 dark:text-white/30 mt-0.5">
                        {new Date(a.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold text-black/70 dark:text-white/65">{formatNumber(a.steps)} steps</div>
                      <div className="text-xs text-black/35 dark:text-white/30">{formatDistance(a.distanceKm, units)} · {a.caloriesKcal} kcal</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Charts 2x2 grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: 'Steps this week', sub: 'Daily step count', chart: <StepsBarChart data={physical.weeklySteps} /> },
              { title: 'Distance this week', sub: 'Kilometres walked', chart: <DistanceLineChart data={physical.weeklyDistanceKm} /> },
              { title: 'Calories burned', sub: 'Daily calorie burn', chart: <CaloriesLineChart data={physical.weeklyCaloriesKcal} /> },
              { title: 'Sleep pattern', sub: 'Hours per night', chart: <SleepAreaChart data={physical.sleepHours} /> },
            ].map(({ title, sub, chart }) => (
              <div key={title} className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #4CAF500A 0%, #4CAF5005 100%)`, border: `1px solid #4CAF5020` }}>
                <div className="text-sm font-semibold text-black/80 dark:text-white/85">{title}</div>
                <div className="text-xs text-black/40 dark:text-white/35 mt-0.5 mb-3">{sub}</div>
                <div className="h-44">{chart}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <ScoreImpactCard steps={todaySteps} sleep={todaySleep} />
          <SleepLogger
            value={todaySleep}
            onChange={(h) => { updateSleepForToday(h); toast.success(`Sleep logged: ${h}h`) }}
          />
          <WeeklySummaryCard weeklySteps={physical.weeklySteps} sleepHours={physical.sleepHours} />
          {todaySteps >= 8000 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-lp-primary/[0.08] border border-lp-primary/20 rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-lp-primary/20 flex items-center justify-center flex-shrink-0">
                <Award size={16} className="text-lp-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold text-black/75 dark:text-white/75">Daily goal reached</div>
                <div className="text-xs text-black/45 dark:text-white/40 mt-0.5">You hit 8,000 steps today</div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Walk Tracker overlay */}
      <WalkTracker open={walkOpen} onClose={() => setWalkOpen(false)} />

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