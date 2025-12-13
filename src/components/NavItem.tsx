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
      className={({ isActive }) =>
        [
          'flex items-center gap-2 rounded-xl px-3 py-2 transition border',
          isActive
            ? 'bg-lp-primary/15 text-lp-secondary dark:text-white border-lp-primary/30'
            : 'border-transparent text-black/70 dark:text-white/75 hover:bg-black/5 dark:hover:bg-white/10',
          compact ? 'justify-center px-2' : '',
        ].join(' ')
      }
    >
      <Icon size={18} />
      {!compact && <span className="text-sm font-medium">{label}</span>}
    </NavLink>
  )
}
