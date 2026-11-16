// Built on the shared chart kit (./kit.tsx): one look and animation for every chart
import { AreaTrend } from './kit'
import { CHART } from '../../theme/chartColors'

type Row = { day: string; hours: number }

export default function SleepAreaChart({ data }: { data: Row[] }) {
  return (
    <AreaTrend data={data}
      series={[{ key: 'hours', label: 'Sleep', color: CHART.violet, text: (r) => `${r.hours.toFixed(1)} h` }]} />
  )
}
