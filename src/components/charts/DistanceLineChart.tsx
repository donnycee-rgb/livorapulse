// Built on the shared chart kit (./kit.tsx): one look and animation for every chart
import { AreaTrend } from './kit'
import { CHART } from '../../theme/chartColors'

type Row = { day: string; km: number }

export default function DistanceLineChart({ data }: { data: Row[] }) {
  return (
    <AreaTrend data={data}
      series={[{ key: 'km', label: 'Distance', color: CHART.sky, text: (r) => `${r.km.toFixed(1)} km` }]} />
  )
}
