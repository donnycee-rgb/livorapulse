import { Moon } from 'lucide-react'
import clsx from 'clsx'
import type { DayKey } from '../../data/types'
import { WEEK } from '../../lib/weekStory'

/**
 * The week's sleep as a strip of night sky: each night is a column of deep
 * blue as tall as the hours slept, with a moon on nights that reached the
 * goal. The goal shows as a faint line across the sky.
 */
export default function SleepNightSky({ nights, goalHours, today }: {
  nights: Array<{ day: DayKey; hours: number }>
  goalHours: number
  today: DayKey
}) {
  const todayIdx = WEEK.indexOf(today)
  const maxH = Math.max(10, goalHours + 1)
  const goalPct = (goalHours / maxH) * 100

  return (
    <div className="relative rounded-3xl overflow-hidden px-4 pt-4 pb-3"
      style={{ background: 'linear-gradient(180deg, #0E1A3A 0%, #1E2D5C 100%)' }}>
      {/* a few stars */}
      {[[8, 12], [22, 30], [41, 8], [63, 22], [78, 10], [90, 34], [53, 40]].map(([x, y], i) => (
        <span key={i} className="absolute w-[2px] h-[2px] rounded-full bg-white/60" style={{ left: `${x}%`, top: `${y}%` }} aria-hidden />
      ))}

      <div className="relative h-36 grid grid-cols-7 gap-2 items-end">
        {/* goal line */}
        <div className="absolute left-0 right-0 border-t border-dashed border-white/25" style={{ bottom: `${goalPct}%` }} aria-hidden>
          <span className="absolute -top-4 right-0 text-[10px] text-white/45">{goalHours}h goal</span>
        </div>
        {WEEK.map((day, i) => {
          const hours = nights.find((n) => n.day === day)?.hours ?? 0
          const future = i > todayIdx
          const good = hours >= goalHours
          const h = Math.min(100, (hours / maxH) * 100)
          return (
            <div key={day} className="relative h-full flex flex-col justify-end items-center"
              title={future ? `${day}: still to come` : hours ? `${day}: ${hours.toFixed(1)}h` : `${day}: not logged`}>
              {hours > 0 && good && <Moon size={13} className="text-amber-200 mb-1" fill="currentColor" />}
              {hours > 0 ? (
                <div className={clsx('w-full max-w-[34px] rounded-t-xl rounded-b-md', good ? 'bg-indigo-300/80' : 'bg-indigo-300/35')}
                  style={{ height: `${h}%` }} />
              ) : (
                <div className="w-full max-w-[34px] h-2 rounded-md bg-white/[0.08]" />
              )}
            </div>
          )
        })}
      </div>
      <div className="grid grid-cols-7 gap-2 mt-2">
        {WEEK.map((day, i) => (
          <span key={day} className={clsx('text-center text-[10px]', i === todayIdx ? 'text-white font-semibold' : 'text-white/45')}>{day.slice(0, 1)}</span>
        ))}
      </div>
    </div>
  )
}
