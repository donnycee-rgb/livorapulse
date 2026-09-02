import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useChartTheme } from '../../theme/useChartTheme'

type Props = {
  data: Array<{ day: string; emoji: string }>
}

// Recharts needs a numeric value to draw bars.
// We map emojis to a scale for visualization and show emoji in tooltip.
const emojiScore: Record<string, number> = {
  '😄': 5,
  '🙂': 4,
  '😐': 3,
  '😕': 2,
  '😣': 1,
}

export default function MoodTimelineChart({ data }: Props) {
  const t = useChartTheme()
  const mapped = data.map((d) => ({ ...d, score: emojiScore[d.emoji] ?? 3 }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={mapped} margin={{ left: 6, right: 6, top: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={t.grid} />
        <XAxis dataKey="day" tick={{ fill: t.axis, fontSize: 12 }} />
        <YAxis hide domain={[0, 5]} />
        <Tooltip
          // Keep runtime behavior the same; this is typed loosely to satisfy Recharts' generics.
          formatter={((_: any, __: any, p: any) => {
            const payload = p?.payload
            return [payload?.emoji ?? '', 'Mood']
          }) as any}
          contentStyle={{
            borderRadius: 12,
            border: `1px solid ${t.tooltipBorder}`,
            background: t.tooltipBg,
          }}
        />
        <Bar dataKey="score" fill="#00BCD4" radius={[10, 10, 10, 10]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
