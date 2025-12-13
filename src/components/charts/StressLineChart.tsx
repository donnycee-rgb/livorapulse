import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type Props = {
  data: Array<{ day: string; score: number }>
}

export default function StressLineChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ left: 6, right: 6, top: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.07)" />
        <XAxis dataKey="day" tick={{ fill: 'rgba(0,0,0,0.6)', fontSize: 12 }} />
        <YAxis domain={[1, 5]} tick={{ fill: 'rgba(0,0,0,0.6)', fontSize: 12 }} width={36} allowDecimals={false} />
        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)' }} />
        <Line type="monotone" dataKey="score" stroke="#FF6B6B" strokeWidth={3} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
