import { Pause, Play, Square, Timer, BarChart3, Target, TrendingUp, Zap, Award } from 'lucide-react'
import { useMemo, useState } from 'react'
import { BookOpen, Briefcase } from 'lucide-react'
import RingGauge from '../components/ui/RingGauge'
import PageTabs from '../components/ui/PageTabs'
import { MiniStat, PageHeader } from '../components/ui/PageHeader'
import { HABIT } from '../theme/habits'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

import FocusMinutesBarChart from '../components/charts/FocusMinutesBarChart'
import StudySessionsBarChart from '../components/charts/StudySessionsBarChart'
import Input from '../components/ui/Input'
import FocusTimesGrid from '../components/visuals/FocusTimesGrid'
import { DurationPicker, FocusGoalSheet } from '../components/focus/FocusPickers'
import WeekDots from '../components/visuals/WeekDots'
import SeeDetails from '../components/visuals/SeeDetails'
import { focusGrid, focusSentence } from '../lib/visualStories'

import { useAppStore } from '../store/useAppStore'
import { selectDimensionScores, selectProgressiveGoals } from '../store/selectors'
import { getDayKey } from '../utils/date'

// ---------------------------------------------------------------------------
// Format seconds as MM:SS
// ---------------------------------------------------------------------------
function fmt(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// Circular progress timer
// ---------------------------------------------------------------------------
function CircularTimer({
  remaining, total, status,
}: { remaining: number; total: number; status: string }) {
  const r = 72
  const circ = 2 * Math.PI * r
  const progress = total > 0 ? (total - remaining) / total : 0
  const offset = circ * (1 - progress)

  const color = status === 'running' ? '#4CAF50' : status === 'paused' ? '#FFA500' : '#1E3A8A'

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke="currentColor"
          strokeWidth="8" className="text-black/[0.06] dark:text-white/[0.07]" />
        <circle cx="80" cy="80" r={r} fill="none" stroke={color}
          strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={status === 'idle' ? circ : offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black text-black/85 dark:text-white/90 tabular-nums leading-none">
          {fmt(remaining)}
        </span>
        <span className="text-xs font-semibold text-black/35 dark:text-white/30 mt-1 uppercase tracking-wider">
          {status === 'idle' ? 'Ready' : status === 'running' ? 'Focusing' : status === 'paused' ? 'Paused' : 'Done'}
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Score impact sidebar card
// ---------------------------------------------------------------------------
function ScoreImpactCard({ focusMin }: { focusMin: number }) {
  // Server-calculated productivity score and today's focus goal
  const prodScore = useAppStore((s) => selectDimensionScores(s).productivity)
  const goal = useAppStore((s) => selectProgressiveGoals(s).goalFocusMinutes)
  const needed = Math.max(0, goal - focusMin)
  // Points the overall score would gain by reaching the goal (productivity weighs 20%)
  const gain = Math.round(Math.min(needed / goal, 1) * 100 * 0.2)

  return (
    <div className="rounded-3xl p-4 lp-card">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-[#6366F1]/15 flex items-center justify-center">
          <Target size={14} className="text-[#6366F1]" />
        </div>
        <span className="text-sm font-semibold text-black/70 dark:text-white/70">Score Impact</span>
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-black text-black/85 dark:text-white/90">{prodScore}</span>
        <span className="text-xs text-black/35 dark:text-white/30">/ 100 focus score</span>
      </div>
      {prodScore >= 100 ? (
        <p className="text-xs text-lp-primary font-semibold mt-2">Focus goal reached today.</p>
      ) : (
        <p className="text-xs text-black/50 dark:text-white/45 leading-relaxed mt-2">
          {needed > 0
            ? `${needed} more minutes of focus today could add up to `
            : 'Keep going. '
          }
          <span className="font-bold text-[#6366F1]">+{gain} points</span> to your overall score.
        </p>
      )}
      <div className="mt-3 pt-3 border-t border-black/[0.05] dark:border-white/[0.05]">
        <div className="text-[10px] text-black/30 dark:text-white/25 uppercase tracking-wider mb-2">Productivity contribution</div>
        <div className="h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.06] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[#6366F1]"
            initial={{ width: 0 }}
            animate={{ width: `${prodScore}%` }}
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
function WeeklySummaryCard({ focusByDay, studyByDay }: {
  focusByDay: Array<{ day: string; minutes: number }>
  studyByDay: Array<{ day: string; sessions: number }>
}) {
  const focusGoal = useAppStore((s) => selectProgressiveGoals(s).goalFocusMinutes)
  const totalFocus = focusByDay.reduce((s, x) => s + x.minutes, 0)
  const totalSessions = studyByDay.reduce((s, x) => s + x.sessions, 0)
  const activeDays = focusByDay.filter(x => x.minutes > 0).length
  const bestDay = [...focusByDay].sort((a, b) => b.minutes - a.minutes)[0]

  return (
    <div className="rounded-3xl p-4 lp-card">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-lp-primary/15 flex items-center justify-center">
          <TrendingUp size={14} className="text-lp-primary" />
        </div>
        <span className="text-sm font-semibold text-black/70 dark:text-white/70">This Week</span>
      </div>
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-black/45 dark:text-white/40">Total focus</span>
          <span className="text-sm font-bold text-black/80 dark:text-white/80">
            {totalFocus >= 60 ? `${Math.floor(totalFocus / 60)}h ${totalFocus % 60}m` : `${totalFocus}m`}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-black/45 dark:text-white/40">Study sessions</span>
          <span className="text-sm font-bold text-black/80 dark:text-white/80">{totalSessions}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-black/45 dark:text-white/40">Active days</span>
          <span className="text-sm font-bold text-black/80 dark:text-white/80">{activeDays} / 7</span>
        </div>
        {bestDay && bestDay.minutes > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-black/45 dark:text-white/40">Best day</span>
            <span className="text-sm font-bold text-[#6366F1]">{bestDay.day}: {bestDay.minutes}m</span>
          </div>
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-black/[0.05] dark:border-white/[0.05]">
        <div className="flex items-end gap-1 h-10">
          {focusByDay.map((x) => {
            const h = Math.max(3, Math.round(Math.min(x.minutes / focusGoal, 1) * 40))
            return (
              <div key={x.day} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className="w-full rounded-sm"
                  style={{
                    height: h,
                    backgroundColor: x.minutes >= 60 ? '#6366F1' : x.minutes > 0 ? '#6366F155' : '#0000000A',
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
// Tips sidebar card
// ---------------------------------------------------------------------------
/** 90 → "1h 30m", 120 → "2 hours", 45 → "45 minutes" */
/** "45m", "1h", "1h 30m" for the big numbers */
function shortMin(min: number) {
  if (min < 60) return `${min}m`
  return min % 60 === 0 ? `${min / 60}h` : `${Math.floor(min / 60)}h ${min % 60}m`
}

function fmtGoal(min: number) {
  if (min < 60) return `${min} minutes`
  if (min % 60 === 0) return `${min / 60} hour${min === 60 ? '' : 's'}`
  return `${Math.floor(min / 60)}h ${min % 60}m`
}

function ProductivityTipCard({ focusMin }: { focusMin: number }) {
  const focusGoal = useAppStore((s) => selectProgressiveGoals(s).goalFocusMinutes)
  const tips = [
    { condition: focusMin === 0, text: 'Start with a short 25-minute session. Even one focused block a day adds up significantly over a week.' },
    { condition: focusMin > 0 && focusMin < focusGoal / 2, text: `Good start. Aim for your ${fmtGoal(focusGoal)} of focus today for a meaningful score boost.` },
    { condition: focusMin >= focusGoal / 2 && focusMin < focusGoal, text: `Solid progress. ${focusGoal - focusMin} more minutes reaches your daily focus goal.` },
    { condition: focusMin >= focusGoal, text: 'Excellent focus today. Take a proper break: focus lasts longer with rest in between.' },
  ]
  const tip = tips.find(t => t.condition) ?? tips[0]

  return (
    <div className="bg-[#6366F1]/[0.06] border border-[#6366F1]/20 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-lg bg-[#6366F1]/20 flex items-center justify-center">
          <Zap size={12} className="text-[#6366F1]" />
        </div>
        <span className="text-xs font-bold text-[#6366F1] uppercase tracking-wider">Focus tip</span>
      </div>
      <p className="text-xs text-black/55 dark:text-white/50 leading-relaxed">{tip.text}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Productivity page
// ---------------------------------------------------------------------------
const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'sessions', label: 'Sessions' },
  { key: 'charts', label: 'Charts' },
] as const
type WorkTab = (typeof TABS)[number]['key']

export default function Productivity() {
  const productivity = useAppStore((s) => s.productivity)
  const focusMode = useAppStore((s) => s.digital.focusMode)
  const startFocusTimer = useAppStore((s) => s.startFocusTimer)
  const pauseFocusTimer = useAppStore((s) => s.pauseFocusTimer)
  const resumeFocusTimer = useAppStore((s) => s.resumeFocusTimer)
  const endFocusTimer = useAppStore((s) => s.endFocusTimer)

  const [durationMin, setDurationMin] = useState(25)
  const [tab, setTab] = useState<WorkTab>('overview')
  const [label, setLabel] = useState('Deep work')
  const [goalOpen, setGoalOpen] = useState(false)

  const day = getDayKey()
  const focusTimes = useMemo(() => focusGrid(productivity.focusSessions), [productivity.focusSessions])
  const todayFocus = useAppStore(
    (s) => s.productivity.focusMinutesByDay.find((x) => x.day === day)?.minutes ?? 0,
  )
  const focusGoal = useAppStore((s) => selectProgressiveGoals(s).goalFocusMinutes)
  const todaySessions = useAppStore(
    (s) => s.productivity.studySessionsByDay.find((x) => x.day === day)?.sessions ?? 0,
  )

  // The timer keeps running on every page (FocusTimerTicker in the Layout)

  const endSession = async () => {
    const minutes = Math.round((productivity.focusTimer.durationSec - productivity.focusTimer.remainingSec) / 60)
    try {
      await endFocusTimer('manual')
      toast.success(minutes >= 1 ? 'Session saved' : 'Session ended. Under a minute, so it wasn’t saved')
    } catch {
      toast.error('Could not save the session. Check your connection and try again.')
    }
  }

  const progress = useMemo(() => {
    const { durationSec, remainingSec } = productivity.focusTimer
    if (durationSec <= 0) return 0
    return Math.round(((durationSec - remainingSec) / durationSec) * 100)
  }, [productivity.focusTimer])

  const recentSessions = useMemo(
    () => productivity.focusSessions.slice(0, 5),
    [productivity.focusSessions],
  )

  const headline = useMemo(() => {
    if (todayFocus === 0) return 'No focus sessions yet today. Start one to build your focus score.'
    if (todayFocus >= focusGoal) return `${todayFocus} minutes of focused work today. Excellent.`
    if (todayFocus >= focusGoal * 0.5) return `${todayFocus} minutes of focus today. One more session would push you above your ${focusGoal}-minute goal.`
    return `${todayFocus} minutes logged. ${focusGoal - todayFocus} more minutes to hit your ${focusGoal}-minute daily goal.`
  }, [todayFocus, focusGoal])

  const { status } = productivity.focusTimer

  return (
    <div className="space-y-5">
      <FocusGoalSheet open={goalOpen} onClose={() => setGoalOpen(false)} current={focusGoal} />

      {/* Header */}
      <PageHeader icon={Timer} tint={HABIT.focus.rgb} title="Focus" subtitle={headline} />

      {/* Today: focus minutes as a ring, sessions beside it */}
      <section className="lp-card rounded-3xl p-5 relative overflow-hidden" aria-label="Focus today">
        <div className="pointer-events-none absolute -top-16 -left-16 w-48 h-48 rounded-full blur-3xl" style={{ background: `rgb(${HABIT.focus.rgb} / 0.14)` }} />
        {/* Phones: stacked. Wide screens: the ring and number on the left,
            the stats and buttons on the right, so the row is filled. */}
        <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:items-center lg:gap-8">
          <div className="relative flex items-center gap-5">
            <RingGauge value={todayFocus / focusGoal} color={HABIT.focus.hex} size={112} stroke={10}
              label={`${todayFocus} of ${focusGoal} focus minutes`}>
              <Timer size={28} style={{ color: HABIT.focus.hex }} />
            </RingGauge>
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-semibold text-ui-muted">Focus today</div>
              <div className="text-[28px] font-extrabold text-ui-ink leading-tight tabular-nums">{shortMin(todayFocus)}</div>
              <div className="text-[12px] font-semibold" style={{ color: HABIT.focus.hex }}>
                {todayFocus >= focusGoal ? 'Daily goal reached' : `${fmtGoal(focusGoal - todayFocus)} to your ${fmtGoal(focusGoal)} goal`}
              </div>
              <button type="button" onClick={() => setGoalOpen(true)}
                className="mt-1 text-[12px] font-semibold text-ui-muted underline underline-offset-2 decoration-ui-line/40 hover:text-ui-ink">
                Change goal
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <div className="relative grid grid-cols-2 gap-2.5">
              <MiniStat icon={BookOpen} tint={HABIT.steps.rgb} value={String(todaySessions)} label={todaySessions === 1 ? 'Study session' : 'Study sessions'} />
              <MiniStat icon={Target} tint={HABIT.focus.rgb} value={shortMin(focusGoal)} label={focusMode ? 'Goal · Focus Mode on' : 'Daily goal'} />
            </div>
          </div>
        </div>
      </section>

      {/* Focus timer */}
          <div className="rounded-3xl p-6 lp-card">
            <div className="text-sm font-semibold text-black/80 dark:text-white/85 mb-1">Focus Timer</div>
            <div className="text-xs text-black/40 dark:text-white/35 mb-6">
              {status === 'idle'
                ? 'Set a label and duration, then start your session'
                : status === 'running'
                ? `${productivity.focusTimer.label ?? 'Focus session'} · keeps running if you switch pages`
                : status === 'paused'
                ? `${productivity.focusTimer.label ?? 'Focus session'} · paused, resume when ready`
                : 'Session complete'}
            </div>

            {/* Wide screens: the timer on the left, the controls on the right */}
            <div className="grid lg:grid-cols-2 lg:items-center gap-6">
            <div>
            {/* Circular timer */}
            <CircularTimer
              remaining={productivity.focusTimer.remainingSec}
              total={productivity.focusTimer.durationSec}
              status={status}
            />

            {/* Progress text */}
            {status !== 'idle' && (
              <div className="text-center mt-3 text-xs text-black/40 dark:text-white/35">
                {progress}% complete
              </div>
            )}

            </div>

            <div>
            {/* Label + duration — only when idle */}
            {status === 'idle' && (
              <div className="grid gap-4">
                <div>
                  <div className="text-xs font-semibold text-black/50 dark:text-white/45 uppercase tracking-wider mb-2">Session label</div>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] text-sm text-black/75 dark:text-white/70 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/40 transition-all"
                    placeholder="e.g. Deep work"
                  />
                </div>
                <div>
                  <div className="text-xs font-semibold text-black/50 dark:text-white/45 uppercase tracking-wider mb-2">Duration</div>
                  <DurationPicker value={durationMin} onChange={setDurationMin} />
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="mt-6 flex justify-center lg:justify-start gap-3">
              {status === 'idle' && (
                <button
                  type="button"
                  onClick={() => { startFocusTimer(durationMin, label); toast.success('Focus session started') }}
                  className="flex items-center gap-2 px-8 py-3 bg-[#6366F1] text-white font-semibold rounded-xl hover:bg-indigo-500 hover:shadow-lg hover:shadow-[#6366F1]/25 transition-all duration-200"
                >
                  <Play size={18} />
                  Start Session
                </button>
              )}
              {status === 'running' && (
                <>
                  <button
                    type="button"
                    onClick={() => pauseFocusTimer()}
                    className="flex items-center gap-2 px-6 py-3 bg-black/[0.06] dark:bg-white/[0.08] text-black/70 dark:text-white/70 font-semibold rounded-xl hover:bg-black/[0.10] transition-all duration-200"
                  >
                    <Pause size={18} />
                    Pause
                  </button>
                  <button
                    type="button"
                    onClick={endSession}
                    className="flex items-center gap-2 px-6 py-3 bg-lp-alert/15 text-lp-alert font-semibold rounded-xl border border-lp-alert/25 hover:bg-lp-alert/25 transition-all duration-200"
                  >
                    <Square size={18} />
                    End
                  </button>
                </>
              )}
              {status === 'paused' && (
                <>
                  <button
                    type="button"
                    onClick={() => resumeFocusTimer()}
                    className="flex items-center gap-2 px-6 py-3 bg-[#6366F1] text-white font-semibold rounded-xl hover:bg-indigo-500 transition-all duration-200"
                  >
                    <Play size={18} />
                    Resume
                  </button>
                  <button
                    type="button"
                    onClick={endSession}
                    className="flex items-center gap-2 px-6 py-3 bg-lp-alert/15 text-lp-alert font-semibold rounded-xl border border-lp-alert/25 hover:bg-lp-alert/25 transition-all duration-200"
                  >
                    <Square size={18} />
                    End
                  </button>
                </>
              )}
            </div>
            </div>
            </div>
          </div>

      {todayFocus >= focusGoal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#6366F1]/[0.08] border border-[#6366F1]/20 rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-[#6366F1]/20 flex items-center justify-center flex-shrink-0">
                <Award size={16} className="text-[#6366F1]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-black/75 dark:text-white/75">Focus goal reached</div>
                <div className="text-xs text-black/45 dark:text-white/40 mt-0.5">{fmtGoal(focusGoal)} of focus today</div>
              </div>
            </motion.div>
          )}

      <PageTabs label="Work sections" value={tab} onChange={setTab} tabs={TABS} />

      {tab === 'overview' && (
        <div className="grid lg:grid-cols-[1fr_300px] gap-4">
          <div className="min-w-0 flex flex-col [&>*]:flex-1">
          {/* When you focus best — the charts are one tap away */}
          <div className="rounded-3xl p-5 lp-card">
            <div className="text-xs text-black/40 dark:text-white/40 mb-1">Your best focus times</div>
            <p className="text-[17px] font-bold text-ui-ink leading-snug mb-4">
              {focusSentence(focusTimes) ?? 'Finish a few focus sessions and you’ll see when you focus best.'}
            </p>
            <FocusTimesGrid grid={focusTimes} today={day} />
            <div className="mt-4 flex items-center gap-3 max-sm:flex-col max-sm:items-start">
              <span className="text-sm text-black/60 dark:text-white/60 w-24 flex-shrink-0">Focus goal</span>
              <WeekDots values={productivity.focusMinutesByDay.map((x) => ({ day: x.day, value: x.minutes || null }))}
                goal={focusGoal} today={day} color="#8B5CF6" format={(v) => `${v} min of focus`} />
            </div>
          </div>
          </div>
          <div className="space-y-4">
            <ScoreImpactCard focusMin={todayFocus} />
            <ProductivityTipCard focusMin={todayFocus} />
          </div>
        </div>
      )}

      {tab === 'sessions' && (
        <div className="grid lg:grid-cols-[1fr_300px] gap-4">
          <div className="min-w-0 flex flex-col [&>*]:flex-1">
          {/* Recent sessions list */}
          <div className="rounded-3xl p-5 lp-card">
            <div className="text-sm font-semibold text-black/80 dark:text-white/85 mb-1">Recent focus sessions</div>
            <div className="text-xs text-black/40 dark:text-white/35 mb-4">Your most recent completed sessions</div>

            {recentSessions.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                  <Timer size={20} className="text-black/20 dark:text-white/20" />
                </div>
                <p className="text-sm font-medium text-black/40 dark:text-white/35">No sessions yet</p>
                <p className="text-xs text-black/30 dark:text-white/25 mt-1">Complete a focus session to see it here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentSessions.map((s, i) => {
                  const mins = Math.max(1, Math.round(s.durationSec / 60))
                  return (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-ui-raised"
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#6366F1]/15 flex items-center justify-center flex-shrink-0">
                        <Timer size={14} className="text-[#6366F1]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-black/75 dark:text-white/75 truncate">{s.label}</div>
                        <div className="text-xs text-black/35 dark:text-white/30 mt-0.5">
                          {new Date(s.startedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold text-black/65 dark:text-white/60">{mins}m</div>
                        <div className="text-xs text-black/30 dark:text-white/25">focused</div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          </div>
          <WeeklySummaryCard focusByDay={productivity.focusMinutesByDay} studyByDay={productivity.studySessionsByDay} />
        </div>
      )}

      {tab === 'charts' && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="lp-card rounded-3xl p-5">
            <div className="text-sm font-bold text-ui-ink">Focus minutes</div>
            <div className="text-xs text-ui-muted mt-0.5 mb-3">Weekly total per day</div>
            <div className="h-44"><FocusMinutesBarChart data={productivity.focusMinutesByDay} /></div>
          </div>
          <div className="lp-card rounded-3xl p-5">
            <div className="text-sm font-bold text-ui-ink">Study sessions</div>
            <div className="text-xs text-ui-muted mt-0.5 mb-3">Sessions per day</div>
            <div className="h-44"><StudySessionsBarChart data={productivity.studySessionsByDay} /></div>
          </div>
        </div>
      )}
    </div>
  )
}