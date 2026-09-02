import { CalendarDays, Clock, MonitorSmartphone, Timer, TrendingUp } from 'lucide-react'
import { useMemo } from 'react'

import Avatar from './Avatar'
import Card from './Card'
import { useAppStore } from '../store/useAppStore'
import { formatMinutesToHM, formatNumber } from '../utils/format'
import { getDayKey } from '../utils/date'

function buildMonthGrid(d: Date) {
  const year = d.getFullYear()
  const month = d.getMonth()
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)

  const monStartOffset = (first.getDay() + 6) % 7
  const daysInMonth = last.getDate()
  const totalCells = Math.ceil((monStartOffset + daysInMonth) / 7) * 7

  const cells: Array<{ day: number | null; date: Date | null }> = []
  for (let i = 0; i < totalCells; i++) {
    const dayNumber = i - monStartOffset + 1
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      cells.push({ day: null, date: null })
      continue
    }
    const date = new Date(year, month, dayNumber)
    cells.push({ day: dayNumber, date })
  }

  return {
    title: d.toLocaleString(undefined, { month: 'long', year: 'numeric' }),
    cells,
  }
}

// Shared inner content used by both mobile and desktop layouts
function PanelContent() {
  const user = useAppStore((s) => s.user)
  const notifications = useAppStore((s) => s.notifications)

  const day = getDayKey()
  const steps = useAppStore((s) => s.physical.weeklySteps.find((x) => x.day === day)?.steps ?? 0)
  const screenMin = useAppStore((s) => s.digital.weeklyScreenTimeMin.find((x) => x.day === day)?.minutes ?? 0)
  const focusMin = useAppStore((s) => s.productivity.focusMinutesByDay.find((x) => x.day === day)?.minutes ?? 0)

  const month = useMemo(() => buildMonthGrid(new Date()), [])
  const todayKey = new Date().toDateString()

  const items = useMemo(() => {
    return [...notifications]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 3)
  }, [notifications])

  return (
    <>
      {/* Profile */}
      <div className="relative p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-3 rounded-full bg-white/10 blur-2xl" />
            <Avatar initials={user.avatarInitials} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{user.name}</div>
            <div className="text-xs text-white/70 truncate">{user.email}</div>
          </div>
        </div>

        {/* Stats — 3 cols always */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Card className="p-2 sm:p-3 bg-white/10 dark:bg-white/10 border-white/10">
            <div className="text-[10px] sm:text-[11px] text-white/70">Steps</div>
            <div className="mt-1 text-xs sm:text-sm font-extrabold text-white tracking-tight">{formatNumber(steps)}</div>
          </Card>
          <Card className="p-2 sm:p-3 bg-white/10 dark:bg-white/10 border-white/10">
            <div className="text-[10px] sm:text-[11px] text-white/70">Screen</div>
            <div className="mt-1 text-xs sm:text-sm font-extrabold text-white tracking-tight">{formatMinutesToHM(screenMin)}</div>
          </Card>
          <Card className="p-2 sm:p-3 bg-white/10 dark:bg-white/10 border-white/10">
            <div className="text-[10px] sm:text-[11px] text-white/70">Focus</div>
            <div className="mt-1 text-xs sm:text-sm font-extrabold text-white tracking-tight">{focusMin}m</div>
          </Card>
        </div>
      </div>

      {/* Calendar */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold flex items-center gap-2">
            <CalendarDays size={15} />
            {month.title}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-0.5 sm:gap-1 text-[10px] sm:text-[11px] text-white/70">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((x, i) => (
            <div key={i} className="text-center py-1">{x}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {month.cells.map((c, idx) => {
            const isToday = c.date ? c.date.toDateString() === todayKey : false
            return (
              <div
                key={idx}
                className={
                  'h-7 sm:h-8 rounded-xl flex items-center justify-center text-[11px] sm:text-xs ' +
                  'transition-transform duration-200 ease-out ' +
                  (c.day ? 'text-white/90 cursor-default' : 'text-white/20') +
                  (isToday
                    ? ' bg-lp-accent text-black font-bold'
                    : ' bg-white/5 hover:bg-white/10')
                }
              >
                {c.day ?? ''}
              </div>
            )
          })}
        </div>
      </div>

      {/* Reminders */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5">
        <div className="text-sm font-semibold flex items-center gap-2">
          <TrendingUp size={15} />
          Reminders
        </div>

        <div className="mt-3 space-y-2">
          {items.length === 0 ? (
            <div className="text-xs text-white/70">No reminders yet.</div>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className="relative rounded-2xl bg-white/10 border border-white/10 p-3 overflow-hidden"
              >
                <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-white/20" />
                <div className="flex items-start justify-between gap-3 pl-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate leading-snug">{n.title}</div>
                    <div className="text-xs text-white/70 truncate mt-0.5">{n.message}</div>
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-white/60">
                      <Clock size={11} />
                      {new Date(n.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                    {n.title.toLowerCase().includes('focus') ? (
                      <Timer size={14} />
                    ) : n.title.toLowerCase().includes('screen') ? (
                      <MonitorSmartphone size={14} />
                    ) : (
                      <TrendingUp size={14} />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

// Desktop sidebar version (unchanged usage in Dashboard)
export default function DashboardRightPanel() {
  return (
    <div className="relative rounded-3xl bg-lp-secondary text-white shadow-card border border-white/10 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/8 via-transparent to-black/10" />
      <PanelContent />
    </div>
  )
}

// Mobile version — flat card, shown below main dashboard content
export function DashboardRightPanelMobile() {
  return (
    <div className="relative rounded-3xl bg-lp-secondary text-white shadow-card border border-white/10 overflow-hidden md:hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/8 via-transparent to-black/10" />
      {/* Section label */}
      <div className="px-4 pt-4 pb-0">
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Your Overview</div>
      </div>
      <PanelContent />
    </div>
  )
}