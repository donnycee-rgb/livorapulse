import { ClipboardList, ChevronRight, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import CheckInModal from './CheckInModal'

export default function AssessmentReminder() {
  const lastAssessmentAt = useAuthStore((s) => s.lastAssessmentAt)
  const [dismissed, setDismissed] = useState(false)
  const [checkInOpen, setCheckInOpen] = useState(false)

  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000
  const now = Date.now()
  const isDue = !lastAssessmentAt || (now - lastAssessmentAt) >= SEVEN_DAYS

  if (!isDue || dismissed) return <CheckInModal open={checkInOpen} onClose={() => setCheckInOpen(false)} />

  const daysAgo = lastAssessmentAt
    ? Math.floor((now - lastAssessmentAt) / (24 * 60 * 60 * 1000))
    : null

  return (
    <>
    <CheckInModal open={checkInOpen} onClose={() => setCheckInOpen(false)} />
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="relative bg-white dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.07] rounded-2xl px-4 py-3 flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#E8F5E9] dark:bg-[#3D9A41]/15 flex items-center justify-center flex-shrink-0">
          <ClipboardList size={15} className="text-[#3D9A41]" />
        </div>
        <div>
          <div className="text-sm font-medium text-black/75 dark:text-white/80">
            {lastAssessmentAt ? 'Time for your weekly check-in' : 'Complete your Life Balance Check'}
          </div>
          <div className="text-xs text-black/45 dark:text-white/40 mt-0.5">
            {lastAssessmentAt
              ? `Last done ${daysAgo} day${daysAgo === 1 ? '' : 's'} ago. 6 quick questions keep your goals right.`
              : '6 quick questions to keep your goals right for you'}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => setCheckInOpen(true)}
          className="flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#2E7D32] bg-[#E8F5E9] hover:bg-[#d7efd9] dark:bg-[#3D9A41]/15 dark:text-[#6FCF73] transition-colors"
        >
          Start
          <ChevronRight size={12} />
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-black/30 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60 transition-colors"
          aria-label="Dismiss"
        >
          <X size={13} />
        </button>
      </div>
    </motion.div>
    </>
  )
}