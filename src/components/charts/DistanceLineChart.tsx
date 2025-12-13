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
  data: Array<{ day: string; km: number }>
}

export default function DistanceLineChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ left: 6, right: 6, top: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.07)" />
        <XAxis dataKey="day" tick={{ fill: 'rgba(0,0,0,0.6)', fontSize: 12 }} />
        <YAxis tick={{ fill: 'rgba(0,0,0,0.6)', fontSize: 12 }} width={36} />
        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)' }} />
        <Line type="monotone" dataKey="km" stroke="#1E3A8A" strokeWidth={3} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
