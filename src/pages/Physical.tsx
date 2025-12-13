import ChartCard from '../components/charts/ChartCard'
import DistanceLineChart from '../components/charts/DistanceLineChart'
import SleepAreaChart from '../components/charts/SleepAreaChart'
import StepsBarChart from '../components/charts/StepsBarChart'
import { useAppData } from '../context/AppDataContext'

export default function Physical() {
  const { data } = useAppData()

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <div className="text-lg font-bold text-lp-secondary">Physical</div>
        <div className="text-sm text-black/60">Movement, distance, and sleep (dummy data)</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <ChartCard title="Steps (Weekly)" subtitle="Bar chart: steps per day">
          <StepsBarChart data={data.physical.weeklySteps} />
        </ChartCard>

        <ChartCard title="Distance (Weekly)" subtitle="Line chart: km per day">
          <DistanceLineChart data={data.physical.weeklyDistanceKm} />
        </ChartCard>

        <div className="md:col-span-2">
          <ChartCard title="Sleep Summary" subtitle="Area chart: hours per night">
            <SleepAreaChart data={data.physical.sleepHours} />
          </ChartCard>
        </div>
      </div>
    </div>
  )
}
