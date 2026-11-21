import clsx from 'clsx'
import type { DayKey } from '../../data/types'
import { WEEK, goalFraction, type DayValue } from '../../lib/weekStory'

// A week as seven days, each in one of three states anyone can tell apart:
//   goal reached   a solid circle with a check
//   logged, short  a ring drawn as far as the day got toward the goal
//   nothing logged an empty ring
// Days still to come are a dashed outline. Only the check counts as "reached",
// the same rule the sentence beside it uses (weekSentence), so they agree.

const R = 11
const CIRC = 2 * Math.PI * R

export default function WeekDots({ values, goal, today, color, lowerIsBetter = false, format }: {
  values: DayValue[]
  goal: number
  today: DayKey
  color: string
  lowerIsBetter?: boolean
  format: (v: number) => string // tooltip value, e.g. "8,200 steps"
}) {
  const todayIdx = WEEK.indexOf(today)

  return (
    <div className="grid grid-cols-7 gap-1.5 max-w-[340px]" role="list">
      {WEEK.map((day, i) => {
        const value = values.find((v) => v.day === day)?.value ?? null
        const future = i > todayIdx
        const logged = !future && value !== null && value > 0
        const f = logged ? goalFraction(value, goal, lowerIsBetter) : 0
        const reached = logged && f >= 1
        const label = future ? `${day}: still to come`
          : !logged ? `${day}: nothing logged`
          : `${day}: ${format(value!)}${reached ? ', goal reached' : ', goal not reached'}`
        return (
          <div key={day} className="flex flex-col items-center gap-1" title={label} role="listitem" aria-label={label}>
            <svg viewBox="0 0 28 28" className="w-8 h-8 max-sm:w-7 max-sm:h-7" aria-hidden>
              {reached ? (
                <>
                  <circle cx="14" cy="14" r="12.5" fill={color} />
                  <path d="M9 14.5l3.2 3.2L19 11" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </>
              ) : (
                <>
                  <circle cx="14" cy="14" r={R} fill="none" strokeWidth="3"
                    className={future ? 'stroke-black/15 dark:stroke-white/20' : 'stroke-black/[0.07] dark:stroke-white/[0.09]'}
                    strokeDasharray={future ? '2.5 3' : undefined} />
                  {logged && f > 0 && (
                    <circle cx="14" cy="14" r={R} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={`${CIRC * Math.min(f, 0.97)} ${CIRC}`} transform="rotate(-90 14 14)"
                      style={{ transition: 'stroke-dasharray 0.6s ease-out' }} />
                  )}
                </>
              )}
            </svg>
            <span className={clsx('text-[10px]', i === todayIdx ? 'font-semibold text-black/75 dark:text-white/80' : 'text-black/40 dark:text-white/40')}>
              {day.slice(0, 1)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
