import { useState } from 'react'
import { Sparkles } from 'lucide-react'
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
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            // On mobile: bottom-[88px] to sit above the floating bottom nav
            // On desktop: bottom-6
            className="fixed bottom-[88px] md:bottom-6 right-4 md:right-6 z-40 rounded-2xl bg-[#6366F1] shadow-xl shadow-[#6366F1]/30 flex items-center justify-center text-white hover:bg-indigo-500 transition-colors duration-200"
            style={{ width: 48, height: 48 }}
            aria-label="Open Wellness Coach"
            title="Ask your Wellness Coach"
          >
            <Sparkles size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      <WellnessCoach open={open} onClose={() => setOpen(false)} />
    </>
  )
}