import ChartCard from '../components/charts/ChartCard'
import AppUsagePieChart from '../components/charts/AppUsagePieChart'
import ScreenTimeLineChart from '../components/charts/ScreenTimeLineChart'
import { useAppData } from '../context/AppDataContext'

export default function Digital() {
  const { data } = useAppData()

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <div className="text-lg font-bold text-lp-secondary">Digital</div>
        <div className="text-sm text-black/60">Screen time and app usage categories (dummy data)</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <ChartCard title="App Usage Categories" subtitle="Pie chart: social vs productive vs entertainment">
          <AppUsagePieChart data={data.digital.appUsageCategoriesMin} />
        </ChartCard>

        <ChartCard title="Screen Time Trend" subtitle="Line chart: minutes per day">
          <ScreenTimeLineChart data={data.digital.weeklyScreenTimeMin} />
        </ChartCard>
      </div>
    </div>
  )
}
