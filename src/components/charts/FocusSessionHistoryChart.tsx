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
  data: Array<{ label: string; minutes: number }>
}

export default function FocusSessionHistoryChart({ data }: Props) {
  const t = useChartTheme()

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 6, right: 6, top: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={t.grid} />
        <XAxis type="number" tick={{ fill: t.axis, fontSize: 12 }} />
        <YAxis type="category" dataKey="label" width={90} tick={{ fill: t.axis, fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: `1px solid ${t.tooltipBorder}`,
            background: t.tooltipBg,
          }}
        />
        <Bar dataKey="minutes" fill="#1E3A8A" radius={[10, 10, 10, 10]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
