import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import Card from './Card'

type Props = {
  to: string
  title: string
  subtitle?: string
  value: string
  Icon: LucideIcon
  tone?: 'primary' | 'secondary' | 'accent' | 'alert'
}

const toneClass: Record<NonNullable<Props['tone']>, string> = {
  primary: 'bg-lp-primary/15 text-lp-primary border-lp-primary/20',
  secondary: 'bg-lp-secondary/10 text-lp-secondary border-lp-secondary/20',
  accent: 'bg-lp-accent/15 text-lp-accent border-lp-accent/20',
  alert: 'bg-lp-alert/15 text-lp-alert border-lp-alert/20',
}

export default function StatCard({ to, title, subtitle, value, Icon, tone = 'primary' }: Props) {
  return (
    <Link to={to} className="block group">
      <Card
        className={
          'p-3 sm:p-4 transition-transform transition-shadow duration-200 ease-out ' +
          'hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)] ' +
          'active:scale-[0.98]'
        }
      >
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-semibold text-black/85 dark:text-white/90 tracking-tight leading-tight">{title}</div>
            {subtitle && <div className="text-[10px] sm:text-xs text-black/45 dark:text-white/55 mt-0.5">{subtitle}</div>}
          </div>
          <div
            className={
              `h-8 w-8 sm:h-10 sm:w-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${toneClass[tone]} ` +
              'transition-transform duration-200 ease-out group-hover:scale-[1.03]'
            }
          >
            <Icon size={16} className="sm:hidden" />
            <Icon size={18} className="hidden sm:block" />
          </div>
        </div>

        <div className="mt-2 sm:mt-3 text-xl sm:text-2xl font-extrabold text-lp-secondary dark:text-white tracking-tight">{value}</div>
      </Card>
    </Link>
  )
}