import clsx from 'clsx'
import type { DayKey } from '../../data/types'
import { WEEK } from '../../lib/weekStory'
import { DAY_PARTS, type DayPart } from '../../lib/visualStories'

/**
 * When you focus: a week of days across, parts of the day down. Deeper
 * colour means more focus then, so your best times stand out at a glance.
 */
export default function FocusTimesGrid({ grid, today }: { grid: Record<DayKey, Record<DayPart, number>>; today: DayKey }) {
  const max = Math.max(1, ...WEEK.flatMap((d) => DAY_PARTS.map((p) => grid[d][p.key])))
  const todayIdx = WEEK.indexOf(today)
  return (
    <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] max-sm:grid-cols-[60px_repeat(7,minmax(0,1fr))] gap-1.5 items-center">
      <span />
      {WEEK.map((d, i) => (
        <span key={d} className={clsx('text-center text-[11px]', i === todayIdx ? 'font-semibold text-black/75 dark:text-white/80' : 'text-black/40 dark:text-white/40')}>
          {d.slice(0, 1)}
        </span>
      ))}
      {DAY_PARTS.map((p) => (
        <FocusRow key={p.key} label={p.label} cells={WEEK.map((d, i) => ({ d, min: grid[d][p.key], future: i > todayIdx }))} max={max} />
      ))}
    </div>
  )
}

function FocusRow({ label, cells, max }: { label: string; cells: Array<{ d: DayKey; min: number; future: boolean }>; max: number }) {
  return (
    <>
      <span className="text-xs text-black/50 dark:text-white/50">{label}</span>
      {cells.map(({ d, min, future }) => (
        <span key={d} title={future ? `${d}: still to come` : min ? `${d} ${label.toLowerCase()}: ${min} min` : `${d} ${label.toLowerCase()}: no focus`}
          className={clsx('h-8 max-sm:h-7 rounded-lg', future ? 'border border-dashed border-black/10 dark:border-white/15' : !min && 'bg-black/[0.04] dark:bg-white/[0.05]')}
          style={min ? { background: `rgba(139, 92, 246, ${0.2 + 0.8 * (min / max)})` } : undefined} />
      ))}
    </>
  )
}
