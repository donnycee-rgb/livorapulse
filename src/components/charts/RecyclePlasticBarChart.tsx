import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type Props = {
  recycled: Array<{ day: string; items: number }>
  plastic: Array<{ day: string; items: number }>
}

export default function RecyclePlasticBarChart({ recycled, plastic }: Props) {
  const merged = recycled.map((r) => ({
    day: r.day,
    recycled: r.items,
    plastic: plastic.find((p) => p.day === r.day)?.items ?? 0,
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={merged} margin={{ left: 6, right: 6, top: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.07)" />
        <XAxis dataKey="day" tick={{ fill: 'rgba(0,0,0,0.6)', fontSize: 12 }} />
        <YAxis tick={{ fill: 'rgba(0,0,0,0.6)', fontSize: 12 }} width={36} allowDecimals={false} />
        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)' }} />
        <Legend />
        <Bar dataKey="recycled" name="Recycled" fill="#4CAF50" radius={[10, 10, 10, 10]} />
        <Bar dataKey="plastic" name="Plastic" fill="#FF6B6B" radius={[10, 10, 10, 10]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
