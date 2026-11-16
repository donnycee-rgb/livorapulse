// Built on the shared chart kit (./kit.tsx): one look and animation for every chart
import { Donut } from './kit'
import { CHART, type Duo } from '../../theme/chartColors'

const COLOR: Record<string, Duo> = { Walking: CHART.green, Cycling: CHART.sky, Driving: CHART.orange }

export default function TransportModeChart({ data }: { data: Array<{ mode: string; trips: number }> }) {
  return (
    <Donut format={(v) => `${v} ${v === 1 ? 'trip' : 'trips'}`}
      data={data.map((d) => ({ label: d.mode, value: d.trips, color: COLOR[d.mode] ?? CHART.indigo }))} />
  )
}
