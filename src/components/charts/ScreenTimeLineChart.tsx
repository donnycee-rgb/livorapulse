// Built on the shared chart kit (./kit.tsx): one look and animation for every chart
import { AreaTrend } from './kit'
import { CHART } from '../../theme/chartColors'
import { fmtMin } from './format'

type Row = { day: string; minutes: number }

export default function ScreenTimeLineChart({ data }: { data: Row[] }) {
  return (
    <AreaTrend data={data}
      series={[{ key: 'minutes', label: 'Screen time', color: CHART.sky, text: (r) => fmtMin(r.minutes) }]} />
  )
}
