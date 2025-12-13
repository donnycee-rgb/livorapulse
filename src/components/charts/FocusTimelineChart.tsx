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

type Item = {
  id: string
  label: string
  start: number
  duration: number
}

type Props = {
  sessions: Array<{ id: string; day: string; startHour: number; durationHours: number }>
}

// We render sessions as horizontal bars: X = hours in day.
export default function FocusTimelineChart({ sessions }: Props) {
  const t = useChartTheme()

  const data: Item[] = sessions.map((s) => ({
    id: s.id,
    label: `${s.day} • ${s.startHour}:00`,
    start: s.startHour,
    duration: s.durationHours,
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 6, right: 6, top: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={t.grid} />
        <XAxis
          type="number"
          domain={[0, 24]}
          tick={{ fill: t.axis, fontSize: 12 }}
          ticks={[0, 6, 12, 18, 24]}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={90}
          tick={{ fill: t.axis, fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: `1px solid ${t.tooltipBorder}`,
            background: t.tooltipBg,
          }}
        />

        {/* Invisible bar just to offset start */}
        <Bar dataKey="start" stackId="a" fill="rgba(0,0,0,0)" />
        <Bar dataKey="duration" stackId="a" fill="#1E3A8A" radius={[10, 10, 10, 10]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
