// Built on the shared chart kit (./kit.tsx): one look and animation for every chart
import { AreaTrend } from './kit'
import { CHART } from '../../theme/chartColors'

const WORD = ['', 'Very low', 'Low', 'Moderate', 'High', 'Very high']

// null = no check-in that day (drawn as a gap, not as 0)
export default function StressLineChart({ data }: { data: Array<{ day: string; score: number | null }> }) {
  return (
    <AreaTrend data={data} domain={[1, 5]} yTicks={[1, 2, 3, 4, 5]}
      series={[{ key: 'score', label: 'Stress', color: CHART.violetSoft, text: (r) => (r.score ? `${r.score}/5 · ${WORD[r.score]}` : null) }]} />
  )
}
