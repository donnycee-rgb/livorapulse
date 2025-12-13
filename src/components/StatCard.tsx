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
    <Link to={to} className="block">
      <Card className="p-4 hover:-translate-y-0.5 hover:shadow-xl transition">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">{title}</div>
            {subtitle && <div className="text-xs text-black/55 mt-0.5">{subtitle}</div>}
          </div>
          <div className={`h-10 w-10 rounded-xl border flex items-center justify-center ${toneClass[tone]}`}>
            <Icon size={18} />
          </div>
        </div>

        <div className="mt-3 text-2xl font-bold text-lp-secondary dark:text-white">{value}</div>
      </Card>
    </Link>
  )
}
