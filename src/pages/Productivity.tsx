import { Pause, Play, Square, Plus, Timer, BarChart3, Target, TrendingUp, Zap, Award } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

import FocusMinutesBarChart from '../components/charts/FocusMinutesBarChart'
import StudySessionsBarChart from '../components/charts/StudySessionsBarChart'
import Input from '../components/ui/Input'

import { useInterval } from '../hooks/useInterval'
import { useAppStore } from '../store/useAppStore'
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
  const prodScore = Math.min(Math.round((focusMin / 120) * 100), 100)
  const needed = Math.max(0, 120 - focusMin)
  const gain = Math.min(Math.round((needed / 120) * 22), 12)

  return (
    <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #6366F10A 0%, #6366F105 100%)`, border: `1px solid #6366F120` }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-[#6366F1]/15 flex items-center justify-center">
          <Target size={14} className="text-[#6366F1]" />
        </div>
        <span className="text-sm font-semibold text-black/70 dark:text-white/70">Score Impact</span>
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-black text-black/85 dark:text-white/90">{prodScore}</span>
        <span className="text-xs text-black/35 dark:text-white/30">/ 100 productivity score</span>
      </div>
      {prodScore >= 100 ? (
        <p className="text-xs text-lp-primary font-semibold mt-2">Productivity goal reached today!</p>
      ) : (
        <p className="text-xs text-black/50 dark:text-white/45 leading-relaxed mt-2">
          {needed > 0
            ? `${needed} more minutes of focus today could add up to `
            : 'Keep going — '
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
  const totalFocus = focusByDay.reduce((s, x) => s + x.minutes, 0)
  const totalSessions = studyByDay.reduce((s, x) => s + x.sessions, 0)
  const activeDays = focusByDay.filter(x => x.minutes > 0).length
  const bestDay = [...focusByDay].sort((a, b) => b.minutes - a.minutes)[0]

  return (
    <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #6366F10A 0%, #6366F105 100%)`, border: `1px solid #6366F120` }}>
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
            <span className="text-sm font-bold text-[#6366F1]">{bestDay.day} — {bestDay.minutes}m</span>
          </div>
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-black/[0.05] dark:border-white/[0.05]">
        <div className="flex items-end gap-1 h-10">
          {focusByDay.map((x) => {
            const h = Math.max(3, Math.round((x.minutes / 120) * 40))
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
function ProductivityTipCard({ focusMin }: { focusMin: number }) {
  const tips = [
    { condition: focusMin === 0, text: 'Start with a short 25-minute session. Even one focused block a day adds up significantly over a week.' },
    { condition: focusMin > 0 && focusMin < 60, text: 'Good start. Try to reach 2 hours of focused work today for a meaningful productivity score boost.' },
    { condition: focusMin >= 60 && focusMin < 120, text: 'Solid progress. One more focused session would push your productivity score above 80.' },
    { condition: focusMin >= 120, text: 'Excellent focus today. Consider taking a proper break — sustained focus works best with recovery time.' },
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
export default function Productivity() {
  const productivity = useAppStore((s) => s.productivity)
  const focusMode = useAppStore((s) => s.digital.focusMode)
  const startFocusTimer = useAppStore((s) => s.startFocusTimer)
  const pauseFocusTimer = useAppStore((s) => s.pauseFocusTimer)
  const resumeFocusTimer = useAppStore((s) => s.resumeFocusTimer)
  const tickFocusTimer = useAppStore((s) => s.tickFocusTimer)
  const endFocusTimer = useAppStore((s) => s.endFocusTimer)
  const addStudySession = useAppStore((s) => s.addStudySession)

  const [durationMin, setDurationMin] = useState(25)
  const [label, setLabel] = useState('Deep work')

  const day = getDayKey()
  const todayFocus = useAppStore(
    (s) => s.productivity.focusMinutesByDay.find((x) => x.day === day)?.minutes ?? 0,
  )
  const todaySessions = useAppStore(
    (s) => s.productivity.studySessionsByDay.find((x) => x.day === day)?.sessions ?? 0,
  )

  useInterval(
    () => tickFocusTimer(),
    productivity.focusTimer.status === 'running' ? 1000 : null,
  )

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
    if (todayFocus === 0) return 'No focus sessions logged yet — start a session to build your productivity score.'
    if (todayFocus >= 120) return `${todayFocus} minutes of focused work today — excellent productivity.`
    if (todayFocus >= 60) return `${todayFocus} minutes of focus today. One more session would push you above the daily goal.`
    return `${todayFocus} minutes logged. ${120 - todayFocus} more minutes to hit your 2-hour daily goal.`
  }, [todayFocus])

  const { status } = productivity.focusTimer

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-black/85 dark:text-white/90">Productivity</h1>
          <p className="text-sm text-black/45 dark:text-white/40 mt-0.5 max-w-lg">{headline}</p>
        </div>
        <button
          type="button"
          onClick={() => { addStudySession(); toast.success('Study session added') }}
          className="flex items-center gap-2 px-4 py-2.5 bg-black/[0.05] dark:bg-white/[0.06] text-black/60 dark:text-white/55 text-sm font-semibold rounded-xl hover:bg-black/[0.09] dark:hover:bg-white/[0.10] transition-all duration-200 flex-shrink-0"
        >
          <Plus size={15} />
          Add study session
        </button>
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-[1fr_280px] gap-5">

        {/* Left — main content */}
        <div className="space-y-5 min-w-0">

          {/* Today's stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #6366F10A 0%, #6366F105 100%)`, border: `1px solid #6366F120` }}>
              <div className="w-9 h-9 rounded-xl bg-[#6366F1]/15 flex items-center justify-center mb-3">
                <Timer size={17} className="text-[#6366F1]" />
              </div>
              <div className="text-[10px] font-bold text-black/35 dark:text-white/30 uppercase tracking-wider">Focus today</div>
              <div className="mt-1 text-2xl font-black text-black/85 dark:text-white/90 leading-none">
                {todayFocus >= 60 ? `${Math.floor(todayFocus / 60)}h ${todayFocus % 60}m` : `${todayFocus}m`}
              </div>
              <div className="mt-1 text-xs text-black/45 dark:text-white/40">
                {todayFocus >= 120 ? 'Daily goal reached' : `${120 - todayFocus}m to 2hr goal`}
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-black/40 dark:text-white/35">Goal progress</span>
                  <span className="font-semibold text-[#6366F1]">{Math.min(Math.round((todayFocus / 120) * 100), 100)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.06] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-[#6366F1]"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((todayFocus / 120) * 100, 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #6366F10A 0%, #6366F105 100%)`, border: `1px solid #6366F120` }}>
              <div className="w-9 h-9 rounded-xl bg-lp-primary/15 flex items-center justify-center mb-3">
                <BarChart3 size={17} className="text-lp-primary" />
              </div>
              <div className="text-[10px] font-bold text-black/35 dark:text-white/30 uppercase tracking-wider">Study sessions</div>
              <div className="mt-1 text-2xl font-black text-black/85 dark:text-white/90 leading-none">{todaySessions}</div>
              <div className="mt-1 text-xs text-black/45 dark:text-white/40">
                {todaySessions === 0 ? 'None logged today' : todaySessions === 1 ? '1 session today' : `${todaySessions} sessions today`}
              </div>
              {focusMode && (
                <div className="mt-3 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-lp-primary" />
                  <span className="text-[10px] font-semibold text-lp-primary">Focus Mode active</span>
                </div>
              )}
            </div>
          </div>

          {/* Focus timer */}
          <div className="rounded-3xl p-6" style={{ background: `linear-gradient(135deg, #6366F10A 0%, #6366F105 100%)`, border: `1px solid #6366F120` }}>
            <div className="text-sm font-semibold text-black/80 dark:text-white/85 mb-1">Focus Timer</div>
            <div className="text-xs text-black/40 dark:text-white/35 mb-6">
              {status === 'idle'
                ? 'Set a label and duration, then start your session'
                : status === 'running'
                ? 'Session in progress — stay focused'
                : status === 'paused'
                ? 'Session paused — resume when ready'
                : 'Session complete'}
            </div>

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

            {/* Label + duration — only when idle */}
            {status === 'idle' && (
              <div className="mt-6 grid md:grid-cols-2 gap-4">
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
                  <div className="flex gap-2">
                    {[25, 45, 60, 90].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setDurationMin(m)}
                        className={clsx(
                          'flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-150',
                          durationMin === m
                            ? 'bg-[#6366F1] text-white shadow-sm'
                            : 'bg-black/[0.04] dark:bg-white/[0.05] text-black/55 dark:text-white/50 hover:bg-black/[0.08] dark:hover:bg-white/[0.09]',
                        )}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="mt-6 flex justify-center gap-3">
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
                    onClick={() => { endFocusTimer('manual'); toast.success('Session saved') }}
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
                    onClick={() => { endFocusTimer('manual'); toast.success('Session saved') }}
                    className="flex items-center gap-2 px-6 py-3 bg-lp-alert/15 text-lp-alert font-semibold rounded-xl border border-lp-alert/25 hover:bg-lp-alert/25 transition-all duration-200"
                  >
                    <Square size={18} />
                    End
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Recent sessions list */}
          <div className="rounded-3xl p-5" style={{ background: `linear-gradient(135deg, #6366F10A 0%, #6366F105 100%)`, border: `1px solid #6366F120` }}>
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
                      className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors duration-150"
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

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #6366F10A 0%, #6366F105 100%)`, border: `1px solid #6366F120` }}>
              <div className="text-sm font-semibold text-black/80 dark:text-white/85">Focus minutes</div>
              <div className="text-xs text-black/40 dark:text-white/35 mt-0.5 mb-3">Weekly total per day</div>
              <div className="h-44">
                <FocusMinutesBarChart data={productivity.focusMinutesByDay} />
              </div>
            </div>
            <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #6366F10A 0%, #6366F105 100%)`, border: `1px solid #6366F120` }}>
              <div className="text-sm font-semibold text-black/80 dark:text-white/85">Study sessions</div>
              <div className="text-xs text-black/40 dark:text-white/35 mt-0.5 mb-3">Sessions per day</div>
              <div className="h-44">
                <StudySessionsBarChart data={productivity.studySessionsByDay} />
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <ScoreImpactCard focusMin={todayFocus} />
          <WeeklySummaryCard
            focusByDay={productivity.focusMinutesByDay}
            studyByDay={productivity.studySessionsByDay}
          />
          <ProductivityTipCard focusMin={todayFocus} />
          {todayFocus >= 120 && (
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
                <div className="text-xs text-black/45 dark:text-white/40 mt-0.5">2 hours of focus today</div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}