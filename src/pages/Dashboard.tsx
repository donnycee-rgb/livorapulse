import {
  Activity, MonitorSmartphone, Timer, Heart, Moon, Flame,
  ArrowRight, Check, UtensilsCrossed, Droplets, Leaf, Sparkles, Plus, ChevronRight,
} from 'lucide-react'
import { useMemo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import clsx from 'clsx'

import ActivityAnalyticsChart from '../components/charts/ActivityAnalyticsChart'
import HabitWeekDots from '../components/visuals/WeekDots'
import SeeDetails from '../components/visuals/SeeDetails'
import RingGauge from '../components/ui/RingGauge'
import StatTile from '../components/ui/StatTile'
import { weekSentence } from '../lib/weekStory'
import { scheduleScoreSync, useAppStore } from '../store/useAppStore'
import { selectDailyInsight, selectLifePulseScore, selectProgressiveGoals, selectScoreReady, selectStreak } from '../store/selectors'
import { formatMinutesToHM, formatNumber } from '../utils/format'
import { getDayKey } from '../utils/date'
import { apiGet } from '../api/client'
import { saveLog } from '../offline/outbox'
import { BRAND, HABIT } from '../theme/habits'
import type { MoodEmoji } from '../data/types'
import { MOOD_ICONS, MOOD_ORDER } from '../lib/moodIcons'
import AssessmentReminder from '../components/AssessmentReminder'
import CyclePhaseCard from '../components/CyclePhaseCard'
import TopInsightCard from '../components/TopInsightCard'
import HealthFlags from '../components/HealthFlags'
import ExperimentCheckCard from '../components/ExperimentCheckCard'
import TodayOutlookCard from '../components/TodayOutlookCard'
import { useMoodModel } from '../components/WhatHelpsYou'

// ---------------------------------------------------------------------------
// Home: a glance at today, built for phones first. The score ring, quick
// check-ins you can do right here (mood, water), one tile per habit, then
// today's to-dos and the week. Short words, more pictures; every card works
// in light and dark.
// ---------------------------------------------------------------------------

const WATER_GOAL = 8
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const card = 'lp-card rounded-3xl'

// Moods are stored as emoji values but always drawn as icons
const MOODS = MOOD_ORDER.map((emoji) => ({ emoji, ...MOOD_ICONS[emoji] }))

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
  if (!ready) return 'Just getting started'
  if (score >= 80) return 'Thriving this week'
  if (score >= 60) return 'Doing well this week'
  if (score >= 40) return 'Finding your rhythm'
  return 'Building momentum'
}

