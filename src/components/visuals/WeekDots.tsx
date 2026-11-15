import { Check } from 'lucide-react'
import clsx from 'clsx'
import type { DayKey } from '../../data/types'
import { WEEK, goalFraction, type DayValue } from '../../lib/weekStory'

/**
 * A week as seven circles that fill up as you get closer to the day's goal;
 * a full circle gets a tick. Days still to come are dashed outlines. Read in a
 * second, no axes.
 */
export default function WeekDots({ values, goal, today, color, lowerIsBetter = false, format }: {
  values: DayValue[]
  goal: number
  today: DayKey
  color: string
  lowerIsBetter?: boolean
  format: (v: number) => string // tooltip value, e.g. "8,200 steps"
}) {
  const todayIdx = WEEK.indexOf(today)
  const r = 13
  const c = 2 * Math.PI * r

  return (
    <div className="grid grid-cols-7 gap-1.5 max-w-[340px]">
      {WEEK.map((day, i) => {
        const value = values.find((v) => v.day === day)?.value ?? null
        const future = i > todayIdx
        const f = future ? 0 : goalFraction(value, goal, lowerIsBetter)
        const done = f >= 1
        const title = future ? `${day}: still to come` : value ? `${day}: ${format(value)}` : `${day}: nothing logged`
        return (
          <div key={day} className="flex flex-col items-center gap-1" title={title}>
            <div className="relative w-8 h-8">
              <svg viewBox="0 0 32 32" className="w-8 h-8 -rotate-90">
                <circle cx="16" cy="16" r={r} fill="none" strokeWidth="3"
                  className={future ? 'stroke-black/[0.08] dark:stroke-white/10' : 'stroke-black/[0.06] dark:stroke-white/[0.08]'}
                  strokeDasharray={future ? '2 3' : undefined} />
                {f > 0 && (
                  <circle cx="16" cy="16" r={r} fill={done ? color : 'none'} stroke={color} strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={`${c * f} ${c}`} />
                )}
              </svg>
              {done && <Check size={14} strokeWidth={3} className="absolute inset-0 m-auto text-white" />}
            </div>
            <span className={clsx('text-[10px]', i === todayIdx ? 'font-semibold text-black/75 dark:text-white/80' : 'text-black/35 dark:text-white/35')}>
              {day.slice(0, 1)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
