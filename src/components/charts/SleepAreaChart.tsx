import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useChartTheme } from '../../theme/useChartTheme'

type Props = {
  data: Array<{ day: string; hours: number }>
}

export default function SleepAreaChart({ data }: Props) {
  const t = useChartTheme()

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ left: 6, right: 6, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="sleepFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00BCD4" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#00BCD4" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={t.grid} />
        <XAxis dataKey="day" tick={{ fill: t.axis, fontSize: 12 }} />
        <YAxis tick={{ fill: t.axis, fontSize: 12 }} width={36} />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: `1px solid ${t.tooltipBorder}`,
            background: t.tooltipBg,
          }}
        />
        <Area type="monotone" dataKey="hours" stroke="#00BCD4" strokeWidth={2} fill="url(#sleepFill)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
