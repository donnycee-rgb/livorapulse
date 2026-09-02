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
  data: Array<{ day: string; sessions: number }>
}

export default function StudySessionsBarChart({ data }: Props) {
  const t = useChartTheme()

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ left: 6, right: 6, top: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={t.grid} />
        <XAxis dataKey="day" tick={{ fill: t.axis, fontSize: 12 }} />
        <YAxis tick={{ fill: t.axis, fontSize: 12 }} width={36} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: `1px solid ${t.tooltipBorder}`,
            background: t.tooltipBg,
          }}
        />
        <Bar dataKey="sessions" fill="#00BCD4" radius={[10, 10, 10, 10]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
