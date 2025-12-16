import { Activity, ChevronDown, Flame, HeartPulse, MonitorSmartphone, Search, Timer } from 'lucide-react'
import { useMemo } from 'react'

import Card from '../components/Card'
import ActivityAnalyticsChart from '../components/charts/ActivityAnalyticsChart'
import ProgressRing from '../components/ui/ProgressRing'

import { useAppStore } from '../store/useAppStore'
import { selectDailyInsight, selectLifePulseScore } from '../store/selectors'
import { clamp, formatMinutesToHM, formatNumber } from '../utils/format'
import { getDayKey } from '../utils/date'

function firstName(full: string) {
  return full.trim().split(/\s+/)[0] ?? full
}

export default function Dashboard() {
  const user = useAppStore((s) => s.user)
  const lastUpdatedAt = useAppStore((s) => s.meta.lastUpdatedAt)

  const score = useAppStore(selectLifePulseScore)
  const insight = useAppStore(selectDailyInsight)

  const day = getDayKey()
  const steps = useAppStore((s) => s.physical.weeklySteps.find((x) => x.day === day)?.steps ?? 0)
  const sleep = useAppStore((s) => s.physical.sleepHours.find((x) => x.day === day)?.hours ?? 0)
  const calories = useAppStore((s) => s.physical.weeklyCaloriesKcal.find((x) => x.day === day)?.kcal ?? 0)
  const screenMin = useAppStore((s) => s.digital.weeklyScreenTimeMin.find((x) => x.day === day)?.minutes ?? 0)
  const focusMin = useAppStore((s) => s.productivity.focusMinutesByDay.find((x) => x.day === day)?.minutes ?? 0)
  const stressScore = useAppStore((s) => s.mood.today.stressScore)

  const weeklySteps = useAppStore((s) => s.physical.weeklySteps)
  const weeklyScreen = useAppStore((s) => s.digital.weeklyScreenTimeMin)
  const weeklyFocus = useAppStore((s) => s.productivity.focusMinutesByDay)

  const chartData = useMemo(() => {
    // Merge weekly arrays by day key.
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

  // Simple derived rings to match the "inspo" dashboard widgets.
  const waterBalance = clamp(Math.round((sleep / 8) * 45 + (steps / 8000) * 55), 0, 100)
  const generalHealth = score

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Top controls (search + range selector) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40" size={18} />
          <input
            className={
              'w-full rounded-2xl bg-white/90 dark:bg-slate-950/70 backdrop-blur shadow-card ' +
              'border border-black/10 dark:border-white/10 pl-10 pr-3 py-3 text-sm outline-none ' +
              'transition-shadow duration-200 ease-out focus:ring-2 focus:ring-lp-accent/40 focus:shadow-[0_18px_40px_rgba(15,23,42,0.10)]'
            }
            placeholder="Search"
          />
        </div>

        <button
          type="button"
          className={
            'inline-flex items-center justify-center gap-2 rounded-2xl bg-white/90 dark:bg-slate-950/70 backdrop-blur shadow-card ' +
            'border border-black/10 dark:border-white/10 px-4 py-3 text-sm font-semibold text-black/70 dark:text-white/80 ' +
            'transition-transform duration-200 ease-out hover:-translate-y-px hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)] active:translate-y-0'
          }
        >
          This week
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Greeting / hero */}
      <Card
        className={
          'relative overflow-hidden p-5 md:p-6 ' +
          // very subtle gradient in light mode only (do not alter dark mode behavior)
          "before:content-[''] before:absolute before:inset-0 before:pointer-events-none " +
          'before:bg-gradient-to-br before:from-lp-accent/10 before:via-transparent before:to-lp-primary/10 before:opacity-70 ' +
          'dark:before:opacity-0'
        }
      >
        <div className="relative flex items-center justify-between gap-6">
          <div className="min-w-0">
            <div className="text-sm text-black/55 dark:text-white/55">
              Hello, <span className="font-semibold text-lp-accent">{firstName(user.name)}</span>
            </div>
            <div className="mt-2 text-2xl md:text-3xl font-bold text-lp-secondary dark:text-white leading-snug">
              {insight}
            </div>
            <div className="mt-2 text-xs text-black/45 dark:text-white/50">
              Updated {new Date(lastUpdatedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
            </div>
          </div>

          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute -inset-6 rounded-full bg-lp-accent/15 blur-2xl opacity-60 dark:opacity-0" />
              <div className="h-24 w-24 rounded-full bg-lp-accent/15 border border-lp-accent/20 flex items-center justify-center shadow-[0_14px_40px_rgba(0,188,212,0.18)] dark:shadow-none animate-softPulse">
                <HeartPulse className="text-lp-accent" size={36} />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Metric cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-black/45 dark:text-white/55">Steps</div>
              <div className="mt-1 text-xl font-extrabold text-lp-secondary dark:text-white tracking-tight">
                {formatNumber(steps)}
              </div>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-lp-primary/15 border border-lp-primary/20 flex items-center justify-center shadow-[0_10px_30px_rgba(76,175,80,0.14)] dark:shadow-none">
              <Activity className="text-lp-primary" size={18} />
            </div>
          </div>
        </Card>

        <Card className="p-4 transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-black/45 dark:text-white/55">Sleep</div>
              <div className="mt-1 text-xl font-extrabold text-lp-secondary dark:text-white tracking-tight">
                {sleep.toFixed(1)}h
              </div>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-lp-secondary/10 border border-lp-secondary/20 flex items-center justify-center shadow-[0_10px_30px_rgba(30,58,138,0.10)] dark:shadow-none">
              <Timer className="text-lp-secondary dark:text-white" size={18} />
            </div>
          </div>
        </Card>

        <Card className="p-4 transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-black/45 dark:text-white/55">Screen time</div>
              <div className="mt-1 text-xl font-extrabold text-lp-secondary dark:text-white tracking-tight">
                {formatMinutesToHM(screenMin)}
              </div>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-lp-accent/15 border border-lp-accent/20 flex items-center justify-center shadow-[0_10px_30px_rgba(0,188,212,0.16)] dark:shadow-none">
              <MonitorSmartphone className="text-lp-accent" size={18} />
            </div>
          </div>
        </Card>

        <Card className="p-4 transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-black/45 dark:text-white/55">Stress</div>
              <div className="mt-1 text-xl font-extrabold text-lp-secondary dark:text-white tracking-tight">
                {stressScore}/5
              </div>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-lp-alert/15 border border-lp-alert/20 flex items-center justify-center shadow-[0_10px_30px_rgba(255,107,107,0.14)] dark:shadow-none">
              <Flame className="text-lp-alert" size={18} />
            </div>
          </div>
        </Card>
      </div>

      {/* Lower grid: rings + analytics */}
      <div className="grid lg:grid-cols-[340px_minmax(0,1fr)] gap-4">
        <div className="space-y-4">
          <Card className="p-4">
            <ProgressRing value={waterBalance} label="Water balance" color="#00BCD4" />
          </Card>
          <Card className="p-4">
            <ProgressRing value={generalHealth} label="General health" color="#4CAF50" />
          </Card>
        </div>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-black/85 dark:text-white/90">Activity Analytics</div>
              <div className="text-xs text-black/45 dark:text-white/55 mt-0.5">Steps • Screen time • Focus</div>
            </div>
            <button
              type="button"
              className={
                'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ' +
                'text-black/60 dark:text-white/70 border border-black/10 dark:border-white/10 ' +
                'hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-200'
              }
            >
              Week
              <ChevronDown size={14} />
            </button>
          </div>

          <div className="mt-4 h-72">
            <ActivityAnalyticsChart data={chartData} />
          </div>
        </Card>
      </div>

      {/* Small note to keep the dashboard feeling airy like the inspo */}
      <div className="text-xs text-black/45 dark:text-white/45">
        Tip: use the left rail to navigate; details live in the Physical/Digital/Productivity/Environment/Mood pages.
      </div>
    </div>
  )
}
