import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  MonitorSmartphone, Plus, TrendingUp, TrendingDown,
  Minus, Target, Smartphone, Lock, Timer,
  Zap, BarChart3,
} from 'lucide-react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

import AppUsagePieChart from '../components/charts/AppUsagePieChart'
import ScreenTimeLineChart from '../components/charts/ScreenTimeLineChart'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'

import { useAppStore } from '../store/useAppStore'
import { getDayKey } from '../utils/date'
import { formatMinutesToHM } from '../utils/format'
import type { AppCategory } from '../data/types'

// ---------------------------------------------------------------------------
// Goal progress bar
// ---------------------------------------------------------------------------
function GoalBar({ value, max, color, invert = false }: {
  value: number; max: number; color: string; invert?: boolean
}) {
  const raw = Math.min(Math.round((value / max) * 100), 100)
  const pct = invert ? 100 - raw : raw
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-black/40 dark:text-white/35">
          {invert ? 'Usage vs limit' : 'Progress'}
        </span>
        <span className="font-semibold" style={{ color }}>{raw}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.06] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${raw}%` }}
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
  invert?: boolean
  trend?: 'up' | 'down' | 'flat'
}

function StatCard({ label, value, context, icon, color, goalValue, goalMax, invert, trend }: StatCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? '#4CAF50' : trend === 'down' ? '#FF6B6B' : '#94a3b8'

  return (
    <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #00BCD40A 0%, #00BCD405 100%)`, border: `1px solid #00BCD420` }}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: color + '18' }}>
          <div style={{ color }}>{icon}</div>
        </div>
        {trend && <TrendIcon size={13} style={{ color: trendColor }} className="mt-1 flex-shrink-0" />}
      </div>
      <div className="text-[10px] font-bold text-black/35 dark:text-white/30 uppercase tracking-wider">{label}</div>
      <div className="mt-1 text-xl font-black text-black/85 dark:text-white/90 leading-none">{value}</div>
      <div className="mt-1 text-xs text-black/45 dark:text-white/40 leading-relaxed">{context}</div>
      {goalValue !== undefined && goalMax !== undefined && goalMax > 0 && (
        <div className="mt-3">
          <GoalBar value={goalValue} max={goalMax} color={color} invert={invert} />
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// App-only locked feature card
// ---------------------------------------------------------------------------
function AppOnlyCard() {
  return (
    <div className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] border-dashed rounded-2xl p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-black/[0.06] dark:bg-white/[0.06] flex items-center justify-center flex-shrink-0">
        <Lock size={18} className="text-black/30 dark:text-white/30" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-black/55 dark:text-white/50">Auto screen time tracking</div>
        <div className="text-xs text-black/35 dark:text-white/30 mt-0.5 leading-relaxed">
          Automatic per-app tracking is available on the LivoraPulse Android app — it reads screen time directly from your device.
        </div>
      </div>
      <div className="flex-shrink-0">
        <div className="px-3 py-1.5 rounded-lg bg-black/[0.06] dark:bg-white/[0.06] text-xs font-semibold text-black/40 dark:text-white/35">
          Android app
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Focus mode toggle card
// ---------------------------------------------------------------------------
function FocusModeCard({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <div className={clsx(
      'rounded-2xl border p-4 transition-all duration-300',
      enabled
        ? 'bg-lp-primary/[0.08] border-lp-primary/25'
        : 'bg-white dark:bg-slate-900 border-black/[0.06] dark:border-white/[0.06]',
    )}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={clsx(
            'w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-300',
            enabled ? 'bg-lp-primary/20' : 'bg-black/[0.06] dark:bg-white/[0.06]',
          )}>
            <Zap size={17} className={enabled ? 'text-lp-primary' : 'text-black/40 dark:text-white/40'} />
          </div>
          <div>
            <div className="text-sm font-semibold text-black/75 dark:text-white/70">Focus Mode</div>
            <div className="text-xs text-black/40 dark:text-white/35 mt-0.5">
              {enabled ? 'Active — distractions reduced, focus score boosted' : 'Reduces distractions and boosts your focus score'}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={clsx(
            'relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0',
            enabled ? 'bg-lp-primary' : 'bg-black/20 dark:bg-white/20',
          )}
          aria-label={enabled ? 'Disable Focus Mode' : 'Enable Focus Mode'}
        >
          <motion.div
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
            animate={{ left: enabled ? '22px' : '2px' }}
            transition={{ duration: 0.2 }}
          />
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Score impact sidebar card
// ---------------------------------------------------------------------------
function ScoreImpactCard({ screenMin }: { screenMin: number }) {
  const LIMIT = 240
  const digitalScore = Math.round(Math.max(0, Math.min(100, 110 - (screenMin / LIMIT) * 100)))
  const overLimit = Math.max(0, screenMin - LIMIT)
  const remaining = Math.max(0, LIMIT - screenMin)

  return (
    <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #00BCD40A 0%, #00BCD405 100%)`, border: `1px solid #00BCD420` }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-lp-accent/15 flex items-center justify-center">
          <Target size={14} className="text-lp-accent" />
        </div>
        <span className="text-sm font-semibold text-black/70 dark:text-white/70">Score Impact</span>
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-black text-black/85 dark:text-white/90">{digitalScore}</span>
        <span className="text-xs text-black/35 dark:text-white/30">/ 100 digital score</span>
      </div>
      {screenMin === 0 ? (
        <p className="text-xs text-black/50 dark:text-white/45 leading-relaxed mt-2">
          No screen time logged yet. Log a session to see your digital score.
        </p>
      ) : overLimit > 0 ? (
        <p className="text-xs text-lp-alert/80 leading-relaxed mt-2">
          You are <span className="font-bold">{formatMinutesToHM(overLimit)} over</span> the 4-hour daily limit. This is reducing your overall score.
        </p>
      ) : (
        <p className="text-xs text-black/50 dark:text-white/45 leading-relaxed mt-2">
          <span className="font-bold text-lp-primary">{formatMinutesToHM(remaining)}</span> remaining before hitting the 4-hour daily limit.
        </p>
      )}
      <div className="mt-3 pt-3 border-t border-black/[0.05] dark:border-white/[0.05]">
        <div className="text-[10px] text-black/30 dark:text-white/25 uppercase tracking-wider mb-2">Digital contribution</div>
        <div className="h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.06] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: digitalScore >= 70 ? '#4CAF50' : digitalScore >= 50 ? '#FFA500' : '#FF6B6B' }}
            initial={{ width: 0 }}
            animate={{ width: `${digitalScore}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Category breakdown sidebar card
// ---------------------------------------------------------------------------
function CategoryBreakdownCard({ categories }: {
  categories: Array<{ category: string; minutes: number }>
}) {
  const total = categories.reduce((s, c) => s + c.minutes, 0)
  const categoryColors: Record<string, string> = {
    Social: '#FF6B6B',
    Productive: '#4CAF50',
    Entertainment: '#6366F1',
  }
  const categoryContext: Record<string, string> = {
    Social: 'social apps',
    Productive: 'productive apps',
    Entertainment: 'entertainment',
  }

  if (total === 0) return null

  return (
    <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #00BCD40A 0%, #00BCD405 100%)`, border: `1px solid #00BCD420` }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-[#6366F1]/15 flex items-center justify-center">
          <BarChart3 size={14} className="text-[#6366F1]" />
        </div>
        <span className="text-sm font-semibold text-black/70 dark:text-white/70">Category Breakdown</span>
      </div>
      <div className="space-y-3">
        {categories.map((c) => {
          const pct = total > 0 ? Math.round((c.minutes / total) * 100) : 0
          const color = categoryColors[c.category] ?? '#94a3b8'
          return (
            <div key={c.category}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-xs font-medium text-black/60 dark:text-white/55">{c.category}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-black/70 dark:text-white/65">{formatMinutesToHM(c.minutes)}</span>
                  <span className="text-[10px] text-black/30 dark:text-white/25 ml-1">{pct}%</span>
                </div>
              </div>
              <div className="h-1 rounded-full bg-black/[0.05] dark:bg-white/[0.05] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-black/40 dark:text-white/35 mt-3 leading-relaxed">
        {categories.find(c => c.category === 'Productive' && c.minutes > 0)
          ? `${Math.round((((categories.find(c => c.category === 'Productive')?.minutes ?? 0)) / total) * 100)}% of your screen time is productive.`
          : 'Log productive sessions to improve your digital score.'
        }
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Weekly summary sidebar card
// ---------------------------------------------------------------------------
function WeeklySummaryCard({ weeklyScreen }: {
  weeklyScreen: Array<{ day: string; minutes: number }>
}) {
  const total = weeklyScreen.reduce((s, x) => s + x.minutes, 0)
  const avg = Math.round(total / 7)
  const daysOver = weeklyScreen.filter(x => x.minutes > 240).length
  const bestDay = [...weeklyScreen].sort((a, b) => a.minutes - b.minutes).find(x => x.minutes > 0)

  return (
    <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #00BCD40A 0%, #00BCD405 100%)`, border: `1px solid #00BCD420` }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-lp-accent/15 flex items-center justify-center">
          <TrendingUp size={14} className="text-lp-accent" />
        </div>
        <span className="text-sm font-semibold text-black/70 dark:text-white/70">This Week</span>
      </div>
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-black/45 dark:text-white/40">Daily average</span>
          <span className="text-sm font-bold text-black/80 dark:text-white/80">{formatMinutesToHM(avg)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-black/45 dark:text-white/40">Days over limit</span>
          <span className={clsx(
            'text-sm font-bold',
            daysOver === 0 ? 'text-lp-primary' : daysOver <= 2 ? 'text-yellow-500' : 'text-lp-alert',
          )}>{daysOver} / 7</span>
        </div>
        {bestDay && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-black/45 dark:text-white/40">Best day</span>
            <span className="text-sm font-bold text-lp-primary">{bestDay.day}</span>
          </div>
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-black/[0.05] dark:border-white/[0.05]">
        <div className="flex items-end gap-1 h-10">
          {weeklyScreen.map((x) => {
            const h = Math.max(3, Math.round((x.minutes / 480) * 40))
            const over = x.minutes > 240
            return (
              <div key={x.day} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className="w-full rounded-sm"
                  style={{
                    height: h,
                    backgroundColor: over ? '#FF6B6B55' : x.minutes > 0 ? '#00BCD460' : '#0000000A',
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
// Digital page root
// ---------------------------------------------------------------------------
export default function Digital() {
  const digital = useAppStore((s) => s.digital)
  const addScreenSession = useAppStore((s) => s.addScreenSession)
  const toggleFocusMode = useAppStore((s) => s.toggleFocusMode)

  const day = getDayKey()
  const todayScreen = useAppStore(
    (s) => s.digital.weeklyScreenTimeMin.find((x) => x.day === day)?.minutes ?? 0,
  )

  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<AppCategory>('Social')
  const [minutes, setMinutes] = useState('30')

  const recentSessions = useMemo(
    () => digital.screenSessions.slice(0, 6),
    [digital.screenSessions],
  )

  const headline = useMemo(() => {
    if (todayScreen === 0) return 'No screen time logged yet today.'
    if (todayScreen <= 60) return `Only ${formatMinutesToHM(todayScreen)} of screen time today — excellent digital balance.`
    if (todayScreen <= 120) return `${formatMinutesToHM(todayScreen)} of screen time today — well within your daily limit.`
    if (todayScreen <= 240) return `${formatMinutesToHM(todayScreen)} of screen time today — ${formatMinutesToHM(240 - todayScreen)} left before the 4-hour limit.`
    return `${formatMinutesToHM(todayScreen)} today — you are ${formatMinutesToHM(todayScreen - 240)} over the recommended daily limit.`
  }, [todayScreen])

  const screenTrend = todayScreen <= 120 ? 'up' : todayScreen <= 240 ? 'flat' : 'down'

  const categoryColors: Record<AppCategory, string> = {
    Social: '#FF6B6B',
    Productive: '#4CAF50',
    Entertainment: '#6366F1',
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-black/85 dark:text-white/90">Digital Usage</h1>
          <p className="text-sm text-black/45 dark:text-white/40 mt-0.5 max-w-lg">{headline}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-lp-accent text-white text-sm font-semibold rounded-xl hover:bg-cyan-500 hover:shadow-lg hover:shadow-lp-accent/25 transition-all duration-200 flex-shrink-0"
        >
          <Plus size={15} />
          Log session
        </button>
      </div>

      {/* App-only locked state */}
      <AppOnlyCard />

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-[1fr_280px] gap-5">

        {/* Left — main content */}
        <div className="space-y-5 min-w-0">

          {/* Today's stats */}
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
            <StatCard
              label="Screen time"
              value={todayScreen > 0 ? formatMinutesToHM(todayScreen) : '—'}
              context={
                todayScreen === 0 ? 'Log a session to start tracking' :
                todayScreen <= 120 ? 'Well under the daily limit' :
                todayScreen <= 240 ? `${formatMinutesToHM(240 - todayScreen)} left before limit` :
                `${formatMinutesToHM(todayScreen - 240)} over daily limit`
              }
              icon={<MonitorSmartphone size={17} />}
              color="#00BCD4"
              goalValue={todayScreen}
              goalMax={240}
              invert
              trend={screenTrend}
            />
            <StatCard
              label="Social"
              value={formatMinutesToHM(digital.appUsageCategoriesMin.find(c => c.category === 'Social')?.minutes ?? 0)}
              context="Social media apps"
              icon={<Smartphone size={17} />}
              color="#FF6B6B"
              trend="flat"
            />
            <StatCard
              label="Productive"
              value={formatMinutesToHM(digital.appUsageCategoriesMin.find(c => c.category === 'Productive')?.minutes ?? 0)}
              context="Work and learning apps"
              icon={<Timer size={17} />}
              color="#4CAF50"
              trend="flat"
            />
          </div>

          {/* Focus mode */}
          <FocusModeCard
            enabled={digital.focusMode}
            onToggle={() => {
              toggleFocusMode()
              toast.success(digital.focusMode ? 'Focus Mode disabled' : 'Focus Mode enabled')
            }}
          />

          {/* Recent sessions */}
          <div className="rounded-3xl p-5" style={{ background: `linear-gradient(135deg, #00BCD40A 0%, #00BCD405 100%)`, border: `1px solid #00BCD420` }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-semibold text-black/80 dark:text-white/85">Recent sessions</div>
                <div className="text-xs text-black/40 dark:text-white/35 mt-0.5">Manually logged screen sessions</div>
              </div>
            </div>
            {recentSessions.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                  <MonitorSmartphone size={20} className="text-black/20 dark:text-white/20" />
                </div>
                <p className="text-sm font-medium text-black/40 dark:text-white/35">No sessions logged yet</p>
                <p className="text-xs text-black/30 dark:text-white/25 mt-1">
                  Tap <span className="font-semibold text-lp-accent">Log session</span> to add screen time manually
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentSessions.map((s, i) => {
                  const color = categoryColors[s.category as AppCategory] ?? '#94a3b8'
                  return (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors duration-150"
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: color + '20' }}>
                        <MonitorSmartphone size={14} style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-black/75 dark:text-white/75">{s.category}</div>
                        <div className="text-xs text-black/35 dark:text-white/30 mt-0.5">
                          {new Date(s.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-black/65 dark:text-white/60 flex-shrink-0">{s.minutes}m</div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #00BCD40A 0%, #00BCD405 100%)`, border: `1px solid #00BCD420` }}>
              <div className="text-sm font-semibold text-black/80 dark:text-white/85">App category split</div>
              <div className="text-xs text-black/40 dark:text-white/35 mt-0.5 mb-3">Distribution by category</div>
              <div className="h-44">
                <AppUsagePieChart data={digital.appUsageCategoriesMin} />
              </div>
            </div>
            <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #00BCD40A 0%, #00BCD405 100%)`, border: `1px solid #00BCD420` }}>
              <div className="text-sm font-semibold text-black/80 dark:text-white/85">Screen time trend</div>
              <div className="text-xs text-black/40 dark:text-white/35 mt-0.5 mb-3">Minutes per day this week</div>
              <div className="h-44">
                <ScreenTimeLineChart data={digital.weeklyScreenTimeMin} />
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <ScoreImpactCard screenMin={todayScreen} />
          <CategoryBreakdownCard categories={digital.appUsageCategoriesMin} />
          <WeeklySummaryCard weeklyScreen={digital.weeklyScreenTimeMin} />
        </div>
      </div>

      {/* Log session modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Log screen session">
        <p className="text-sm text-black/55 dark:text-white/45 -mt-1 mb-4">
          Manually log time spent on a category of apps.
        </p>
        <div className="space-y-4">
          <div>
            <div className="text-xs font-semibold text-black/50 dark:text-white/45 uppercase tracking-wider mb-2">Category</div>
            <div className="flex gap-2">
              {(['Social', 'Productive', 'Entertainment'] as AppCategory[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={clsx(
                    'flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-150 border',
                    category === c
                      ? 'text-white border-transparent'
                      : 'bg-black/[0.04] dark:bg-white/[0.04] border-black/[0.06] dark:border-white/[0.06] text-black/55 dark:text-white/50 hover:bg-black/[0.08]',
                  )}
                  style={category === c ? { backgroundColor: categoryColors[c] } : undefined}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Minutes"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            inputMode="numeric"
          />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              const m = Math.max(1, Math.round(Number(minutes) || 0))
              addScreenSession({ category, minutes: m })
              setOpen(false)
              toast.success('Session logged')
            }}
          >
            Save
          </Button>
        </div>
      </Modal>
    </div>
  )
}