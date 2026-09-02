import { useState, useEffect } from 'react'
import { Eye, EyeOff, Droplets } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store/useAuthStore'
import { apiGet } from '../api/client'

interface CycleData {
  phase: string
  dayOfCycle: number
  daysUntilNextPeriod: number
  nextPeriodDate: string
  cycleLength: number
}

const PHASE_CONFIG = {
  menstrual:  { label: 'Menstrual',  color: '#FF6B6B', icon: '🔴', message: 'Rest is productive too — your body is working hard.' },
  follicular: { label: 'Follicular', color: '#4CAF50', icon: '🌱', message: 'Energy rising — great time for new goals.' },
  ovulation:  { label: 'Ovulation',  color: '#FFA500', icon: '✨', message: 'Peak energy day — push your goals today.' },
  luteal:     { label: 'Luteal',     color: '#6366F1', icon: '🌙', message: 'Wind-down phase — mood dips are normal.' },
}

export default function CyclePhaseCard() {
  const gender = useAuthStore((s) => s.user?.profile?.gender)
  const [data, setData] = useState<CycleData | null>(null)
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(true)

  // ALL hooks must be called before any conditional return
  useEffect(() => {
    if (gender !== 'female') { setLoading(false); return }
    apiGet<{ success: boolean; data: CycleData | null }>('/api/cycle')
      .then(res => setData(res.data))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [gender])

  // Conditional returns AFTER all hooks
  if (gender !== 'female') return null
  if (loading || !data) return null

  const phase = PHASE_CONFIG[data.phase as keyof typeof PHASE_CONFIG]
  if (!phase) return null

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
            <p className="text-xs text-black/50 dark:text-white/45 max-w-[200px] leading-relaxed">{phase.message}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-black" style={{ color: phase.color }}>{data.daysUntilNextPeriod}</div>
            <div className="text-[10px] text-black/35 dark:text-white/30 leading-tight">days to<br />next period</div>
          </div>
        </div>

        {/* Mini progress bar */}
        <div className="mt-3 h-1.5 rounded-full bg-black/[0.07] dark:bg-white/[0.07] overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ backgroundColor: phase.color }}
            initial={{ width: 0 }}
            animate={{ width: `${(data.dayOfCycle / data.cycleLength) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }} />
        </div>
        <div className="flex justify-between text-[9px] text-black/25 dark:text-white/20 mt-1">
          <span>Day {data.dayOfCycle}</span>
          <span>Day {data.cycleLength}</span>
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