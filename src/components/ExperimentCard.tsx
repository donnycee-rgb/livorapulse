import { CheckCircle2, FlaskConical, MinusCircle, TrendingDown, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

import type { Experiment, ExperimentList, ExperimentResult } from '../api/experiments'
import { experimentCheckIn, stopExperiment } from '../api/experiments'
import { addDaysToKey } from '../utils/date'
import { ComparisonBars } from './InsightCard'

// ─── Yes / No answer buttons ────────────────────────────────────────────────

function AnswerButtons({ value, disabled, onAnswer, size = 'md' }: {
  value: boolean | null
  disabled: boolean
  onAnswer: (did: boolean) => void
  size?: 'sm' | 'md'
}) {
  const btn = (did: boolean, label: string) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onAnswer(did)}
      className={clsx(
        'rounded-xl font-semibold transition disabled:opacity-60',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-4 py-2 text-sm',
        value === did
          ? did ? 'bg-lp-primary text-white' : 'bg-black/70 dark:bg-white/80 text-white dark:text-black'
          : 'bg-black/[0.05] dark:bg-white/[0.07] text-black/70 dark:text-white/70 hover:bg-black/[0.09] dark:hover:bg-white/[0.12]',
      )}
    >
      {label}
    </button>
  )
  return (
    <div className="flex items-center gap-2">
      {btn(true, 'Yes')}
      {btn(false, 'No')}
    </div>
  )
}

/** One dot per experiment day: did it, didn't, not answered, today */
function DayDots({ exp }: { exp: Experiment }) {
  const answers = new Map(exp.checkins.map((c) => [c.date, c.did]))
  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Days of the experiment">
      {Array.from({ length: exp.totalDays }, (_, i) => {
        const key = addDaysToKey(exp.startDate, i)
        const did = answers.get(key)
        const isToday = exp.dayNumber === i + 1
        return (
          <span
            key={key}
            title={`Day ${i + 1}${did === true ? ': did it' : did === false ? ': skipped' : ''}`}
            className={clsx(
              'w-4 h-4 rounded-full border',
              did === true && 'bg-lp-primary border-lp-primary',
              did === false && 'bg-black/25 dark:bg-white/25 border-transparent',
              did === undefined && 'border-black/15 dark:border-white/20',
              isToday && 'ring-2 ring-offset-1 ring-[#6366F1] ring-offset-white dark:ring-offset-slate-950',
            )}
          />
        )
      })}
    </div>
  )
}

// ─── Running experiment ─────────────────────────────────────────────────────

type ActiveProps = {
  exp: Experiment
  onChange: (list: ExperimentList) => void
  /** Compact version for the Dashboard: just today's question */
  compact?: boolean
}

