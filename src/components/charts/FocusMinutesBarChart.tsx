// Built on the shared chart kit (./kit.tsx): one look and animation for every chart
import { BarTrend } from './kit'
import { CHART } from '../../theme/chartColors'
import { getDayKey } from '../../utils/date'
import { fmtMin } from './format'

type Row = { day: string; minutes: number }

export default function FocusMinutesBarChart({ data }: { data: Row[] }) {
  return (
    <BarTrend data={data} dataKey="minutes" label="Focus" color={CHART.violet} highlight={getDayKey()}
      text={(r) => fmtMin(r.minutes)} />
  )
}
