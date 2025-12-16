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
  data: Array<{
    day: string
    steps: number
    screenMin: number
    focusMin: number
  }>
}

export default function ActivityAnalyticsChart({ data }: Props) {
  const t = useChartTheme()

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ left: 6, right: 6, top: 8, bottom: 0 }}
        barCategoryGap="22%"
        barGap={4}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={t.grid} strokeOpacity={0.55} />
        <XAxis dataKey="day" tick={{ fill: t.axis, fontSize: 11 }} tickLine={false} axisLine={{ stroke: t.grid }} />
        <YAxis tick={{ fill: t.axis, fontSize: 11 }} tickLine={false} axisLine={false} width={34} />
        <Tooltip
          cursor={{ fill: t.cursor }}
          labelFormatter={(label) => `Day: ${label}`}
          formatter={(value, name) => {
            const key = String(name)
            if (key === 'steps') return [value, 'Steps']
            if (key === 'screenMin') return [value, 'Screen (min)']
            if (key === 'focusMin') return [value, 'Focus (min)']
            return [value, key]
          }}
          contentStyle={{
            borderRadius: 14,
            border: `1px solid ${t.tooltipBorder}`,
            background: t.tooltipBg,
            padding: 10,
          }}
          itemStyle={{ fontSize: 12 }}
          labelStyle={{ fontSize: 12, fontWeight: 700, color: t.axis }}
        />

        <Bar dataKey="steps" fill="#4CAF50" radius={[10, 10, 10, 10]} barSize={10} />
        <Bar dataKey="screenMin" fill="#00BCD4" radius={[10, 10, 10, 10]} barSize={10} />
        <Bar dataKey="focusMin" fill="#1E3A8A" radius={[10, 10, 10, 10]} barSize={10} />
      </BarChart>
    </ResponsiveContainer>
  )
}
