// Built on the shared chart kit (./kit.tsx): one look and animation for every chart
import { BarTrend } from './kit'
import { CHART } from '../../theme/chartColors'
import { getDayKey } from '../../utils/date'

// Recycled items per day. Plastic use isn't something the app records, so it
// isn't drawn: a row of zeros would only look like data.
export default function RecyclePlasticBarChart({ recycled }: {
  recycled: Array<{ day: string; items: number }>
  plastic?: Array<{ day: string; items: number }>
}) {
  return (
    <BarTrend data={recycled} dataKey="items" label="Recycled" color={CHART.teal} highlight={getDayKey()}
      text={(r) => `${r.items} ${r.items === 1 ? 'item' : 'items'}`} />
  )
}
