// Built on the shared chart kit (./kit.tsx): one look and animation for every chart
import { BarTrend } from './kit'
import { CHART } from '../../theme/chartColors'
import { getDayKey } from '../../utils/date'

type Row = { day: string; sessions: number }

export default function StudySessionsBarChart({ data }: { data: Row[] }) {
  return (
    <BarTrend data={data} dataKey="sessions" label="Study sessions" color={CHART.sky} highlight={getDayKey()}
      text={(r) => `${r.sessions} ${r.sessions === 1 ? 'session' : 'sessions'}`} />
  )
}
