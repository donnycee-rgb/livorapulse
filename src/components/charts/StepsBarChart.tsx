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
  data: Array<{ day: string; steps: number }>
}

export default function StepsBarChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ left: 6, right: 6, top: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.07)" />
        <XAxis dataKey="day" tick={{ fill: 'rgba(0,0,0,0.6)', fontSize: 12 }} />
        <YAxis tick={{ fill: 'rgba(0,0,0,0.6)', fontSize: 12 }} width={36} />
        <Tooltip
          cursor={{ fill: 'rgba(76, 175, 80, 0.08)' }}
          contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)' }}
        />
        <Bar dataKey="steps" fill="#4CAF50" radius={[10, 10, 10, 10]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
