import { Plus } from 'lucide-react'
import ChartCard from '../components/charts/ChartCard'
import RecyclePlasticBarChart from '../components/charts/RecyclePlasticBarChart'
import TransportModeChart from '../components/charts/TransportModeChart'
import Card from '../components/Card'
import { useAppData } from '../context/AppDataContext'

export default function Environment() {
  const { data, addRecycleItemToday } = useAppData()

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <div className="text-lg font-bold text-lp-secondary">Environment</div>
        <div className="text-sm text-black/60">Eco habits and transport modes (dummy data)</div>
      </div>

      <Card className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Eco Habit Simulator</div>
          <div className="text-xs text-black/55 mt-0.5">
            Tap to simulate adding recycled items (updates local state only).
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-lp-primary text-white px-3 py-2 text-sm font-semibold shadow-card hover:opacity-95 active:scale-[0.98] transition"
          onClick={() => addRecycleItemToday(1)}
        >
          <Plus size={18} />
          Add recycled item
        </button>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <ChartCard title="Recycling vs Plastic" subtitle="Grouped bars: items per day">
          <RecyclePlasticBarChart
            recycled={data.environment.recycledItemsByDay}
            plastic={data.environment.plasticUsageByDay}
          />
        </ChartCard>

        <ChartCard title="Transport Mode" subtitle="Pie chart: trips split">
          <TransportModeChart data={data.environment.transportModeSplit} />
        </ChartCard>
      </div>

      <div className="text-xs text-black/55">
        Today’s recycled items (local state): <span className="font-semibold">{data.environment.today.recycledItems}</span>
      </div>
    </div>
  )
}
