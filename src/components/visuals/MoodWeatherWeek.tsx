import { Cloud, CloudLightning, CloudRain, CloudSun, Sun, type LucideIcon } from 'lucide-react'
import clsx from 'clsx'
import type { DayKey, MoodEmoji } from '../../data/types'
import { MOOD_WEATHER, WEEK, type Weather } from '../../lib/weekStory'

const LOOK: Record<Weather['kind'], { icon: LucideIcon; color: string; bg: string }> = {
  sunny: { icon: Sun, color: '#F59E0B', bg: 'bg-amber-50 dark:bg-amber-500/15' },
  bright: { icon: CloudSun, color: '#F5A623', bg: 'bg-orange-50 dark:bg-orange-500/10' },
  cloudy: { icon: Cloud, color: '#94A3B8', bg: 'bg-slate-100 dark:bg-white/[0.06]' },
  showers: { icon: CloudRain, color: '#60A5FA', bg: 'bg-sky-50 dark:bg-sky-500/10' },
  rain: { icon: CloudLightning, color: '#6366F1', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
}

/** The week's moods as a weather forecast: one icon per day. */
export default function MoodWeatherWeek({ byDay, today }: {
  byDay: Array<{ day: DayKey | string; emoji: MoodEmoji | null }>
  today: DayKey
}) {
  const todayIdx = WEEK.indexOf(today)
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {WEEK.map((day, i) => {
        const emoji = byDay.find((d) => d.day === day)?.emoji ?? null
        const w = emoji ? MOOD_WEATHER[emoji] : null
        const look = w ? LOOK[w.kind] : null
        const future = i > todayIdx
        return (
          <div key={day} className="flex flex-col items-center gap-1.5"
            title={future ? `${day}: still to come` : w ? `${day}: ${w.label}` : `${day}: not logged`}>
            <div className={clsx('w-11 h-11 max-sm:w-9 max-sm:h-9 rounded-2xl flex items-center justify-center',
              look ? look.bg : 'border border-dashed border-black/10 dark:border-white/15')}>
              {look && <look.icon size={20} style={{ color: look.color }} />}
            </div>
            <span className={clsx('text-[11px]', i === todayIdx ? 'font-semibold text-black/75 dark:text-white/80' : 'text-black/40 dark:text-white/40')}>
              {day}
            </span>
          </div>
        )
      })}
    </div>
  )
}