export function ActiveExperimentCard({ exp, onChange, compact = false }: ActiveProps) {
  const [busy, setBusy] = useState(false)

  const answer = async (did: boolean, day: 'today' | 'yesterday') => {
    setBusy(true)
    try {
      onChange(await experimentCheckIn(exp.id, did, day))
      if (day === 'today') toast.success(did ? 'Nice — logged for today' : "Logged. Tomorrow's a new day")
    } catch {
      toast.error("Couldn't save your answer. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  const stop = async () => {
    if (!window.confirm('Stop this experiment? It will end without a result.')) return
    setBusy(true)
    try {
      onChange(await stopExperiment(exp.id))
      toast.success('Experiment stopped')
    } catch {
      toast.error("Couldn't stop the experiment. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  const frame = {
    background: 'linear-gradient(135deg, rgba(76,175,80,0.10) 0%, rgba(99,102,241,0.05) 100%)',
    border: '1px solid rgba(76,175,80,0.20)',
  }

  if (exp.waitingForResult) {
    return (
      <div className="rounded-3xl p-5 max-sm:p-4" style={frame}>
        <div className="flex items-center gap-2 text-[10px] font-bold text-black/40 dark:text-white/35 uppercase tracking-wider">
          <FlaskConical size={13} className="text-lp-primary" /> Experiment finished
        </div>
        <div className="mt-2 text-sm font-semibold text-black/80 dark:text-white/85">{exp.change}</div>
        <p className="mt-1 text-sm text-black/55 dark:text-white/50">
          All 14 days are done. Your result will be ready tomorrow, once the last night's data is in.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-3xl p-5 max-sm:p-4" style={frame}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[10px] font-bold text-black/40 dark:text-white/35 uppercase tracking-wider">
          <FlaskConical size={13} className="text-lp-primary" />
          Experiment · day {exp.dayNumber ?? '–'} of {exp.totalDays}
        </div>
        {!compact && (
          <button type="button" onClick={stop} disabled={busy} className="text-xs text-black/40 dark:text-white/35 hover:text-lp-alert transition">
            Stop
          </button>
        )}
      </div>
      <div className="mt-2 text-sm font-semibold text-black/80 dark:text-white/85">{exp.change}</div>

      <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
        <span className="text-sm text-black/65 dark:text-white/60">Did you do it today?</span>
        <AnswerButtons value={exp.today} disabled={busy} onAnswer={(d) => answer(d, 'today')} />
      </div>

      {exp.yesterday === null && exp.dayNumber !== null && exp.dayNumber > 1 && (
        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-xs text-black/45 dark:text-white/40">Missed yesterday's answer? Did you do it?</span>
          <AnswerButtons size="sm" value={null} disabled={busy} onAnswer={(d) => answer(d, 'yesterday')} />
        </div>
      )}

      {!compact && (
        <div className="mt-4">
          <DayDots exp={exp} />
          <p className="mt-3 text-xs text-black/40 dark:text-white/35">
            Keep logging as usual. After day 14 your results are compared with the 14 days before you started.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Finished experiment ────────────────────────────────────────────────────

const VERDICT: Record<ExperimentResult['verdict'], { label: string; color: string; Icon: typeof TrendingUp }> = {
  improved: { label: 'Clear improvement', color: '#4CAF50', Icon: TrendingUp },
  worse: { label: 'Went the other way', color: '#FF8C00', Icon: TrendingDown },
  'no-clear-change': { label: 'No clear change', color: '#64748b', Icon: MinusCircle },
  'not-enough-data': { label: 'Not enough data', color: '#64748b', Icon: MinusCircle },
}

const OUTCOME_LABEL: Record<string, string> = {
  stressScore: 'Stress', moodValue: 'Mood', sleepMinutes: 'Sleep', focusMinutes: 'Focus time', steps: 'Walks',
}

export function PastExperimentCard({ exp }: { exp: Experiment }) {
  if (exp.status === 'stopped' || !exp.result) {
    return (
      <div className="rounded-2xl px-4 py-3 border border-black/[0.08] dark:border-white/[0.08] text-sm text-black/55 dark:text-white/50">
        <span className="font-semibold text-black/70 dark:text-white/70">{exp.change}</span> · stopped early
      </div>
    )
  }

  const r = exp.result
  const v = VERDICT[r.verdict]
  const isScore = r.outcome === 'stressScore' || r.outcome === 'moodValue'
  const display = (stored: number) => (r.outcome === 'stressScore' ? stored / 2 : stored)
  const label = OUTCOME_LABEL[r.outcome] ?? 'Result'
  const hasBars = r.before.mean !== null && r.during.mean !== null

  return (
    <div className="rounded-3xl p-5 max-sm:p-4 border border-black/[0.08] dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.02]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: v.color }}>
          <v.Icon size={14} /> {v.label}
        </span>
        <span className="text-[11px] text-black/35 dark:text-white/30">
          {exp.startDate} – {exp.endDate}
        </span>
      </div>
      <div className="mt-2 text-sm font-semibold text-black/80 dark:text-white/85 flex items-center gap-1.5">
        <CheckCircle2 size={14} className="text-lp-primary flex-shrink-0" /> {exp.change}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-black/65 dark:text-white/60">{r.text}</p>
      {hasBars && (
        <div className="mt-4">
          <ComparisonBars
            comparison={{
              low: { label: `${label}: 14 days before`, value: Math.round(display(r.before.mean!) * 10) / 10 },
              high: { label: `${label}: during the experiment`, value: Math.round(display(r.during.mean!) * 10) / 10 },
              unit: isScore ? 'score' : r.outcome === 'steps' ? 'steps' : 'minutes',
              scaleMax: isScore ? 5 : null,
            }}
          />
        </div>
      )}
    </div>
  )
}

