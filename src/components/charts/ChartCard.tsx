import type { PropsWithChildren } from 'react'
import Card from '../Card'

type Props = PropsWithChildren<{
  title: string
  subtitle?: string
  right?: React.ReactNode
}>

export default function ChartCard({ title, subtitle, right, children }: Props) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          {subtitle && <div className="text-xs text-black/55 mt-0.5">{subtitle}</div>}
        </div>
        {right}
      </div>
      <div className="mt-3 h-56 md:h-64">{children}</div>
    </Card>
  )
}
