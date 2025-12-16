import Card from './Card'
import Button from './ui/Button'

type Metric = {
  label: string
  value: string
}

type Action = {
  label: string
  onClick: () => void
}

type Props = {
  summaryTitle: string
  metrics: Metric[]
  insights: string[]
  actions?: Action[]
}

export default function ContextSidebar({ summaryTitle, metrics, insights, actions }: Props) {
  return (
    <div className="space-y-4">
      {/* Context Summary Card */}
      <Card className="p-4">
        <div className="text-sm font-semibold text-black/80 dark:text-white/85">{summaryTitle}</div>
        <div className="mt-3 grid grid-cols-1 gap-2">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3 transition-transform duration-200 ease-out hover:-translate-y-px hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]"
            >
              <div className="text-xs font-semibold text-black/45 dark:text-white/55">{metric.label}</div>
              <div className="mt-1 text-sm font-extrabold text-black/85 dark:text-white/90 tracking-tight">{metric.value}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Insights / Tips Card */}
      <Card className="p-4">
        <div className="text-sm font-semibold text-black/80 dark:text-white/85">Insights</div>
        <div className="mt-3 space-y-2">
          {insights.map((insight, index) => (
            <div key={index} className="text-sm text-black/70 dark:text-white/70">
              {insight}
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions Card (Optional) */}
      {actions && actions.length > 0 && (
        <Card className="p-4">
          <div className="text-sm font-semibold text-black/80 dark:text-white/85">Quick Actions</div>
          <div className="mt-3 space-y-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant="secondary"
                onClick={action.onClick}
                className="w-full justify-start"
              >
                {action.label}
              </Button>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
