import { useState, useEffect } from 'react'
import { Eye, EyeOff, Droplets } from 'lucide-react'
import { motion } from 'framer-motion'
import { apiGet } from '../api/client'
import { PHASES, shortDate, useCycleTracking, type Phase } from '../lib/cycle'

interface CycleData {
  phase: Phase
  periodActive?: boolean
  dayOfCycle: number
  daysUntilNextPeriod: number
  nextPeriodDate: string
  cycleLength: number
  smartCycleLength?: number
  periodDueToday?: boolean
  isLate?: boolean
  daysLate?: number
}

export default function CyclePhaseCard() {
  const tracking = useCycleTracking()
  const [data, setData] = useState<CycleData | null>(null)
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(true)

  // ALL hooks must be called before any conditional return
  useEffect(() => {
    if (!tracking) { setLoading(false); return }
    apiGet<{ success: boolean; data: CycleData | null }>('/api/cycle')
      .then(res => setData(res.data))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [tracking])

  // Conditional returns AFTER all hooks
  if (!tracking) return null
  if (loading || !data) return null

  const p = PHASES[data.phase]
  if (!p) return null
  const phase = { label: p.label, color: p.hex, message: p.line }

  // The phase is calculated from the averaged cycle length, so the bar uses it too
  const cycleLength = data.smartCycleLength ?? data.cycleLength
  const message = data.isLate
    ? 'Later than expected. Cycles vary; log it when it starts.'
    : data.periodDueToday
      ? 'Your period may start today.'
      : data.periodActive
        ? phase.message
        : `Next period expected around ${shortDate(data.nextPeriodDate)}.`

  return (
    <div className="relative rounded-2xl border overflow-hidden"
      style={{ backgroundColor: phase.color + '08', borderColor: phase.color + '25' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: phase.color + '20' }}>
            <Droplets size={14} style={{ color: phase.color }} />
          </div>
          <span className="text-sm font-semibold text-black/70 dark:text-white/70">Cycle</span>
        </div>
        <button type="button" onClick={() => setVisible(v => !v)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-black/30 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60 transition-colors"
          aria-label={visible ? 'Hide cycle info' : 'Show cycle info'}>
          {visible ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>

      {/* Blurred content */}
      <div className={`px-4 pb-4 transition-all duration-300 ${!visible ? 'blur-md select-none pointer-events-none' : ''}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm font-bold" style={{ color: phase.color }}>{phase.label}</span>
              <span className="text-xs text-black/35 dark:text-white/30">· Day {data.dayOfCycle}</span>
            </div>
            <p className="text-xs text-black/50 dark:text-white/45 max-w-[200px] leading-relaxed">{message}</p>
          </div>
          <div className="text-right flex-shrink-0">
            {data.isLate ? (
              <>
                <div className="text-2xl font-black" style={{ color: phase.color }}>{data.daysLate}</div>
                <div className="text-[10px] text-black/35 dark:text-white/30 leading-tight">day{data.daysLate === 1 ? '' : 's'}<br />late</div>
              </>
            ) : data.periodDueToday ? (
              <div className="text-sm font-bold" style={{ color: phase.color }}>Due<br />today</div>
            ) : (
              <>
                <div className="text-2xl font-black" style={{ color: phase.color }}>{data.daysUntilNextPeriod}</div>
                <div className="text-[10px] text-black/35 dark:text-white/30 leading-tight">day{data.daysUntilNextPeriod === 1 ? '' : 's'} to<br />next period</div>
              </>
            )}
          </div>
        </div>

        {/* Mini progress bar */}
        <div className="mt-3 h-1.5 rounded-full bg-black/[0.07] dark:bg-white/[0.07] overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ backgroundColor: phase.color }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (data.dayOfCycle / cycleLength) * 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }} />
        </div>
        <div className="flex justify-between text-[9px] text-black/25 dark:text-white/20 mt-1">
          <span>Day {data.dayOfCycle}</span>
          <span>Day {cycleLength}</span>
        </div>
      </div>

      {/* Blur overlay hint */}
      {!visible && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
            <Eye size={12} className="text-black/40 dark:text-white/40" />
            <span className="text-[11px] font-semibold text-black/40 dark:text-white/40">Tap eye to reveal</span>
          </div>
        </div>
      )}
    </div>
  )
}