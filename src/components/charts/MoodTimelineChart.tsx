import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type Props = {
  data: Array<{ day: string; emoji: string }>
}

// Recharts needs a numeric value to draw bars.
// We map emojis to a dummy scale for visualization and show emoji in tooltip.
const emojiScore: Record<string, number> = {
  '😄': 5,
  '🙂': 4,
  '😐': 3,
  '😕': 2,
  '😣': 1,
}

export default function MoodTimelineChart({ data }: Props) {
  const mapped = data.map((d) => ({ ...d, score: emojiScore[d.emoji] ?? 3 }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={mapped} margin={{ left: 6, right: 6, top: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.07)" />
        <XAxis dataKey="day" tick={{ fill: 'rgba(0,0,0,0.6)', fontSize: 12 }} />
        <YAxis hide domain={[0, 5]} />
        <Tooltip
          formatter={(_, __, p) => {
            const payload = (p as any)?.payload
            return [payload?.emoji ?? '', 'Mood']
          }}
          contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)' }}
        />
        <Bar dataKey="score" fill="#00BCD4" radius={[10, 10, 10, 10]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
