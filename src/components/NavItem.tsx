import { NavLink } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

type Props = {
  to: string
  label: string
  Icon: LucideIcon
  compact?: boolean
}

export default function NavItem({ to, label, Icon, compact = false }: Props) {
  return (
    <NavLink
      to={to}
      title={label}
      className={({ isActive }) =>
        [
          'relative flex items-center gap-2 rounded-xl px-3 py-2 border outline-none',
          'transition-colors transition-shadow duration-200 ease-out',
          'focus-visible:ring-2 focus-visible:ring-lp-accent/40',
          isActive
            ? [
                'bg-lp-primary/12 text-lp-secondary dark:text-white',
                'border-lp-primary/25 shadow-[0_10px_25px_rgba(76,175,80,0.10)]',
                // left accent bar for non-compact (desktop list)
                !compact
                  ? "before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r-full before:bg-lp-primary"
                  : "before:content-[''] before:absolute before:left-1/2 before:-translate-x-1/2 before:-bottom-1 before:h-1 before:w-6 before:rounded-full before:bg-lp-primary",
              ].join(' ')
            : 'border-transparent text-black/70 dark:text-white/75 hover:bg-black/5 dark:hover:bg-white/10 hover:shadow-[0_8px_18px_rgba(0,0,0,0.06)]',
          compact ? 'justify-center px-2' : '',
        ].join(' ')
      }
    >
      <span className={compact ? '' : 'inline-flex h-9 w-9 items-center justify-center rounded-xl bg-black/5 dark:bg-white/10'}>
        <Icon size={18} />
      </span>
      {!compact && <span className="text-sm font-semibold tracking-tight">{label}</span>}
    </NavLink>
  )
}
