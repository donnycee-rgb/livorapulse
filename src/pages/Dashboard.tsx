import {
  Activity,
  Leaf,
  MonitorSmartphone,
  Smile,
  Timer,
} from 'lucide-react'

import Card from '../components/Card'
import Highlights from '../components/Highlights'
import StatCard from '../components/StatCard'
import ScoreRing from '../components/charts/ScoreRing'
import { useAppData } from '../context/AppDataContext'
import { formatMinutesToHM, formatNumber } from '../utils/format'

export default function Dashboard() {
  const { data } = useAppData()

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Top score card */}
      <Card className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <ScoreRing value={data.dashboard.lifeFootprintScore} />

            <div>
              <div className="text-sm font-semibold text-black/60">Main Life Footprint Score</div>
              <div className="mt-2 text-xl md:text-2xl font-bold text-lp-secondary">
                {data.dashboard.dailySummary}
              </div>
              <div className="mt-2 text-sm text-black/60">
                Tip: Tap any card below to open its detailed module.
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-black/5 bg-lp-primary/10 p-4">
            <div className="text-xs font-semibold text-black/55">Status</div>
            <div className="mt-1 text-sm font-semibold">Prototype / Dummy Data</div>
            <div className="mt-2 text-xs text-black/55">
              All interactions update local state only.
            </div>
          </div>
        </div>
      </Card>

      <Highlights items={data.dashboard.highlights} />

      {/* Quick stats */}
      <div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-sm font-semibold">Quick Stats</div>
            <div className="text-xs text-black/55 mt-0.5">Physical, digital, productivity, environment, mood</div>
          </div>
          <div className="hidden md:block text-xs text-black/50">Hover for tooltips inside charts</div>
        </div>

        {/* Mobile: horizontal scroll. Desktop: grid. */}
        <div className="mt-3 md:mt-4 -mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto no-scrollbar">
          <div className="flex md:grid md:grid-cols-3 lg:grid-cols-4 gap-3 min-w-max md:min-w-0">
            {/* Physical */}
            <StatCard
              to="/physical"
              title="Physical"
              subtitle="Steps"
              value={formatNumber(data.physical.today.steps)}
              Icon={Activity}
              tone="primary"
            />
            <StatCard
              to="/physical"
              title="Physical"
              subtitle="Distance"
              value={`${data.physical.today.distanceKm.toFixed(1)} km`}
              Icon={Activity}
              tone="accent"
            />
            <StatCard
              to="/physical"
              title="Physical"
              subtitle="Calories"
              value={`${data.physical.today.caloriesKcal} kcal`}
              Icon={Activity}
              tone="secondary"
            />

            {/* Digital */}
            <StatCard
              to="/digital"
              title="Digital"
              subtitle="Screen time"
              value={formatMinutesToHM(data.digital.today.screenTimeMin)}
              Icon={MonitorSmartphone}
              tone="alert"
            />
            <StatCard
              to="/digital"
              title="Digital"
              subtitle="Social time"
              value={formatMinutesToHM(data.digital.today.socialMin)}
              Icon={MonitorSmartphone}
              tone="secondary"
            />
            <StatCard
              to="/digital"
              title="Digital"
              subtitle="Productive"
              value={formatMinutesToHM(data.digital.today.productiveMin)}
              Icon={MonitorSmartphone}
              tone="primary"
            />

            {/* Productivity */}
            <StatCard
              to="/productivity"
              title="Productivity"
              subtitle="Focus minutes"
              value={`${data.productivity.today.focusMin} min`}
              Icon={Timer}
              tone="secondary"
            />
            <StatCard
              to="/productivity"
              title="Productivity"
              subtitle="Study sessions"
              value={`${data.productivity.today.studySessions}`}
              Icon={Timer}
              tone="accent"
            />

            {/* Environment */}
            <StatCard
              to="/environment"
              title="Environment"
              subtitle="Recycled items"
              value={`${data.environment.today.recycledItems}`}
              Icon={Leaf}
              tone="primary"
            />
            <StatCard
              to="/environment"
              title="Environment"
              subtitle="Transport"
              value={data.environment.today.transportMode}
              Icon={Leaf}
              tone="secondary"
            />
            <StatCard
              to="/environment"
              title="Environment"
              subtitle="Electricity"
              value={`${data.environment.today.electricityKwh.toFixed(1)} kWh`}
              Icon={Leaf}
              tone="accent"
            />

            {/* Mood */}
            <StatCard
              to="/mood"
              title="Mood"
              subtitle="Emoji"
              value={data.mood.today.emoji}
              Icon={Smile}
              tone="accent"
            />
            <StatCard
              to="/mood"
              title="Mood"
              subtitle="Stress"
              value={`${data.mood.today.stressScore}/5`}
              Icon={Smile}
              tone={data.mood.today.stressScore >= 4 ? 'alert' : 'primary'}
            />
          </div>
        </div>

        {/* Small note */}
        <div className="mt-3 text-xs text-black/55">
          Modules are interactive (emoji selection, simulated focus + eco actions) — no backend required.
        </div>
      </div>
    </div>
  )
}
