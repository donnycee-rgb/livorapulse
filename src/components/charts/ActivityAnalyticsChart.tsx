// Built on the shared chart kit (./kit.tsx): one look and animation for every chart
import { AreaTrend, Legend } from './kit'
import { CHART } from '../../theme/chartColors'
import { fmtMin } from './format'

// Steps, focus and screen time have very different scales (thousands vs
// tens), so each is drawn as a % of its own daily goal on one shared axis:
// the dashed line at 100% is "goal reached". The tooltip shows the real
// numbers. (Two scales on one chart would squash the smaller ones flat.)
type Row = { day: string; steps: number; screenMin: number; focusMin: number }

const LEGEND = [
  { label: 'Steps', color: CHART.green },
  { label: 'Focus', color: CHART.violet },
  { label: 'Screen (of limit)', color: CHART.sky },
]

export default function ActivityAnalyticsChart({ data, goals }: {
  data: Row[]
  goals: { steps: number; focusMin: number; screenMin: number }
}) {
  const pct = (v: number, g: number) => (g > 0 && v > 0 ? Math.round((v / g) * 100) : null)
  const rows = data.map((d) => ({
    ...d,
    stepsPct: pct(d.steps, goals.steps),
    focusPct: pct(d.focusMin, goals.focusMin),
    screenPct: pct(d.screenMin, goals.screenMin),
  }))
  const top = Math.max(100, ...rows.flatMap((r) => [r.stepsPct ?? 0, r.focusPct ?? 0, r.screenPct ?? 0]))
  const max = Math.ceil(top / 50) * 50
  return (
    <div className="flex flex-col h-full gap-2">
      <Legend items={LEGEND} />
      <div className="flex-1 min-h-0">
        <AreaTrend data={rows} goal={100} goalLabel="Goal"
          domain={[0, max]} yTicks={Array.from({ length: max / 50 + 1 }, (_, i) => i * 50)} yFormat={(v) => `${v}%`}
          series={[
            { key: 'stepsPct', label: 'Steps', color: CHART.green, text: (r) => (r.steps ? `${r.steps.toLocaleString()} (${r.stepsPct}%)` : null) },
            { key: 'focusPct', label: 'Focus', color: CHART.violet, text: (r) => (r.focusMin ? `${fmtMin(r.focusMin)} (${r.focusPct}%)` : null) },
            { key: 'screenPct', label: 'Screen', color: CHART.sky, text: (r) => (r.screenMin ? `${fmtMin(r.screenMin)} (${r.screenPct}% of limit)` : null) },
          ]} />
      </div>
    </div>
  )
}
