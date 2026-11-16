import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'

/**
 * Keeps the detailed chart one tap away: the friendly visual is what people
 * see first; "See details" opens the full chart for those who want numbers.
 * The chart is only rendered once opened.
 */
export default function SeeDetails({ children, label = 'See details' }: { children: ReactNode; label?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-3">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="inline-flex items-center gap-1 text-xs font-semibold text-black/50 dark:text-white/50 hover:text-black/80 dark:hover:text-white/80 transition-colors">
        {open ? 'Hide details' : label}
        <ChevronDown size={14} className={clsx('transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="mt-3 animate-fadeIn">{children}</div>}
    </div>
  )
}
