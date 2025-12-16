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
          'p-4 transition-transform transition-shadow duration-200 ease-out ' +
          'hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)]'
        }
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-black/85 dark:text-white/90 tracking-tight">{title}</div>
            {subtitle && <div className="text-xs text-black/45 dark:text-white/55 mt-0.5">{subtitle}</div>}
          </div>
          <div
            className={
              `h-10 w-10 rounded-xl border flex items-center justify-center ${toneClass[tone]} ` +
              'transition-transform duration-200 ease-out group-hover:scale-[1.03]'
            }
          >
            <Icon size={18} />
          </div>
        </div>

        <div className="mt-3 text-2xl font-extrabold text-lp-secondary dark:text-white tracking-tight">{value}</div>
      </Card>
    </Link>
  )
}
