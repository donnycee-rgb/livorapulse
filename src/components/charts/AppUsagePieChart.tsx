// Built on the shared chart kit (./kit.tsx): one look and animation for every chart
import { Donut } from './kit'
import { CHART, type Duo } from '../../theme/chartColors'
import { fmtMin } from './format'

const COLOR: Record<string, Duo> = { Social: CHART.rose, Productive: CHART.sky, Entertainment: CHART.violetSoft }
const LABEL: Record<string, string> = { Social: 'Social', Productive: 'Work & study', Entertainment: 'Fun' }

export default function AppUsagePieChart({ data }: { data: Array<{ category: string; minutes: number }> }) {
  return (
    <Donut format={fmtMin}
      data={data.map((d) => ({ label: LABEL[d.category] ?? d.category, value: d.minutes, color: COLOR[d.category] ?? CHART.indigo }))} />
  )
}
