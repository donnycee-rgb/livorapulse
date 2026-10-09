import { Check, FlaskConical, ThumbsUp, X } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

import type { ExperimentList } from '../api/experiments'
import { startExperiment } from '../api/experiments'
import type { Insight, InsightComparison } from '../api/insights'
import { sendInsightFeedback } from '../api/insights'
import Modal from './ui/Modal'
import { formatMinutesToHM, formatNumber } from '../utils/format'

function formatValue(value: number, c: InsightComparison): string {
  if (c.unit === 'minutes') return formatMinutesToHM(Math.round(value))
  if (c.unit === 'steps') return formatNumber(Math.round(value))
  return c.scaleMax ? `${value.toFixed(1)} / ${c.scaleMax}` : value.toFixed(1)
}

/** Two horizontal bars: the low group vs the high group */
export function ComparisonBars({ comparison }: { comparison: InsightComparison }) {
  const max = comparison.scaleMax ?? Math.max(comparison.low.value, comparison.high.value, 1)
  const rows = [
    { ...comparison.low, color: '#6366F1' },
    { ...comparison.high, color: '#4CAF50' },
  ]
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex items-baseline justify-between gap-3 text-xs mb-1">
            <span className="text-black/55 dark:text-white/50 truncate">{r.label}</span>
            <span className="font-semibold tabular-nums text-black/75 dark:text-white/80 flex-shrink-0">
              {formatValue(r.value, comparison)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(2, Math.min(100, (r.value / max) * 100))}%`, backgroundColor: r.color }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

type Props = {
  insight: Insight
  /** Called after "Not true for me" so the list can drop the card */
  onDismissed?: (id: string) => void
  /** Key of the insight the running experiment tests, if any — only one runs at a time */
  runningExperimentKey?: string | null
  /** Called with the updated experiments after one is started from this card */
  onExperimentStarted?: (list: ExperimentList) => void
}

/** "Try it for 14 days": confirm (and optionally reword) the suggested change */
function TryItDialog({ insight, open, onClose, onStarted }: {
  insight: Insight
  open: boolean
  onClose: () => void
  onStarted: (list: ExperimentList) => void
}) {
  const [change, setChange] = useState(insight.suggestion ?? '')
  const [starting, setStarting] = useState(false)

  const start = async () => {
    setStarting(true)
    try {
      const trimmed = change.trim()
      onStarted(await startExperiment(insight.id, trimmed && trimmed !== insight.suggestion ? trimmed : undefined))
      toast.success('Experiment started — day 1 is today')
      onClose()
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "Couldn't start the experiment. Please try again.")
    } finally {
      setStarting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Try it for 14 days">
      <div className="space-y-4">
        <p className="text-sm text-black/60 dark:text-white/55 leading-relaxed">
          For the next 14 days, try this change and keep logging as usual. Each day, answer "Did you do it today?".
          Afterwards you'll see how it compares with the 14 days before, whatever the result.
        </p>
        <label className="block">
          <span className="text-xs font-semibold text-black/55 dark:text-white/50">Your change</span>
          <input
            value={change}
            onChange={(e) => setChange(e.target.value)}
            maxLength={140}
            className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-black/80 dark:text-white/85 focus:outline-none focus:ring-2 focus:ring-lp-primary/40"
          />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl px-3 py-2 text-sm font-semibold text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10">
            Not now
          </button>
          <button
            type="button"
            onClick={start}
            disabled={starting || change.trim().length < 3}
            className="rounded-xl px-4 py-2 text-sm font-semibold bg-lp-primary text-white shadow-card hover:opacity-95 disabled:opacity-60"
          >
            {starting ? 'Starting…' : 'Start today'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function InsightCard({ insight, onDismissed, runningExperimentKey, onExperimentStarted }: Props) {
  const [feedback, setFeedback] = useState(insight.feedback)
  const [sending, setSending] = useState<'useful' | 'not-true' | null>(null)
  const [tryOpen, setTryOpen] = useState(false)
  const testingThis = runningExperimentKey === insight.key
  const canTry = !!insight.suggestion && !runningExperimentKey && !!onExperimentStarted

  const send = async (value: 'useful' | 'not-true') => {
    setSending(value)
    try {
      await sendInsightFeedback(insight.id, value)
      setFeedback(value)
      if (value === 'not-true') {
        toast.success("Got it — we won't show this one again")
        onDismissed?.(insight.id)
      } else {
        toast.success('Thanks for the feedback')
      }
    } catch {
      toast.error("Couldn't save your feedback. Please try again.")
    } finally {
      setSending(null)
    }
  }

  return (
    <div
      className="rounded-3xl p-5 max-sm:p-4"
      style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(76,175,80,0.04) 100%)',
        border: '1px solid rgba(99,102,241,0.14)',
      }}
    >
      <p className="text-sm leading-relaxed text-black/80 dark:text-white/85">{insight.text}</p>

      <div className="mt-4">
        <ComparisonBars comparison={insight.comparison} />
      </div>

      {testingThis && (
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-lp-primary/15 text-lp-primary">
          <FlaskConical size={12} /> You're testing this now
        </div>
      )}
      {canTry && (
        <button
          type="button"
          onClick={() => setTryOpen(true)}
          className="mt-4 w-full flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left bg-lp-primary/10 hover:bg-lp-primary/15 transition"
        >
          <span className="min-w-0">
            <span className="block text-xs font-bold text-lp-primary">Try it for 14 days</span>
            <span className="block text-sm text-black/70 dark:text-white/70 truncate">{insight.suggestion}</span>
          </span>
          <FlaskConical size={18} className="text-lp-primary flex-shrink-0" />
        </button>
      )}
      {canTry && (
        <TryItDialog insight={insight} open={tryOpen} onClose={() => setTryOpen(false)} onStarted={onExperimentStarted!} />
      )}

      <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[11px] text-black/40 dark:text-white/35">
          A pattern in your own logs, not a diagnosis
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={sending !== null || feedback === 'useful'}
            onClick={() => send('useful')}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition disabled:cursor-default',
              feedback === 'useful'
                ? 'bg-lp-primary/15 text-lp-primary'
                : 'bg-black/[0.05] dark:bg-white/[0.07] text-black/65 dark:text-white/65 hover:bg-black/[0.09] dark:hover:bg-white/[0.12]',
            )}
          >
            {feedback === 'useful' ? <Check size={13} /> : <ThumbsUp size={13} />}
            Useful
          </button>
          <button
            type="button"
            disabled={sending !== null}
            onClick={() => send('not-true')}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold bg-black/[0.05] dark:bg-white/[0.07] text-black/65 dark:text-white/65 hover:bg-black/[0.09] dark:hover:bg-white/[0.12] transition disabled:opacity-60"
          >
            <X size={13} />
            Not true for me
          </button>
        </div>
      </div>
    </div>
  )
}
