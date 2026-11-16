import { useId } from 'react'
import clsx from 'clsx'
import type { DayKey } from '../../data/types'
import { WEEK, goalFraction, type DayValue } from '../../lib/weekStory'

// The heart outline (24×24), spanning roughly y = 3 to y = 21.5
const HEART = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
const TOP = 3
const BOTTOM = 21.5

/**
 * A week as seven hearts that fill from the bottom, like a glass, as you get
 * closer to the day's goal. A full heart means the goal was reached. Days
 * still to come are dashed outlines. Read in a second, no axes.
 */
export default function WeekDots({ values, goal, today, color, lowerIsBetter = false, format }: {
  values: DayValue[]
  goal: number
  today: DayKey
  color: string
  lowerIsBetter?: boolean
  format: (v: number) => string // tooltip value, e.g. "8,200 steps"
}) {
  const uid = useId().replace(/:/g, '')
  const todayIdx = WEEK.indexOf(today)

  return (
    <div className="grid grid-cols-7 gap-1.5 max-w-[340px]" role="list">
      {WEEK.map((day, i) => {
        const value = values.find((v) => v.day === day)?.value ?? null
        const future = i > todayIdx
        const f = future ? 0 : goalFraction(value, goal, lowerIsBetter)
        const full = f >= 1
        const fillTop = BOTTOM - (BOTTOM - TOP) * f
        const clipId = `heart-${uid}-${i}`
        const label = future ? `${day}: still to come` : value ? `${day}: ${format(value)}${full ? ' (goal reached)' : ''}` : `${day}: nothing logged`
        return (
          <div key={day} className="flex flex-col items-center gap-1" title={label} role="listitem" aria-label={label}>
            <svg viewBox="0 0 24 24" className={clsx('w-8 h-8 max-sm:w-7 max-sm:h-7', full && 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.12)]')} aria-hidden>
              <defs>
                <clipPath id={clipId}>
                  <path d={HEART} />
                </clipPath>
              </defs>
              {/* empty heart */}
              <path d={HEART} className={future ? 'fill-transparent' : 'fill-black/[0.05] dark:fill-white/[0.07]'} />
              {/* filling, from the bottom up */}
              {f > 0 && (
                <rect x="0" y={fillTop} width="24" height={24 - fillTop} fill={color} clipPath={`url(#${clipId})`}
                  style={{ transition: 'y 0.6s ease-out, height 0.6s ease-out' }} />
              )}
              {/* a soft shine on full hearts */}
              {full && <ellipse cx="8" cy="8" rx="2.2" ry="1.4" fill="white" opacity="0.45" transform="rotate(-30 8 8)" />}
              {/* outline */}
              <path d={HEART} fill="none" strokeWidth="1.4"
                stroke={f > 0 ? color : 'currentColor'}
                strokeDasharray={future ? '2 2' : undefined}
                className={f > 0 ? undefined : 'text-black/15 dark:text-white/20'} />
            </svg>
            <span className={clsx('text-[10px]', i === todayIdx ? 'font-semibold text-black/75 dark:text-white/80' : 'text-black/35 dark:text-white/35')}>
              {day.slice(0, 1)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
