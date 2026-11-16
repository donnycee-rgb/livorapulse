// Built on the shared chart kit (./kit.tsx): one look and animation for every chart
import { BarTrend } from './kit'
import { CHART, type Duo } from '../../theme/chartColors'
import { MOOD_ICONS } from '../../lib/moodIcons'
import type { MoodEmoji } from '../../data/types'
import { getDayKey } from '../../utils/date'

// Moods drawn as a 1-5 bar (stored as emoji values, shown as words)
const SCORE: Record<MoodEmoji, number> = { '😄': 5, '🙂': 4, '😐': 3, '😕': 2, '😣': 1 }
const COLOR: Record<number, Duo> = { 5: CHART.green, 4: CHART.sky, 3: CHART.violet, 2: CHART.orange, 1: CHART.rose }

export default function MoodTimelineChart({ data }: { data: Array<{ day: string; emoji: string | null }> }) {
  // Days without a check-in get no bar (not a "neutral" one)
  const rows = data.map((d) => {
    const emoji = d.emoji && d.emoji in SCORE ? (d.emoji as MoodEmoji) : null
    return { day: d.day, emoji, score: emoji ? SCORE[emoji] : 0 }
  })
  return (
    <BarTrend data={rows} dataKey="score" label="Mood" color={CHART.pink} domain={[0, 5]} highlight={getDayKey()}
      barColor={(r) => COLOR[r.score] ?? CHART.pink}
      yTicks={[1, 2, 3, 4, 5]}
      text={(r) => (r.emoji ? MOOD_ICONS[r.emoji].label : 'No check-in')} />
  )
}
