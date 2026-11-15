import {
  Activity, MonitorSmartphone, Timer, Heart, Moon, Flame,
  ArrowRight, Check, UtensilsCrossed, Droplets, Leaf, Sparkles,
} from 'lucide-react'
import { useMemo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import clsx from 'clsx'

import ActivityAnalyticsChart from '../components/charts/ActivityAnalyticsChart'
import HabitWeekDots from '../components/visuals/WeekDots'
import SeeDetails from '../components/visuals/SeeDetails'
import { weekSentence } from '../lib/weekStory'
import { useAppStore } from '../store/useAppStore'
import { selectDailyInsight, selectLifePulseScore, selectProgressiveGoals, selectRollingScores, selectScoreReady, selectStreak } from '../store/selectors'
import { formatMinutesToHM, formatNumber } from '../utils/format'
import { getDayKey } from '../utils/date'
import { apiGet } from '../api/client'
import AssessmentReminder from '../components/AssessmentReminder'
import CyclePhaseCard from '../components/CyclePhaseCard'
import TopInsightCard from '../components/TopInsightCard'
import ExperimentCheckCard from '../components/ExperimentCheckCard'
import TodayOutlookCard from '../components/TodayOutlookCard'
import { useMoodModel } from '../components/WhatHelpsYou'

// ---------------------------------------------------------------------------
// The dashboard is a calm "Today" page in the landing page's style: white
// cards, one green accent, a serif headline, and progress shown as
// "x of your goal" rather than red "Low" badges. Each number appears once.
// ---------------------------------------------------------------------------

const ACCENT = '#3D9A41' // --lp-accent on the landing page
const WATER_GOAL = 8
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

/** Shared card look: white, soft shadow, hairline border — like the landing page. */
const card = 'lp-card rounded-3xl'

/** "1h", "1h 30m", "45m" — drops the "0m" the shared formatter keeps. */
function hm(minutes: number) {
  const t = formatMinutesToHM(Math.round(minutes))
  return t.endsWith(' 0m') ? t.slice(0, -3) : t
}

function firstName(full: string) {
  return full.trim().split(/\s+/)[0] ?? full
}

/** Kind words for the score — encouraging at every level. */
function scoreWords(score: number, ready: boolean) {
  if (!ready) return 'getting started'
  if (score >= 80) return 'thriving'
  if (score >= 60) return 'doing well'
  if (score >= 40) return 'finding your rhythm'
  return 'building momentum'
}

function moodWord(stress: number) {
  return ['Very calm', 'Calm', 'Okay', 'A bit tense', 'Stressed'][Math.min(Math.max(stress, 1), 5) - 1]
}

// ---------------------------------------------------------------------------
// Score ring — one calm green, counts up once
// ---------------------------------------------------------------------------
function ScoreRing({ score, ready }: { score: number; ready: boolean }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const [shown, setShown] = useState(0)

  useEffect(() => {
    let start: number | null = null
    let raf = 0
    const step = (ts: number) => {
      if (start === null) start = ts
      const p = Math.min((ts - start) / 900, 1)
      setShown(Math.round(score * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [score])

  return (
    <div className="relative w-[136px] h-[136px] max-sm:w-[112px] max-sm:h-[112px] flex-shrink-0">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="9"
          className="stroke-[#E8F5E9] dark:stroke-white/[0.07]" />
        {ready && (
          <circle cx="60" cy="60" r={r} fill="none" stroke={ACCENT} strokeWidth="9"
            strokeLinecap="round" strokeDasharray={circ}
            strokeDashoffset={circ * (1 - shown / 100)} />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[34px] max-sm:text-[28px] font-bold leading-none text-black/85 dark:text-white/90 tabular-nums">
          {ready ? shown : '–'}
        </span>
        <span className="text-[11px] text-black/40 dark:text-white/40 mt-1">of 100</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// This week — seven quiet dots, filled on active days
// ---------------------------------------------------------------------------
function WeekDots() {
  const weeklySteps = useAppStore((s) => s.physical.weeklySteps)
  const weeklyFocus = useAppStore((s) => s.productivity.focusMinutesByDay)
  const goals = useAppStore(selectProgressiveGoals)
  const today = getDayKey()
  const todayIdx = DAYS.indexOf(today)

  return (
    <div className="flex items-center gap-2" aria-label="Activity this week">
      {DAYS.map((day, i) => {
        const steps = weeklySteps.find((x) => x.day === day)?.steps ?? 0
        const focus = weeklyFocus.find((x) => x.day === day)?.minutes ?? 0
        const level = (Math.min(steps / goals.goalStepsPerDay, 1) + Math.min(focus / goals.goalFocusMinutes, 1)) / 2
        const future = i > todayIdx
        return (
          <div key={day} className="flex flex-col items-center gap-1">
            <div
              className={clsx('w-3 h-3 rounded-full', day === today && 'ring-2 ring-offset-2 ring-[#3D9A41]/40 ring-offset-white dark:ring-offset-transparent')}
              style={{ background: future ? 'transparent' : level > 0 ? `rgba(61,154,65,${0.25 + level * 0.75})` : 'rgba(0,0,0,0.08)', border: future ? '1px dashed rgba(0,0,0,0.12)' : undefined }}
              title={future ? day : `${day}: ${Math.round(level * 100)}% of your step and focus goals`}
            />
            <span className={clsx('text-[10px]', day === today ? 'font-semibold text-[#3D9A41]' : 'text-black/30 dark:text-white/30')}>
              {day.slice(0, 1)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// One tile in "Your day": icon, value, and progress toward the goal
// ---------------------------------------------------------------------------
function DayTile({ label, value, note, progress, icon: Icon, tint, onClick, delay }: {
  label: string
  value: string
  note: string
  progress: number | null // 0..1, or null when a bar doesn't fit (mood)
  icon: typeof Activity
  tint: string
  onClick: () => void
  delay: number
}) {
  return (
    <motion.button type="button" onClick={onClick}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay }}
      className={clsx(card, 'w-full text-left p-4 max-sm:p-3.5 group hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(16,24,40,0.07)] transition-all duration-200')}>
      <div className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${tint}1A`, color: tint }}>
          <Icon size={14} />
        </span>
        <span className="text-[13px] text-black/55 dark:text-white/55">{label}</span>
      </div>
      <div className="mt-3 text-[22px] max-sm:text-xl font-semibold text-black/85 dark:text-white/90 leading-none tabular-nums">{value}</div>
      <div className="mt-1.5 text-xs text-black/40 dark:text-white/40 truncate">{note}</div>
      {progress !== null && (
        <div className="mt-3 h-1 rounded-full bg-black/[0.05] dark:bg-white/[0.07] overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ background: ACCENT }}
            initial={{ width: 0 }} animate={{ width: `${Math.round(Math.min(progress, 1) * 100)}%` }}
            transition={{ duration: 0.8, delay: delay + 0.15, ease: 'easeOut' }} />
        </div>
      )}
    </motion.button>
  )
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export default function Dashboard() {
  const navigate = useNavigate()
  const user = useAppStore((s) => s.user)
  const score = useAppStore(selectLifePulseScore)
  const insight = useAppStore(selectDailyInsight)
  const dimensionScores = useAppStore(selectRollingScores)
  const scoreReady = useAppStore(selectScoreReady)
  const goals = useAppStore(selectProgressiveGoals)
  const streak = useAppStore(selectStreak)
  const moodModel = useMoodModel()

  const day = getDayKey()
  const steps = useAppStore((s) => s.physical.weeklySteps.find((x) => x.day === day)?.steps ?? 0)
  const sleep = useAppStore((s) => s.physical.sleepHours.find((x) => x.day === day)?.hours ?? 0)
  const screenMin = useAppStore((s) => s.digital.weeklyScreenTimeMin.find((x) => x.day === day)?.minutes ?? 0)
  const focusMin = useAppStore((s) => s.productivity.focusMinutesByDay.find((x) => x.day === day)?.minutes ?? 0)
  const stressScore = useAppStore((s) => s.mood.today.stressScore)
  const [todayCalories, setTodayCalories] = useState(0)
  const [todayWater, setTodayWater] = useState(0)

  useEffect(() => {
    apiGet<{ success: boolean; data: { totals: { calories: number } } }>('/api/nutrition/today')
      .then((r) => setTodayCalories(Math.round(r.data.totals.calories))).catch(() => null)
    apiGet<{ success: boolean; data: { glasses: number } }>('/api/nutrition/water/today')
      .then((r) => setTodayWater(r.data.glasses)).catch(() => null)
  }, [])

  const ecoActions = useAppStore((s) => s.environment.ecoActions.filter((a) =>
    new Date(a.timestamp).toDateString() === new Date().toDateString()).length)

  const weeklySteps = useAppStore((s) => s.physical.weeklySteps)
  const weeklyScreen = useAppStore((s) => s.digital.weeklyScreenTimeMin)
  const weeklyFocus = useAppStore((s) => s.productivity.focusMinutesByDay)

  const chartData = useMemo(() => {
    const stepsByDay = new Map(weeklySteps.map((x) => [x.day, x.steps]))
    const screenByDay = new Map(weeklyScreen.map((x) => [x.day, x.minutes]))
    const focusByDay = new Map(weeklyFocus.map((x) => [x.day, x.minutes]))
    return DAYS.map((d) => ({
      day: d,
      steps: stepsByDay.get(d) ?? 0,
      screenMin: screenByDay.get(d) ?? 0,
      focusMin: focusByDay.get(d) ?? 0,
    }))
  }, [weeklySteps, weeklyScreen, weeklyFocus])

  const weeklySleep = useAppStore((s) => s.physical.sleepHours)
  // "This week": each habit as seven hearts that fill toward the day's goal
  const weekRows = [
    { label: 'Steps', icon: Activity, color: '#22C55E', goal: goals.goalStepsPerDay, lowerIsBetter: false,
      values: weeklySteps.map((x) => ({ day: x.day, value: x.steps || null })), noun: 'step goal', format: (v: number) => `${formatNumber(v)} steps` },
    { label: 'Sleep', icon: Moon, color: '#6366F1', goal: goals.goalSleepHours, lowerIsBetter: false,
      values: weeklySleep.map((x) => ({ day: x.day, value: x.hours || null })), noun: 'sleep goal', format: (v: number) => `${v.toFixed(1)}h sleep` },
    { label: 'Focus', icon: Timer, color: '#8B5CF6', goal: goals.goalFocusMinutes, lowerIsBetter: false,
      values: weeklyFocus.map((x) => ({ day: x.day, value: x.minutes || null })), noun: 'focus goal', format: (v: number) => `${hm(v)} focus` },
    { label: 'Screen time', icon: MonitorSmartphone, color: '#0EA5E9', goal: goals.goalScreenMinutes, lowerIsBetter: true,
      values: weeklyScreen.map((x) => ({ day: x.day, value: x.minutes || null })), noun: 'screen limit', format: (v: number) => `${hm(v)} on screens` },
  ].map((r) => ({ ...r, sentence: weekSentence({ values: r.values, today: day, goal: r.goal, noun: r.noun, lowerIsBetter: r.lowerIsBetter }) }))

  const hasAnyData = steps > 0 || sleep > 0 || screenMin > 0 || focusMin > 0
  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const moodLogged = stressScore !== 3

  // Today's to-dos, in the order they're most worth doing
  const todos = [
    { label: 'Log a meal', done: todayCalories > 0, to: '/nutrition', icon: UtensilsCrossed },
    { label: 'Check in with your mood', done: moodLogged, to: '/mood', icon: Heart },
    { label: 'Take a walk or log activity', done: steps > 0, to: '/physical', icon: Activity },
    { label: 'Do a focus session', done: focusMin > 0, to: '/productivity', icon: Timer },
    { label: 'Log last night’s sleep', done: sleep > 0, to: '/physical', icon: Moon },
    { label: 'One eco-friendly choice', done: ecoActions > 0, to: '/environment', icon: Leaf },
    { label: `Drink water · ${todayWater} of ${WATER_GOAL} glasses`, done: todayWater >= WATER_GOAL, to: '/nutrition', icon: Droplets },
  ]
  const doneCount = todos.filter((t) => t.done).length
  const next = hasAnyData ? todos.find((t) => !t.done) : { label: 'Log your first activity', to: '/physical' }

  // Weakest tracked dimension this week — a gentle nudge, not a warning
  const focusArea = useMemo(() => {
    const names: Record<string, string> = { physical: 'movement', digital: 'screen time', productivity: 'focus', mood: 'mood', eco: 'eco habits', nutrition: 'nutrition' }
    const tracked = Object.entries(dimensionScores).filter(([, v]) => v !== null) as Array<[string, number]>
    if (!scoreReady || tracked.length < 2) return null
    return names[tracked.sort((a, b) => a[1] - b[1])[0][0]] ?? null
  }, [dimensionScores, scoreReady])

  return (
    <div className="space-y-5 max-sm:space-y-4">

      {/* Weekly check-in — a slim reminder, only when one is due */}
      <AssessmentReminder />

      {/* ══ Hero: greeting, score, one next step ══ */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
        className={clsx(card, 'relative overflow-hidden p-7 max-sm:p-5')}>
        <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#E8F5E9] dark:bg-[#3D9A41]/10 blur-2xl opacity-70" />

        <div className="relative flex items-center gap-8 max-md:flex-col-reverse max-md:items-start max-md:gap-5">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-black/45 dark:text-white/45">Good {timeOfDay}, {firstName(user.name)}</p>
            <h1 className="font-serif font-normal text-black/85 dark:text-white/90 leading-[1.1] tracking-tight mt-1.5"
              style={{ fontSize: 'clamp(1.9rem, 3.4vw, 2.75rem)' }}>
              You’re <em className="italic" style={{ color: ACCENT }}>{scoreWords(score, scoreReady)}</em>
              {scoreReady ? ' this week.' : '.'}
            </h1>
            <p className="mt-3 text-[15px] max-sm:text-sm text-black/55 dark:text-white/55 leading-relaxed max-w-xl">
              {hasAnyData ? insight : 'Log anything today, like a meal, a walk or how you feel, and your LifePulse Score will start to grow.'}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {next ? (
                <button type="button" onClick={() => navigate(next.to)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-[#2E7D32] hover:bg-[#276b2b] transition-colors">
                  {next.label} <ArrowRight size={15} />
                </button>
              ) : (
                <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-[#2E7D32] bg-[#E8F5E9] dark:bg-[#3D9A41]/15 dark:text-[#6FCF73]">
                  <Sparkles size={15} /> Everything’s done for today
                </span>
              )}
              <button type="button" onClick={() => navigate('/insights')}
                className="text-sm font-medium text-black/55 dark:text-white/55 hover:text-black/80 dark:hover:text-white/85 transition-colors">
                See your insights
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6 max-md:gap-5">
            <ScoreRing score={score} ready={scoreReady} />
            <div className="space-y-3">
              <div>
                <div className="text-[13px] font-medium text-black/70 dark:text-white/75">LifePulse Score</div>
                <div className="text-xs text-black/40 dark:text-white/40" title="Your last 7 days, today counting most. It doesn't reset at midnight.">Last 7 days</div>
              </div>
              <div className="flex items-center gap-1.5 text-[13px] text-black/60 dark:text-white/60">
                <Flame size={14} className="text-[#F59E0B]" />
                {streak > 0 ? <span><b className="font-semibold text-black/80 dark:text-white/85">{streak}-day</b> streak</span> : 'Start a streak today'}
              </div>
              <WeekDots />
            </div>
          </div>
        </div>
      </motion.section>

      {/* Today's mood outlook from the nightly model — only when there is one */}
      <TodayOutlookCard model={moodModel} />

      {/* Running experiment and the top insight — each shows only when it has something to say */}
      <ExperimentCheckCard />
      <TopInsightCard />

      {/* ══ Your day ══ */}
      <section>
        <div className="flex items-baseline justify-between mb-3 px-1">
          <h2 className="font-serif text-[22px] text-black/85 dark:text-white/90">Your day</h2>
          {focusArea && <span className="text-xs text-black/40 dark:text-white/40 max-sm:hidden">A little extra care for <b className="font-medium text-black/60 dark:text-white/60">{focusArea}</b> this week</span>}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <DayTile label="Steps" icon={Activity} tint="#22C55E" delay={0.05}
            value={formatNumber(steps)} note={`of ${formatNumber(goals.goalStepsPerDay)}`}
            progress={steps / goals.goalStepsPerDay} onClick={() => navigate('/physical')} />
          <DayTile label="Sleep" icon={Moon} tint="#6366F1" delay={0.1}
            value={sleep > 0 ? `${sleep.toFixed(1)}h` : '—'} note={sleep > 0 ? `of ${goals.goalSleepHours}h` : 'Not logged yet'}
            progress={sleep / goals.goalSleepHours} onClick={() => navigate('/physical')} />
          <DayTile label="Meals" icon={UtensilsCrossed} tint="#F97316" delay={0.15}
            value={todayCalories > 0 ? formatNumber(todayCalories) : '—'} note={todayCalories > 0 ? `of ${formatNumber(goals.goalCaloriesPerDay)} kcal` : 'Nothing logged yet'}
            progress={todayCalories / goals.goalCaloriesPerDay} onClick={() => navigate('/nutrition')} />
          <DayTile label="Focus" icon={Timer} tint="#8B5CF6" delay={0.2}
            value={focusMin > 0 ? hm(focusMin) : '—'} note={`of ${hm(goals.goalFocusMinutes)}`}
            progress={focusMin / goals.goalFocusMinutes} onClick={() => navigate('/productivity')} />
          <DayTile label="Screen time" icon={MonitorSmartphone} tint="#0EA5E9" delay={0.25}
            value={screenMin > 0 ? hm(screenMin) : '—'}
            note={screenMin > 0 ? (screenMin <= goals.goalScreenMinutes ? `Within your ${hm(goals.goalScreenMinutes)}` : `${hm(screenMin - goals.goalScreenMinutes)} over your limit`) : `Limit ${hm(goals.goalScreenMinutes)}`}
            progress={screenMin / goals.goalScreenMinutes} onClick={() => navigate('/digital')} />
          <DayTile label="Mood" icon={Heart} tint="#EC4899" delay={0.3}
            value={moodLogged ? moodWord(stressScore) : '—'} note={moodLogged ? 'Today' : 'How are you feeling?'}
            progress={null} onClick={() => navigate('/mood')} />
        </div>
      </section>

      {/* ══ To do today + this week ══ */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.2 }}
        className="grid lg:grid-cols-[340px_1fr] gap-4">

        <div className="space-y-4">
          {/* Cycle phase — only for users tracking a cycle */}
          <CyclePhaseCard />

          <div className={clsx(card, 'p-5')}>
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="font-serif text-xl text-black/85 dark:text-white/90">To do today</h2>
              <span className="text-xs text-black/40 dark:text-white/40 tabular-nums">{doneCount} of {todos.length}</span>
            </div>
            <ul className="space-y-0.5">
              {todos.map((t) => (
                <li key={t.label}>
                  <button type="button" onClick={() => navigate(t.to)}
                    className="w-full flex items-center gap-3 px-2 py-2 max-sm:py-2.5 -mx-2 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors group">
                    <span className={clsx('w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                      t.done ? 'bg-[#3D9A41] text-white' : 'border-[1.5px] border-black/15 dark:border-white/20 group-hover:border-[#3D9A41]/60')}>
                      {t.done && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span className={clsx('flex-1 text-left text-sm',
                      t.done ? 'text-black/35 dark:text-white/30 line-through decoration-black/20' : 'text-black/70 dark:text-white/70')}>
                      {t.label}
                    </span>
                    {!t.done && <ArrowRight size={14} className="text-black/20 dark:text-white/20 group-hover:text-[#3D9A41] transition-colors" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={clsx(card, 'p-5 flex flex-col')}>
          <h2 className="font-serif text-xl text-black/85 dark:text-white/90">This week</h2>
          <p className="text-sm text-black/55 dark:text-white/55 mt-1 mb-4 leading-relaxed">
            {weekRows.map((r) => r.sentence).find(Boolean) ?? 'Log a walk, your sleep or a focus session and your week will fill in here.'}
          </p>
          <div className="space-y-3">
            {weekRows.map((r) => (
              <div key={r.label} className="flex items-center gap-3 max-sm:flex-col max-sm:items-start max-sm:gap-1.5">
                <div className="w-28 flex items-center gap-2 flex-shrink-0">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `${r.color}1A`, color: r.color }}>
                    <r.icon size={13} />
                  </span>
                  <span className="text-sm text-black/65 dark:text-white/65">{r.label}</span>
                </div>
                <HabitWeekDots values={r.values} goal={r.goal} today={day} color={r.color} lowerIsBetter={r.lowerIsBetter} format={r.format} />
              </div>
            ))}
          </div>
          <SeeDetails>
            <div className="flex items-center gap-3 text-xs text-black/45 dark:text-white/45 mb-2">
              {[['Steps', '#4CAF50'], ['Screen', '#00BCD4'], ['Focus', '#6366F1']].map(([label, color]) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} /> {label}
                </span>
              ))}
            </div>
            <div className="h-60 max-sm:h-48">
              <ActivityAnalyticsChart data={chartData} />
            </div>
          </SeeDetails>
        </div>
      </motion.section>
    </div>
  )
}
