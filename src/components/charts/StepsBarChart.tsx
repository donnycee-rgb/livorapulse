// Built on the shared chart kit (./kit.tsx): one look and animation for every chart
import { BarTrend } from './kit'
import { CHART } from '../../theme/chartColors'
import { getDayKey } from '../../utils/date'

type Row = { day: string; steps: number }

export default function StepsBarChart({ data }: { data: Row[] }) {
  return (
    <BarTrend data={data} dataKey="steps" label="Steps" color={CHART.green} highlight={getDayKey()}
      text={(r) => r.steps.toLocaleString()} />
  )
}
