import Card from './Card'

type Props = {
  items: Array<{ label: string; value: string; tone: 'good' | 'neutral' | 'alert' }>
}

const toneBadge: Record<Props['items'][number]['tone'], string> = {
  good: 'bg-lp-primary/15 text-lp-primary',
  neutral: 'bg-black/5 text-black/60 dark:bg-white/10 dark:text-white/70',
  alert: 'bg-lp-alert/15 text-lp-alert',
}

export default function Highlights({ items }: Props) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Today’s Highlights</div>
          <div className="text-xs text-black/55 mt-0.5">Top 3 metrics from your day</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {items.map((h) => (
          <div
            key={h.label}
            className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 p-3"
          >
            <div className="text-xs text-black/55 dark:text-white/55">{h.label}</div>
            <div className="mt-1 text-sm font-semibold text-black/85 dark:text-white/90">{h.value}</div>
            <div className={`mt-2 inline-flex px-2 py-1 rounded-lg text-[11px] font-semibold ${toneBadge[h.tone]}`}>
              {h.tone === 'good' ? 'Good' : h.tone === 'alert' ? 'Alert' : 'OK'}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
