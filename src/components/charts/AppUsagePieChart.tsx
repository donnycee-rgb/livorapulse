import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

type Props = {
  data: Array<{ category: string; minutes: number }>
}

const COLORS = ['#1E3A8A', '#4CAF50', '#00BCD4']

export default function AppUsagePieChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)' }} />
        <Pie
          data={data}
          dataKey="minutes"
          nameKey="category"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
        >
          {data.map((_, idx) => (
            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  )
}
