import { useState } from 'react'
import { MessageCircleHeart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import WellnessCoach from './WellnessCoach'

export default function AICoachButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            type="button"
            onClick={() => setOpen(true)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            // On mobile: bottom-[88px] to sit above the floating bottom nav
            // On desktop: bottom-6
            // Phones: a round button. Wider screens: it says what it is.
            className="fixed bottom-[88px] md:bottom-6 right-4 md:right-6 z-40 h-12 w-12 md:w-auto md:pl-4 md:pr-5 rounded-full bg-lp-btn text-lp-btn-ink shadow-lg shadow-black/15 dark:shadow-black/40 ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center gap-2 transition-colors duration-200"
            aria-label="Ask your wellness coach"
            title="Ask your wellness coach"
          >
            <MessageCircleHeart size={20} strokeWidth={2.1} />
            <span className="hidden md:inline text-[14px] font-semibold">Coach</span>
          </motion.button>
        )}
      </AnimatePresence>

      <WellnessCoach open={open} onClose={() => setOpen(false)} />
    </>
  )
}