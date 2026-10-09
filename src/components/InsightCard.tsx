import { Check, ThumbsUp, X } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

import type { Insight, InsightComparison } from '../api/insights'
import { sendInsightFeedback } from '../api/insights'
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
}

export default function InsightCard({ insight, onDismissed }: Props) {
  const [feedback, setFeedback] = useState(insight.feedback)
  const [sending, setSending] = useState<'useful' | 'not-true' | null>(null)

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
