import type { PropsWithChildren } from 'react'
import Card from '../Card'

type Props = PropsWithChildren<{
  title: string
  subtitle?: string
  right?: React.ReactNode
}>

export default function ChartCard({ title, subtitle, right, children }: Props) {
  return (
    <Card className="p-4 transition-transform duration-200 ease-out hover:-translate-y-px hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-black/85 dark:text-white/90 tracking-tight">{title}</div>
          {subtitle && <div className="text-xs text-black/45 dark:text-white/55 mt-0.5 leading-relaxed">{subtitle}</div>}
        </div>
        {right}
      </div>
      <div className="mt-4 h-56 md:h-64">{children}</div>
    </Card>
  )
}
