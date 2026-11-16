// Built on the shared chart kit (./kit.tsx): one look and animation for every chart
import { AreaTrend } from './kit'
import { CHART } from '../../theme/chartColors'

type Row = { day: string; kg: number }

export default function CarbonLineChart({ data }: { data: Row[] }) {
  return (
    <AreaTrend data={data}
      series={[{ key: 'kg', label: 'CO₂ saved', color: CHART.teal, text: (r) => `${r.kg.toFixed(1)} kg` }]} />
  )
}