// ---------------------------------------------------------------------------
// Quick check-in: mood with one tap, water with one tap
// ---------------------------------------------------------------------------
function QuickCheckIn({ water, onWater }: { water: number; onWater: () => void }) {
  const day = getDayKey()
  const todayMood = useAppStore((s) => s.mood.moodByDay.find((d) => d.day === day)?.emoji ?? null)
  const setMoodEmoji = useAppStore((s) => s.setMoodEmoji)
  const [busy, setBusy] = useState(false)

  const pick = async (emoji: MoodEmoji, label: string) => {
    if (busy) return
    setBusy(true)
    try {
      await setMoodEmoji(emoji)
      toast.success(`Feeling ${label.toLowerCase()}: noted`)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={clsx(card, 'p-4 sm:p-5')} aria-label="Quick check-in">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-ui-ink">How are you feeling?</h2>
        {todayMood && <span className="text-[11px] font-semibold text-lp-primary">Logged today</span>}
      </div>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {MOODS.map((m) => {
          const active = todayMood === m.emoji
          return (
            <button key={m.emoji} type="button" onClick={() => pick(m.emoji, m.label)} disabled={busy}
              aria-pressed={active} aria-label={m.label}
              className={clsx('flex flex-col items-center gap-1 rounded-2xl py-2.5 transition-all active:scale-95',
                active ? 'bg-lp-primary/15 ring-2 ring-lp-primary lp-glow' : 'bg-ui-raised hover:bg-ui-line/[0.06]')}>
              <m.Icon size={26} strokeWidth={2} style={{ color: active ? m.color : undefined }} className={active ? undefined : 'text-ui-muted'} aria-hidden />
              <span className={clsx('text-[10.5px] font-semibold', active ? 'text-lp-primary' : 'text-ui-muted')}>{m.label}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-ui-raised p-3">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `rgb(${HABIT.water.rgb} / 0.16)`, color: HABIT.water.hex }}>
          <Droplets size={18} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[13px] font-semibold text-ui-ink">Water</span>
            <span className="text-[12px] text-ui-muted tabular-nums">{water} of {WATER_GOAL} glasses</span>
          </div>
          <div className="mt-1.5 flex gap-1" aria-hidden>
            {Array.from({ length: WATER_GOAL }, (_, i) => (
              <span key={i} className="h-1.5 flex-1 rounded-full transition-colors"
                style={{ background: i < water ? HABIT.water.hex : 'rgb(var(--ui-line) / 0.08)' }} />
            ))}
          </div>
        </div>
        <button type="button" onClick={onWater} aria-label="Add a glass of water"
          className={clsx('h-10 px-3 rounded-xl flex items-center gap-1 text-[13px] font-bold flex-shrink-0 active:scale-95 transition-transform',
            water >= WATER_GOAL ? 'bg-ui-line/[0.06] text-ui-muted' : 'bg-lp-btn text-lp-btn-ink')}>
          <Plus size={15} strokeWidth={2.6} /> 1
        </button>
      </div>
    </section>
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
  const scoreReady = useAppStore(selectScoreReady)
  const goals = useAppStore(selectProgressiveGoals)
  const streak = useAppStore(selectStreak)
  const moodModel = useMoodModel()

  const day = getDayKey()
  const steps = useAppStore((s) => s.physical.weeklySteps.find((x) => x.day === day)?.steps ?? 0)
  const sleep = useAppStore((s) => s.physical.sleepHours.find((x) => x.day === day)?.hours ?? 0)
  const screenMin = useAppStore((s) => s.digital.weeklyScreenTimeMin.find((x) => x.day === day)?.minutes ?? 0)
  const focusMin = useAppStore((s) => s.productivity.focusMinutesByDay.find((x) => x.day === day)?.minutes ?? 0)
  const todayMood = useAppStore((s) => s.mood.moodByDay.find((x) => x.day === day)?.emoji ?? null)
  const [todayCalories, setTodayCalories] = useState(0)
  const [todayWater, setTodayWater] = useState(0)

  useEffect(() => {
    apiGet<{ success: boolean; data: { totals: { calories: number } } }>('/api/nutrition/today')
      .then((r) => setTodayCalories(Math.round(r.data.totals.calories))).catch(() => null)
    apiGet<{ success: boolean; data: { glasses: number } }>('/api/nutrition/water/today')
      .then((r) => setTodayWater(r.data.glasses)).catch(() => null)
  }, [])

  const addWater = async () => {
    setTodayWater((g) => g + 1)
    try {
      const result = await saveLog('/api/nutrition/water', { glasses: 1, timestamp: new Date().toISOString() })
      if (result === 'sent') {
        scheduleScoreSync()
        toast.success('Glass of water logged')
      }
    } catch {
      setTodayWater((g) => Math.max(0, g - 1))
      toast.error("Couldn't log water. Please try again.")
    }
  }

  // Distinct green habits ticked today
  const greenToday = useAppStore((s) => new Set(s.environment.ecoActions.filter((a) =>
    a.category === 'HABIT' && new Date(a.timestamp).toDateString() === new Date().toDateString()).map((a) => a.type)).size)
  const ecoActions = useAppStore((s) => s.environment.ecoActions.filter((a) =>
    new Date(a.timestamp).toDateString() === new Date().toDateString()).length)

  const weeklySteps = useAppStore((s) => s.physical.weeklySteps)
  const weeklyScreen = useAppStore((s) => s.digital.weeklyScreenTimeMin)
  const weeklyFocus = useAppStore((s) => s.productivity.focusMinutesByDay)
  const weeklySleep = useAppStore((s) => s.physical.sleepHours)

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

  // "This week": each habit as seven hearts that fill toward the day's goal
  const weekRows = [
    { label: 'Steps', icon: Activity, color: HABIT.steps.hex, goal: goals.goalStepsPerDay, lowerIsBetter: false,
      values: weeklySteps.map((x) => ({ day: x.day, value: x.steps || null })), noun: 'step goal', format: (v: number) => `${formatNumber(v)} steps` },
    { label: 'Sleep', icon: Moon, color: HABIT.sleep.hex, goal: goals.goalSleepHours, lowerIsBetter: false,
      values: weeklySleep.map((x) => ({ day: x.day, value: x.hours || null })), noun: 'sleep goal', format: (v: number) => `${v.toFixed(1)}h sleep` },
    { label: 'Focus', icon: Timer, color: HABIT.focus.hex, goal: goals.goalFocusMinutes, lowerIsBetter: false,
      values: weeklyFocus.map((x) => ({ day: x.day, value: x.minutes || null })), noun: 'focus goal', format: (v: number) => `${hm(v)} focus` },
    { label: 'Screen', icon: MonitorSmartphone, color: HABIT.screen.hex, goal: goals.goalScreenMinutes, lowerIsBetter: true,
      values: weeklyScreen.map((x) => ({ day: x.day, value: x.minutes || null })), noun: 'screen limit', format: (v: number) => `${hm(v)} on screens` },
  ].map((r) => ({ ...r, sentence: weekSentence({ values: r.values, today: day, goal: r.goal, noun: r.noun, lowerIsBetter: r.lowerIsBetter }) }))

  const hasAnyData = steps > 0 || sleep > 0 || screenMin > 0 || focusMin > 0 || todayCalories > 0 || todayMood !== null
  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

  // Today's to-dos, in the order they're most worth doing
  const todos = [
    { label: 'Log a meal', done: todayCalories > 0, to: '/nutrition' },
    { label: 'Check in with your mood', done: todayMood !== null, to: '/mood' },
    { label: 'Take a walk or log activity', done: steps > 0, to: '/physical' },
    { label: 'Do a focus session', done: focusMin > 0, to: '/productivity' },
    { label: 'Log last night’s sleep', done: sleep > 0, to: '/physical' },
    { label: 'Tick a green habit', done: ecoActions > 0, to: '/environment' },
    { label: `Drink water · ${todayWater} of ${WATER_GOAL}`, done: todayWater >= WATER_GOAL, to: '/nutrition' },
  ]
  const doneCount = todos.filter((t) => t.done).length
  const next = hasAnyData ? todos.find((t) => !t.done) : { label: 'Log your first activity', to: '/physical' }

  return (
    <div className="space-y-5 max-sm:space-y-4">

      {/* Weekly check-in — a slim reminder, only when one is due */}
      <AssessmentReminder />

      {/* "Worth getting checked" prompts, if any */}
      <HealthFlags />

      {/* ══ Greeting ══ */}
      <header className="px-0.5">
        <h1 className="text-[26px] max-sm:text-[23px] font-bold tracking-tight text-ui-ink leading-tight">
          Good {timeOfDay}{firstName(user.name ?? '') ? `, ${firstName(user.name ?? '')}` : ''}
        </h1>
        <p className="mt-1 text-[14px] text-ui-muted line-clamp-2">
          {hasAnyData ? insight : 'Log a meal, a walk or how you feel, and your day fills in here.'}
        </p>
      </header>

      {/* ══ Score + quick check-in ══ */}
      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-4">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className={clsx(card, 'relative overflow-hidden p-5')} aria-label="LifePulse Score">
          <div className="pointer-events-none absolute -top-20 -right-16 w-56 h-56 rounded-full bg-lp-primary/10 blur-3xl" />
          <div className="relative flex items-center gap-5">
            <RingGauge value={scoreReady ? score / 100 : null} color={BRAND} size={124} stroke={11}
              label={scoreReady ? `LifePulse Score ${score} of 100` : 'LifePulse Score not ready yet'}>
              <span className="text-[34px] font-extrabold leading-none text-ui-ink tabular-nums">{scoreReady ? score : '–'}</span>
              <span className="text-[11px] text-ui-muted mt-1">of 100</span>
            </RingGauge>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-ui-muted">LifePulse Score</div>
              <div className="mt-1 text-[18px] font-bold text-ui-ink leading-snug">{scoreWords(score, scoreReady)}</div>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-ui-raised px-2.5 py-1 text-[12px] font-semibold text-ui-ink">
                <Flame size={13} className="text-[#F59E0B]" />
                {streak > 0 ? `${streak}-day streak` : 'Start a streak today'}
              </div>
              <div className="mt-1.5 text-[11px] text-ui-muted" title="Your last 7 days, today counting most. It doesn't reset at midnight.">Based on your last 7 days</div>
            </div>
          </div>
          <div className="relative mt-4 flex items-center gap-2">
            {next ? (
              <button type="button" onClick={() => navigate(next.to)}
                className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 h-11 px-4 rounded-2xl text-sm font-bold bg-lp-btn text-lp-btn-ink lp-glow active:scale-[0.98] transition-transform">
                <span className="truncate">{next.label}</span> <ArrowRight size={16} className="flex-shrink-0" />
              </button>
            ) : (
              <span className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-4 rounded-2xl text-sm font-bold text-lp-primary bg-lp-primary/10">
                <Sparkles size={15} /> All done for today
              </span>
            )}
            <button type="button" onClick={() => navigate('/insights')}
              className="h-11 px-4 rounded-2xl text-sm font-semibold text-ui-ink bg-ui-raised hover:bg-ui-line/[0.08] transition-colors flex-shrink-0">
              Insights
            </button>
          </div>
        </motion.section>

        <QuickCheckIn water={todayWater} onWater={addWater} />
      </div>

      {/* Today's mood outlook from the nightly model — only when there is one */}
      <TodayOutlookCard model={moodModel} />

      {/* ══ Today, one tile per habit ══ */}
      <section aria-label="Today">
        <h2 className="text-[17px] font-bold text-ui-ink mb-3 px-0.5">Today</h2>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          <StatTile icon={Activity} label="Steps" tint={HABIT.steps.rgb}
            value={formatNumber(steps)} note={`of ${formatNumber(goals.goalStepsPerDay)}`}
            progress={steps / goals.goalStepsPerDay} onClick={() => navigate('/physical')} />
          <StatTile icon={Moon} label="Sleep" tint={HABIT.sleep.rgb}
            value={sleep > 0 ? `${sleep.toFixed(1)}h` : '—'} note={`of ${goals.goalSleepHours}h`}
            progress={sleep / goals.goalSleepHours} onClick={() => navigate('/physical')} />
          <StatTile icon={UtensilsCrossed} label="Meals" tint={HABIT.meals.rgb}
            value={todayCalories > 0 ? formatNumber(todayCalories) : '—'} note={`of ${formatNumber(goals.goalCaloriesPerDay)} kcal`}
            progress={todayCalories / goals.goalCaloriesPerDay} onClick={() => navigate('/nutrition')} />
          <StatTile icon={Timer} label="Focus" tint={HABIT.focus.rgb}
            value={focusMin > 0 ? hm(focusMin) : '—'} note={`of ${hm(goals.goalFocusMinutes)}`}
            progress={focusMin / goals.goalFocusMinutes} onClick={() => navigate('/productivity')} />
          <StatTile icon={MonitorSmartphone} label="Screen" tint={HABIT.screen.rgb}
            value={screenMin > 0 ? hm(screenMin) : '—'}
            note={screenMin > goals.goalScreenMinutes ? `${hm(screenMin - goals.goalScreenMinutes)} over` : `limit ${hm(goals.goalScreenMinutes)}`}
            progress={screenMin / goals.goalScreenMinutes} onClick={() => navigate('/digital')} />
          <StatTile icon={Heart} label="Mood" tint={HABIT.mood.rgb}
            value={todayMood ? MOOD_ICONS[todayMood].label : '—'} note={todayMood ? 'Today' : 'Not yet'}
            onClick={() => navigate('/mood')} />
        </div>
      </section>

      {/* Green habits: a slim way in (it isn't in the phone's bottom bar) */}
      <button type="button" onClick={() => navigate('/environment')}
        className="w-full lp-card rounded-2xl px-4 py-3 flex items-center gap-3 text-left hover:-translate-y-0.5 transition-transform">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `rgb(${HABIT.eco.rgb} / 0.16)`, color: HABIT.eco.hex }}>
          <Leaf size={17} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[14px] font-semibold text-ui-ink">Green habits</span>
          <span className="block text-[12px] text-ui-muted truncate">
            {greenToday > 0 ? `${greenToday} of ${Math.min(7, goals.goalEcoActionsPerDay)} today` : 'Reusable bag, no charcoal, a walk instead of a ride…'}
          </span>
        </span>
        <ChevronRight size={16} className="text-ui-muted flex-shrink-0" />
      </button>

      {/* Running experiment and the top insight — each shows only when it has something to say */}
      <ExperimentCheckCard />
      <TopInsightCard />

      {/* ══ To do today + this week ══ */}
      <div className="grid lg:grid-cols-[360px_1fr] gap-4">
        <div className="space-y-4">
          {/* Cycle phase — only for users tracking a cycle */}
          <CyclePhaseCard />

          <section className={clsx(card, 'p-5')} aria-label="To do today">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[17px] font-bold text-ui-ink">To do today</h2>
              <span className="text-[12px] font-semibold text-ui-muted tabular-nums rounded-full bg-ui-raised px-2.5 py-1">{doneCount} / {todos.length}</span>
            </div>
            <ul className="space-y-1">
              {todos.map((t) => (
                <li key={t.label}>
                  <button type="button" onClick={() => navigate(t.to)}
                    className="w-full flex items-center gap-3 px-2 py-2.5 -mx-2 rounded-xl hover:bg-ui-raised transition-colors group">
                    <span className={clsx('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                      t.done ? 'bg-lp-primary text-white' : 'border-2 border-ui-line/15 group-hover:border-lp-primary/60')}>
                      {t.done && <Check size={13} strokeWidth={3} />}
                    </span>
                    <span className={clsx('flex-1 text-left text-[14px]',
                      t.done ? 'text-ui-muted line-through decoration-ui-muted/40' : 'text-ui-ink')}>
                      {t.label}
                    </span>
                    {!t.done && <ChevronRight size={16} className="text-ui-muted group-hover:text-lp-primary transition-colors" />}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className={clsx(card, 'p-5 flex flex-col')} aria-label="This week">
          <h2 className="text-[17px] font-bold text-ui-ink">This week</h2>
          <p className="text-[13px] text-ui-muted mt-1 mb-4 leading-relaxed">
            {weekRows.map((r) => r.sentence).find(Boolean) ?? 'Log a walk, your sleep or a focus session and your week fills in here.'}
          </p>
          <div className="space-y-3.5">
            {weekRows.map((r) => (
              <div key={r.label} className="flex items-center gap-3 max-sm:flex-col max-sm:items-start max-sm:gap-1.5">
                <div className="w-24 flex items-center gap-2 flex-shrink-0">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${r.color}24`, color: r.color }}>
                    <r.icon size={14} />
                  </span>
                  <span className="text-[13px] font-semibold text-ui-ink">{r.label}</span>
                </div>
                <HabitWeekDots values={r.values} goal={r.goal} today={day} color={r.color} lowerIsBetter={r.lowerIsBetter} format={r.format} />
              </div>
            ))}
          </div>
          <SeeDetails>
            <div className="h-72 max-sm:h-64">
              <ActivityAnalyticsChart data={chartData}
                goals={{ steps: goals.goalStepsPerDay, focusMin: goals.goalFocusMinutes, screenMin: goals.goalScreenMinutes }} />
            </div>
          </SeeDetails>
        </section>
      </div>
    </div>
  )
}
