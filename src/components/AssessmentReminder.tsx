import { useNavigate } from 'react-router-dom'
import { ClipboardList, ChevronRight, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'

export default function AssessmentReminder() {
  const navigate = useNavigate()
  const lastAssessmentAt = useAuthStore((s) => s.lastAssessmentAt)
  const setLastAssessmentAt = useAuthStore((s) => s.setLastAssessmentAt)
  const [dismissed, setDismissed] = useState(false)

  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000
  const now = Date.now()
  const isDue = !lastAssessmentAt || (now - lastAssessmentAt) >= SEVEN_DAYS

  if (!isDue || dismissed) return null

  const daysAgo = lastAssessmentAt
    ? Math.floor((now - lastAssessmentAt) / (24 * 60 * 60 * 1000))
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="relative bg-lp-primary/[0.07] dark:bg-lp-primary/[0.10] border border-lp-primary/25 rounded-2xl p-4 flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-lp-primary/15 flex items-center justify-center flex-shrink-0">
          <ClipboardList size={18} className="text-lp-primary" />
        </div>
        <div>
          <div className="text-sm font-semibold text-black/80 dark:text-white/85">
            {lastAssessmentAt ? 'Time for your weekly check-in' : 'Complete your Life Balance Check'}
          </div>
          <div className="text-xs text-black/45 dark:text-white/40 mt-0.5">
            {lastAssessmentAt
              ? `Last done ${daysAgo} day${daysAgo === 1 ? '' : 's'} ago — takes under 2 minutes`
              : 'Answer 5 quick questions to personalise your dashboard score'}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => {
            setLastAssessmentAt(Date.now())
            navigate('/login?retake=true')
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-lp-primary text-white hover:bg-green-500 transition-all"
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
  )
}