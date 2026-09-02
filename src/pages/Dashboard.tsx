import {
  Activity, MonitorSmartphone, Timer, Heart,
  TrendingUp, TrendingDown, Minus, Zap,
  Flame, BarChart3, Leaf, Moon,
  ArrowRight, CheckCircle2, UtensilsCrossed, Droplets,
} from 'lucide-react'
import { useMemo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

import ActivityAnalyticsChart from '../components/charts/ActivityAnalyticsChart'
import { useAppStore } from '../store/useAppStore'
import { useAuthStore } from '../store/useAuthStore'
import { selectDailyInsight, selectLifePulseScore } from '../store/selectors'
import { formatMinutesToHM, formatNumber } from '../utils/format'
import { getDayKey } from '../utils/date'
import { apiGet } from '../api/client'
import AssessmentReminder from '../components/AssessmentReminder'
import CyclePhaseCard from '../components/CyclePhaseCard'

// ---------------------------------------------------------------------------
// Helpers — unchanged
// ---------------------------------------------------------------------------
function firstName(full: string) {
  return full.trim().split(/\s+/)[0] ?? full
}
function getScoreColor(score: number) {
  if (score >= 80) return '#4CAF50'
  if (score >= 60) return '#FFA500'
  if (score >= 40) return '#00BCD4'
  return '#FF6B6B'
}
function getScoreLabel(score: number) {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Needs work'
}
function getStreakLabel(streak: number) {
  if (streak >= 30) return 'On fire'
  if (streak >= 14) return 'Consistent'
  if (streak >= 7) return 'Building'
  if (streak >= 3) return 'Getting started'
  return 'Day one'
}

// ---------------------------------------------------------------------------
// Sparkline — tiny inline SVG trend line
// ---------------------------------------------------------------------------
function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (!values.length) return null
  const max = Math.max(...values, 1)
  const w = 64; const h = 24
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - (v / max) * (h - 4) - 2
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-70">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Score ring — gradient version
// ---------------------------------------------------------------------------
function ScoreRing({ score }: { score: number }) {
  const r = 54
  const circ = 2 * Math.PI * r
  const [displayed, setDisplayed] = useState(0)
  const color = getScoreColor(score)

  useEffect(() => {
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / 900, 1)
      setDisplayed(Math.round(score * (1 - Math.pow(1 - p, 3))))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [score])

  const gradId = `scoreGrad-${score}`

  return (
    <div className="relative w-36 h-36 flex-shrink-0">
      {/* Outer glow */}
      <div className="absolute inset-2 rounded-full blur-xl opacity-30"
        style={{ background: color }} />
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90 relative z-10">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle cx="60" cy="60" r={r} fill="none"
          stroke="currentColor" strokeWidth="10"
          className="text-black/[0.06] dark:text-white/[0.07]" />
        {/* Progress */}
        <circle cx="60" cy="60" r={r} fill="none"
          stroke={`url(#${gradId})`} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ}
          strokeDashoffset={circ * (1 - displayed / 100)}
          style={{ transition: 'stroke-dashoffset 0.03s linear' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <span className="text-3xl font-black leading-none" style={{ color }}>{displayed}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest mt-0.5"
          style={{ color, opacity: 0.6 }}>score</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Streak bars — unchanged logic, new style
// ---------------------------------------------------------------------------
function StreakDisplay({ streak }: { streak: number }) {
  const bars = Array.from({ length: 7 }, (_, i) => i < Math.min(streak, 7))
  return (
    <div className="flex items-end gap-1.5">
      {bars.map((active, i) => (
        <motion.div key={i}
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ delay: i * 0.06, duration: 0.4, ease: 'easeOut' }}
          className="w-3 rounded-sm origin-bottom"
          style={{
            height: active ? `${Math.min(10 + i * 4, 30)}px` : '8px',
            background: active
              ? `linear-gradient(to top, #4CAF50, #81C784)`
              : 'rgba(0,0,0,0.08)',
          }} />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Week heatmap — unchanged logic, new style
// ---------------------------------------------------------------------------
function WeekHeatmap() {
  const weeklySteps = useAppStore((s) => s.physical.weeklySteps)
  const weeklyFocus = useAppStore((s) => s.productivity.focusMinutesByDay)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
  const today = getDayKey()
  const todayIdx = days.indexOf(today)

  return (
    <div className="flex items-center gap-1.5">
      {days.map((day, i) => {
        const steps = weeklySteps.find(x => x.day === day)?.steps ?? 0
        const focus = weeklyFocus.find(x => x.day === day)?.minutes ?? 0
        const activity = Math.min((steps / 8000 + focus / 120) / 2, 1)
        const isFuture = i > todayIdx
        const isToday = day === today
        const opacity = isFuture ? 0 : activity

        return (
          <div key={day} className="flex flex-col items-center gap-1.5">
            <div className="w-7 h-7 rounded-xl transition-all duration-300 relative overflow-hidden"
              style={{
                background: isToday
                  ? `rgba(76,175,80,${Math.max(opacity, 0.15)})`
                  : `rgba(76,175,80,${opacity * 0.85})`,
                border: isToday ? '2px solid #4CAF50' : '1px solid rgba(76,175,80,0.15)',
              }}>
              {isToday && (
                <div className="absolute inset-0 bg-lp-primary/10 animate-pulse" />
              )}
            </div>
            <span className={`text-[9px] font-semibold ${isToday ? 'text-lp-primary' : 'text-black/25 dark:text-white/20'}`}>
              {day.slice(0, 1)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dimension metric card — inspired by inspo
// ---------------------------------------------------------------------------
interface DimensionCardProps {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
  color: string
  trend?: 'up' | 'down' | 'flat'
  to: string
  sparkValues?: number[]
}

function DimensionCard({ label, value, sub, icon, color, trend, to, sparkValues }: DimensionCardProps) {
  const navigate = useNavigate()
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? '#4CAF50' : trend === 'down' ? '#FF6B6B' : '#94a3b8'
  const trendLabel = trend === 'up' ? '+Good' : trend === 'down' ? 'Low' : 'Steady'

  return (
    <motion.button type="button" onClick={() => navigate(to)}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.97 }}
      className="w-full text-left rounded-2xl p-4 relative overflow-hidden group transition-all duration-200"
      style={{
        background: `linear-gradient(135deg, ${color}10 0%, ${color}05 100%)`,
        border: `1px solid ${color}25`,
        boxShadow: `0 4px 20px ${color}10`,
      }}>
      {/* Background blob */}
      <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-2xl"
        style={{ background: color, opacity: 0.12 }} />

      <div className="relative z-10">
        {/* Top row */}
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}20` }}>
            <div style={{ color }}>{icon}</div>
          </div>
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
            style={{ background: `${trendColor}15` }}>
            <TrendIcon size={9} style={{ color: trendColor }} />
            <span className="text-[9px] font-bold" style={{ color: trendColor }}>{trendLabel}</span>
          </div>
        </div>

        {/* Value */}
        <div className="text-[10px] font-semibold uppercase tracking-widest mb-0.5"
          style={{ color: `${color}99` }}>{label}</div>
        <div className="text-xl font-black text-black/85 dark:text-white/90 leading-none">{value}</div>
        {sub && <div className="text-[10px] text-black/35 dark:text-white/30 mt-0.5">{sub}</div>}

        {/* Sparkline */}
        {sparkValues && sparkValues.some(v => v > 0) && (
          <div className="mt-2">
            <Sparkline values={sparkValues} color={color} />
          </div>
        )}
      </div>
    </motion.button>
  )
}

// ---------------------------------------------------------------------------
// Water ring — unchanged logic, new style
// ---------------------------------------------------------------------------
function WaterRing({ glasses, goal = 8, onClick }: {
  glasses: number; goal?: number; onClick: () => void
}) {
  const pct = Math.min(glasses / goal, 1)
  const r = 20; const cx = 26; const cy = 26
  const circ = 2 * Math.PI * r
  const filled = pct * circ

  return (
    <button type="button" onClick={onClick} className="relative flex-shrink-0 group"
      title={`Water: ${glasses}/${goal} glasses`}>
      <div className="relative w-[52px] h-[52px]">
        <svg width="52" height="52" viewBox="0 0 52 52" className="-rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(59,130,246,0.12)" strokeWidth="5" />
          <motion.circle cx={cx} cy={cy} r={r} fill="none"
            stroke="#3B82F6" strokeWidth="5" strokeLinecap="round"
            strokeDasharray={`${filled} ${circ}`}
            initial={{ strokeDasharray: `0 ${circ}` }}
            animate={{ strokeDasharray: `${filled} ${circ}` }}
            transition={{ duration: 0.8, ease: 'easeOut' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Droplets size={12} className="text-blue-400" style={{ opacity: 0.5 + pct * 0.5 }} />
          <span className="text-[11px] font-black text-blue-500 leading-none mt-0.5">{glasses}</span>
        </div>
      </div>
      {glasses >= goal && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center">
          <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Greeting illustration — inline SVG wellness scene
// ---------------------------------------------------------------------------
function WellnessSVG() {
  return (
    <svg viewBox="0 0 180 140" className="w-full h-full" fill="none">
      {/* Body */}
      <ellipse cx="90" cy="105" rx="28" ry="8" fill="rgba(76,175,80,0.12)" />
      <rect x="75" y="72" width="30" height="36" rx="8" fill="rgba(76,175,80,0.25)" />
      {/* Head */}
      <circle cx="90" cy="58" r="16" fill="rgba(76,175,80,0.3)" />
      <circle cx="84" cy="55" r="2.5" fill="rgba(76,175,80,0.8)" />
      <circle cx="96" cy="55" r="2.5" fill="rgba(76,175,80,0.8)" />
      <path d="M85 63 Q90 67 95 63" stroke="rgba(76,175,80,0.8)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Arms */}
      <path d="M75 80 Q60 75 58 65" stroke="rgba(76,175,80,0.4)" strokeWidth="6" strokeLinecap="round" />
      <path d="M105 80 Q120 75 122 65" stroke="rgba(76,175,80,0.4)" strokeWidth="6" strokeLinecap="round" />
      {/* Phone in right hand */}
      <rect x="118" y="56" width="10" height="16" rx="2.5" fill="rgba(76,175,80,0.5)" />
      <rect x="120" y="58" width="6" height="9" rx="1" fill="rgba(76,175,80,0.8)" />
      {/* Legs */}
      <path d="M84 108 L80 128" stroke="rgba(76,175,80,0.4)" strokeWidth="6" strokeLinecap="round" />
      <path d="M96 108 L100 128" stroke="rgba(76,175,80,0.4)" strokeWidth="6" strokeLinecap="round" />
      {/* Floating hearts */}
      <path d="M130 30 C130 28 128 26 126 28 C124 26 122 28 122 30 C122 33 126 36 126 36 C126 36 130 33 130 30Z"
        fill="#FF6B6B" opacity="0.6" />
      <path d="M148 45 C148 43.5 146.5 42 145 43.5 C143.5 42 142 43.5 142 45 C142 47 145 49 145 49 C145 49 148 47 148 45Z"
        fill="#FF6B6B" opacity="0.4" />
      {/* Heartbeat line */}
      <polyline points="20,70 35,70 40,58 45,82 50,58 55,82 60,70 75,70"
        stroke="rgba(76,175,80,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Sparkles */}
      <circle cx="150" cy="25" r="2" fill="#FFA500" opacity="0.7" />
      <circle cx="35" cy="40" r="1.5" fill="#4CAF50" opacity="0.6" />
      <circle cx="160" cy="70" r="1.5" fill="#00BCD4" opacity="0.6" />
      <path d="M152 15 L153 18 L156 19 L153 20 L152 23 L151 20 L148 19 L151 18Z"
        fill="#FFA500" opacity="0.5" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export default function Dashboard() {
  const navigate = useNavigate()
  const user = useAppStore((s) => s.user)
  const lastUpdatedAt = useAppStore((s) => s.meta.lastUpdatedAt)
  const score = useAppStore(selectLifePulseScore)
  const insight = useAppStore(selectDailyInsight)

  const day = getDayKey()
  const steps = useAppStore((s) => s.physical.weeklySteps.find((x) => x.day === day)?.steps ?? 0)
  const sleep = useAppStore((s) => s.physical.sleepHours.find((x) => x.day === day)?.hours ?? 0)
  const screenMin = useAppStore((s) => s.digital.weeklyScreenTimeMin.find((x) => x.day === day)?.minutes ?? 0)
  const focusMin = useAppStore((s) => s.productivity.focusMinutesByDay.find((x) => x.day === day)?.minutes ?? 0)
  const stressScore = useAppStore((s) => s.mood.today.stressScore)
  const [todayCalories, setTodayCalories] = useState(0)
  const [todayWater, setTodayWater] = useState(0)
  const calorieGoal = (useAppStore.getState().goals as any).goalCaloriesPerDay ?? 2000

  useEffect(() => {
    apiGet<{ success: boolean; data: { totals: { calories: number } } }>('/api/nutrition/today')
      .then(r => {
        const cal = Math.round(r.data.totals.calories)
        setTodayCalories(cal)
        localStorage.setItem('lp_today_calories', String(cal))
      }).catch(() => null)
    apiGet<{ success: boolean; data: { glasses: number } }>('/api/nutrition/water/today')
      .then(r => setTodayWater(r.data.glasses)).catch(() => null)
  }, [])

  const ecoActions = useAppStore((s) => s.environment.ecoActions.filter(a => {
    const d = new Date(a.timestamp)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  }).length)

  const weeklySteps = useAppStore((s) => s.physical.weeklySteps)
  const weeklyScreen = useAppStore((s) => s.digital.weeklyScreenTimeMin)
  const weeklyFocus = useAppStore((s) => s.productivity.focusMinutesByDay)

  const [streak, setStreak] = useState(0)
  useEffect(() => {
    const stored = localStorage.getItem('lp_streak')
    if (stored) setStreak(parseInt(stored, 10) || 0)
  }, [])

  const chartData = useMemo(() => {
    const stepsByDay = new Map(weeklySteps.map((x) => [x.day, x.steps]))
    const screenByDay = new Map(weeklyScreen.map((x) => [x.day, x.minutes]))
    const focusByDay = new Map(weeklyFocus.map((x) => [x.day, x.minutes]))
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
    return days.map((d) => ({
      day: d,
      steps: stepsByDay.get(d) ?? 0,
      screenMin: screenByDay.get(d) ?? 0,
      focusMin: focusByDay.get(d) ?? 0,
    }))
  }, [weeklySteps, weeklyScreen, weeklyFocus])

  // Sparkline data — last 7 days per metric
  const stepsSparkline = weeklySteps.map(x => x.steps)
  const screenSparkline = weeklyScreen.map(x => x.minutes)
  const focusSparkline = weeklyFocus.map(x => x.minutes)

  const scoreColor = getScoreColor(score)
  const scoreLabel = getScoreLabel(score)
  const hasAnyData = steps > 0 || sleep > 0 || screenMin > 0 || focusMin > 0

  const timeOfDay = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'

  // 6 dimension bars
  const dimensions = [
    { label: 'Physical', value: Math.min(Math.round((steps / 8000) * 100), 100), color: '#4CAF50' },
    { label: 'Digital',  value: Math.min(Math.round(((240 - Math.min(screenMin, 240)) / 240) * 100), 100), color: '#00BCD4' },
    { label: 'Focus',    value: Math.min(Math.round((focusMin / 120) * 100), 100), color: '#6366F1' },
    { label: 'Mood',     value: Math.min(Math.round(((5 - stressScore + 1) / 5) * 100), 100), color: '#FFA500' },
    { label: 'Eco',      value: Math.min(ecoActions * 25, 100), color: '#34A853' },
    { label: 'Nutrition',value: Math.min(Math.round((todayCalories / calorieGoal) * 100), 100), color: '#FF6B6B' },
  ]

  return (
    <div className="space-y-5">

      {/* ══ ROW 1 — Greeting hero + streak ══ */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="grid lg:grid-cols-[1fr_300px] gap-4">

        {/* ── Greeting + score ── */}
        <div className="relative rounded-3xl overflow-hidden p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(76,175,80,0.12) 0%, rgba(0,188,212,0.06) 60%, transparent 100%)',
            border: '1px solid rgba(76,175,80,0.18)',
          }}>
          {/* Background decoration */}
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl opacity-20"
            style={{ background: 'radial-gradient(circle, #4CAF50, #00BCD4)' }} />
          <div className="absolute top-0 right-0 w-40 h-full opacity-40 pointer-events-none hidden lg:block">
            <WellnessSVG />
          </div>

          <div className="relative z-10 flex items-start gap-6">
            <ScoreRing score={score} />
            <div className="flex-1 min-w-0">
              {/* Greeting */}
              <div className="flex items-center gap-2 mb-1">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name}
                    className="w-7 h-7 rounded-xl object-cover ring-2 ring-lp-primary/30" />
                ) : (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-lp-primary to-green-400 flex items-center justify-center text-white text-[10px] font-black shadow-md">
                    {user.name.trim().split(/\s+/).slice(0, 2).map((p: string) => p[0]).join('').toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-black/50 dark:text-white/45">
                  Good {timeOfDay},{' '}
                  <span className="font-bold text-black/75 dark:text-white/80">{firstName(user.name)}</span>
                </span>
              </div>

              {/* Score label */}
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-black leading-none" style={{ color: scoreColor }}>{scoreLabel}</span>
                <span className="text-xs font-semibold text-black/35 dark:text-white/30 uppercase tracking-wider">LifePulse Score</span>
              </div>

              {/* Insight */}
              <p className="text-sm text-black/60 dark:text-white/55 leading-relaxed max-w-sm mb-3">
                {insight}
              </p>

              <div className="text-[10px] text-black/25 dark:text-white/20">
                Updated {new Date(lastUpdatedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Dimension bars */}
          <div className="relative z-10 mt-5 pt-4 border-t border-black/[0.06] dark:border-white/[0.06]">
            <div className="grid grid-cols-6 gap-3">
              {dimensions.map((d) => (
                <div key={d.label} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold uppercase tracking-wider"
                      style={{ color: `${d.color}99` }}>{d.label}</span>
                    <span className="text-[9px] font-black" style={{ color: d.color }}>{d.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: `${d.color}18` }}>
                    <motion.div className="h-full rounded-full"
                      style={{ background: `linear-gradient(to right, ${d.color}80, ${d.color})` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${d.value}%` }}
                      transition={{ duration: 0.9, delay: 0.3, ease: 'easeOut' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Streak card ── */}
        <div className="relative rounded-3xl overflow-hidden p-6 flex flex-col justify-between"
          style={{
            background: 'linear-gradient(145deg, rgba(255,165,0,0.1) 0%, rgba(255,107,107,0.06) 100%)',
            border: '1px solid rgba(255,165,0,0.2)',
          }}>
          <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full blur-3xl opacity-20"
            style={{ background: '#FFA500' }} />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #FFA500, #FF6B6B)' }}>
                  <Flame size={17} className="text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-black/80 dark:text-white/85">Daily Streak</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: '#FFA500' }}>{getStreakLabel(streak)}</div>
                </div>
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-5">
              <span className="text-6xl font-black leading-none text-black/85 dark:text-white/90">{streak}</span>
              <span className="text-base font-bold text-black/35 dark:text-white/30">days</span>
            </div>

            <StreakDisplay streak={streak} />
          </div>

          <div className="relative z-10 mt-5 pt-4 border-t border-black/[0.06] dark:border-white/[0.06]">
            <div className="text-[10px] font-bold uppercase tracking-widest text-black/35 dark:text-white/30 mb-3">This week</div>
            <WeekHeatmap />
          </div>
        </div>
      </motion.div>

      {/* ══ ROW 2 — Dimension metric cards ══ */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <DimensionCard label="Steps" value={formatNumber(steps)} sub="today"
          icon={<Activity size={17} />} color="#4CAF50"
          trend={steps >= 8000 ? 'up' : steps > 0 ? 'flat' : 'down'}
          to="/physical" sparkValues={stepsSparkline} />
        <DimensionCard label="Sleep" value={sleep > 0 ? `${sleep.toFixed(1)}h` : '—'} sub="last night"
          icon={<Moon size={17} />} color="#6366F1"
          trend={sleep >= 7.5 ? 'up' : sleep > 0 ? 'flat' : 'down'}
          to="/physical" />
        <DimensionCard label="Screen" value={screenMin > 0 ? formatMinutesToHM(screenMin) : '—'} sub="today"
          icon={<MonitorSmartphone size={17} />} color="#00BCD4"
          trend={screenMin <= 120 ? 'up' : screenMin <= 240 ? 'flat' : 'down'}
          to="/digital" sparkValues={screenSparkline} />
        <DimensionCard label="Focus" value={focusMin > 0 ? `${focusMin}m` : '—'} sub="today"
          icon={<Timer size={17} />} color="#FFA500"
          trend={focusMin >= 60 ? 'up' : focusMin > 0 ? 'flat' : 'down'}
          to="/productivity" sparkValues={focusSparkline} />
        <DimensionCard label="Stress" value={`${stressScore}/5`} sub="current"
          icon={<Heart size={17} />}
          color={stressScore <= 2 ? '#4CAF50' : stressScore <= 3 ? '#FFA500' : '#FF6B6B'}
          trend={stressScore <= 2 ? 'up' : stressScore <= 3 ? 'flat' : 'down'}
          to="/mood" />
        <DimensionCard label="Calories" value={todayCalories > 0 ? `${todayCalories}` : '—'} sub="kcal today"
          icon={<Flame size={17} />} color="#FF6B6B"
          trend={todayCalories >= calorieGoal * 0.8 ? 'up' : todayCalories > 0 ? 'flat' : 'down'}
          to="/nutrition" />
      </motion.div>

      {/* ══ ROW 3 — Chart + quick actions ══ */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.2 }}
        className="grid lg:grid-cols-[1fr_280px] gap-4">

        {/* Activity chart */}
        <div className="rounded-3xl p-5"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(0,188,212,0.04) 100%)',
            border: '1px solid rgba(99,102,241,0.12)',
          }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-bold text-black/80 dark:text-white/85">Weekly Activity</div>
              <div className="text-xs text-black/40 dark:text-white/35 mt-0.5">Steps · Screen time · Focus</div>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-semibold">
              {[
                { label: 'Steps', color: '#4CAF50' },
                { label: 'Screen', color: '#00BCD4' },
                { label: 'Focus', color: '#6366F1' },
              ].map(l => (
                <span key={l.label} className="flex items-center gap-1.5"
                  style={{ color: `${l.color}99` }}>
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ActivityAnalyticsChart data={chartData} />
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-3">

          {/* Today's checklist */}
          <div className="rounded-3xl p-4"
            style={{
              background: 'linear-gradient(135deg, rgba(76,175,80,0.07) 0%, rgba(76,175,80,0.03) 100%)',
              border: '1px solid rgba(76,175,80,0.14)',
            }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-xl bg-lp-primary/15 flex items-center justify-center">
                <CheckCircle2 size={14} className="text-lp-primary" />
              </div>
              <span className="text-sm font-bold text-black/75 dark:text-white/75">Today&apos;s checklist</span>
            </div>
            <div className="space-y-1.5">
              {[
                { label: 'Log physical activity', done: steps > 0, to: '/physical' },
                { label: 'Track sleep', done: sleep > 0, to: '/physical' },
                { label: 'Focus session', done: focusMin > 0, to: '/productivity' },
                { label: 'Log mood', done: stressScore !== 3, to: '/mood' },
                { label: 'Eco action', done: ecoActions > 0, to: '/environment' },
                { label: 'Log a meal', done: todayCalories > 0, to: '/nutrition' },
              ].map((item) => (
                <button key={item.label} type="button" onClick={() => navigate(item.to)}
                  className="w-full flex items-center gap-2.5 group py-0.5">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200
                    ${item.done ? 'border-lp-primary bg-lp-primary' : 'border-black/20 dark:border-white/20 group-hover:border-lp-primary/60'}`}>
                    {item.done && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-xs flex-1 text-left transition-colors duration-200
                    ${item.done ? 'text-black/30 dark:text-white/25 line-through' : 'text-black/60 dark:text-white/55 group-hover:text-black/80 dark:group-hover:text-white/80'}`}>
                    {item.label}
                  </span>
                  {!item.done && <ArrowRight size={11} className="text-black/20 dark:text-white/20 group-hover:text-lp-primary transition-colors" />}
                </button>
              ))}
            </div>
          </div>

          {/* Quick access + water */}
          <div className="rounded-3xl p-4"
            style={{
              background: 'linear-gradient(135deg, rgba(0,188,212,0.07) 0%, rgba(99,102,241,0.04) 100%)',
              border: '1px solid rgba(0,188,212,0.12)',
            }}>
            <div className="text-[10px] font-bold uppercase tracking-widest text-black/35 dark:text-white/30 mb-3">
              Quick access
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { label: 'Physical', Icon: Activity, to: '/physical', color: '#4CAF50' },
                { label: 'Digital', Icon: MonitorSmartphone, to: '/digital', color: '#00BCD4' },
                { label: 'Productivity', Icon: BarChart3, to: '/productivity', color: '#6366F1' },
                { label: 'Nutrition', Icon: UtensilsCrossed, to: '/nutrition', color: '#FF6B6B' },
                { label: 'Mood', Icon: Heart, to: '/mood', color: '#FFA500' },
              ].map(({ label, Icon, to, color }) => (
                <button key={to} type="button" onClick={() => navigate(to)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 group"
                  style={{ background: `${color}0D`, border: `1px solid ${color}20` }}>
                  <Icon size={13} style={{ color }} />
                  <span className="text-xs font-semibold" style={{ color: `${color}CC` }}>{label}</span>
                </button>
              ))}
            </div>

            {/* Water ring */}
            <div className="pt-3 border-t border-black/[0.05] dark:border-white/[0.05]">
              <div className="flex items-center gap-3">
                <WaterRing glasses={todayWater} goal={8} onClick={() => navigate('/nutrition')} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-black/60 dark:text-white/55">
                    {todayWater === 0 ? 'Stay hydrated'
                      : todayWater >= 8 ? 'Water goal done!'
                      : `${8 - todayWater} more glass${8 - todayWater === 1 ? '' : 'es'} to go`}
                  </div>
                  <div className="text-[10px] text-black/30 dark:text-white/25 mt-0.5">
                    {todayWater}/{8} glasses today
                  </div>
                  <button type="button" onClick={() => navigate('/nutrition')}
                    className="mt-1.5 text-[10px] font-bold text-blue-500 hover:text-blue-600 transition-colors">
                    Log water →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ══ Empty state ══ */}
      {!hasAnyData && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="rounded-3xl p-5 flex items-center justify-between gap-4"
          style={{
            background: 'linear-gradient(135deg, rgba(76,175,80,0.08) 0%, rgba(76,175,80,0.04) 100%)',
            border: '1px solid rgba(76,175,80,0.2)',
          }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #4CAF50, #00BCD4)' }}>
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-black/80 dark:text-white/80">Start building your score</div>
              <div className="text-xs text-black/45 dark:text-white/40 mt-0.5">Log your first activity to see your LifePulse Score come to life</div>
            </div>
          </div>
          <button type="button" onClick={() => navigate('/physical')}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-white text-xs font-bold rounded-xl transition-all hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #4CAF50, #00BCD4)' }}>
            Get started <ArrowRight size={13} />
          </button>
        </motion.div>
      )}
    </div>
  )
}