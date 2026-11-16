// Built on the shared chart kit (./kit.tsx): one look and animation for every chart
import { AreaTrend } from './kit'
import { CHART } from '../../theme/chartColors'

type Row = { day: string; kcal: number }

export default function CaloriesLineChart({ data }: { data: Row[] }) {
  return (
    <AreaTrend data={data}
      series={[{ key: 'kcal', label: 'Burned', color: CHART.orange, text: (r) => `${Math.round(r.kcal)} kcal` }]} />
  )
}
