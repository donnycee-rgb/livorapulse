import { Plus } from 'lucide-react'
import ChartCard from '../components/charts/ChartCard'
import FocusTimelineChart from '../components/charts/FocusTimelineChart'
import StudySessionsBarChart from '../components/charts/StudySessionsBarChart'
import { useAppData } from '../context/AppDataContext'

export default function Productivity() {
  const { data, addFocusSession } = useAppData()

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-bold text-lp-secondary">Productivity</div>
          <div className="text-sm text-black/60">Focus sessions + study sessions (dummy data)</div>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-lp-secondary text-white px-3 py-2 text-sm font-semibold shadow-card hover:opacity-95 active:scale-[0.98] transition"
          onClick={() => {
            // Simulate adding a new focus session (local-only state).
            // Keep it simple: add a 45min block starting at 18:00 on Fri.
            addFocusSession({ day: 'Fri', startHour: 18, durationHours: 0.75 })
          }}
        >
          <Plus size={18} />
          Add focus session
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <ChartCard
          title="Focus Session Timeline"
          subtitle="Horizontal bars: start hour + duration (hours)"
        >
          <FocusTimelineChart sessions={data.productivity.focusTimeline} />
        </ChartCard>

        <ChartCard title="Study Sessions" subtitle="Bar chart: sessions per day">
          <StudySessionsBarChart data={data.productivity.studySessionsByDay} />
        </ChartCard>
      </div>

      <div className="text-xs text-black/55">
        This module simulates adding data (no backend) — refresh resets to the original dummy JSON.
      </div>
    </div>
  )
}
