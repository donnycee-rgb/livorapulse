import { Activity, Leaf, MonitorSmartphone, Smile, Timer } from 'lucide-react'

import Card from '../components/Card'
import Highlights from '../components/Highlights'
import StatCard from '../components/StatCard'
import ScoreRing from '../components/charts/ScoreRing'

import { useAppStore } from '../store/useAppStore'
import { selectDailyInsight, selectLifePulseScore } from '../store/selectors'
import { formatDistance, formatMinutesToHM, formatNumber } from '../utils/format'
import { getDayKey } from '../utils/date'

function toneForSteps(steps: number) {
  if (steps >= 8000) return 'good' as const
  if (steps >= 5500) return 'neutral' as const
  return 'alert' as const
}

function toneForScreen(minutes: number) {
  if (minutes <= 150) return 'good' as const
  if (minutes <= 210) return 'neutral' as const
  return 'alert' as const
}

function toneForStress(score: number) {
  if (score <= 2) return 'good' as const
  if (score <= 3) return 'neutral' as const
  return 'alert' as const
}

export default function Dashboard() {
  const units = useAppStore((s) => s.preferences.units)
  const lastUpdatedAt = useAppStore((s) => s.meta.lastUpdatedAt)

  const score = useAppStore(selectLifePulseScore)
  const insight = useAppStore(selectDailyInsight)

  const day = getDayKey()
  const steps = useAppStore((s) => s.physical.weeklySteps.find((x) => x.day === day)?.steps ?? 0)
  const distanceKm = useAppStore((s) => s.physical.weeklyDistanceKm.find((x) => x.day === day)?.km ?? 0)
  const calories = useAppStore((s) => s.physical.weeklyCaloriesKcal.find((x) => x.day === day)?.kcal ?? 0)

  const screenMin = useAppStore((s) => s.digital.weeklyScreenTimeMin.find((x) => x.day === day)?.minutes ?? 0)
  const socialMin = useAppStore((s) => s.digital.appUsageCategoriesMin.find((x) => x.category === 'Social')?.minutes ?? 0)
  const productiveMin = useAppStore((s) => s.digital.appUsageCategoriesMin.find((x) => x.category === 'Productive')?.minutes ?? 0)

  const focusMin = useAppStore((s) => s.productivity.focusMinutesByDay.find((x) => x.day === day)?.minutes ?? 0)
  const studySessions = useAppStore((s) => s.productivity.studySessionsByDay.find((x) => x.day === day)?.sessions ?? 0)

  const recycledItems = useAppStore((s) => s.environment.recycledItemsByDay.find((x) => x.day === day)?.items ?? 0)
  const transportMode = useAppStore((s) => s.environment.transportMode)
  const moodEmoji = useAppStore((s) => s.mood.today.emoji)
  const stressScore = useAppStore((s) => s.mood.today.stressScore)

  const highlights = [
    { label: 'Steps', value: formatNumber(steps), tone: toneForSteps(steps) },
    { label: 'Screen Time', value: formatMinutesToHM(screenMin), tone: toneForScreen(screenMin) },
    { label: 'Stress', value: `${stressScore}/5`, tone: toneForStress(stressScore) },
  ]

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="flex items-center gap-4">
            <ScoreRing value={score} />

            <div>
              <div className="text-sm font-semibold text-black/60 dark:text-white/60">Life Pulse Score</div>
              <div className="mt-2 text-xl md:text-2xl font-bold text-lp-secondary dark:text-white">
                {insight}
              </div>
              <div className="mt-2 text-sm text-black/60 dark:text-white/60">
                Updated {new Date(lastUpdatedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-lp-secondary/5 dark:bg-white/5 p-4">
            <div className="text-xs font-semibold text-black/55 dark:text-white/55">Today’s focus</div>
            <div className="mt-1 text-sm font-semibold text-black/85 dark:text-white/90">
              Keep momentum with one small improvement.
            </div>
            <div className="mt-2 text-xs text-black/55 dark:text-white/55">
              Add an activity, start a focus session, or log an eco action.
            </div>
          </div>
        </div>
      </Card>

      <Highlights items={highlights} />

      <div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-sm font-semibold text-black/85 dark:text-white/90">Quick Stats</div>
            <div className="text-xs text-black/55 dark:text-white/55 mt-0.5">Tap any card to open details</div>
          </div>
          <div className="hidden md:block text-xs text-black/50 dark:text-white/50">Tooltips available on charts</div>
        </div>

        <div className="mt-3 md:mt-4 -mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto no-scrollbar">
          <div className="flex md:grid md:grid-cols-3 lg:grid-cols-4 gap-3 min-w-max md:min-w-0">
            <StatCard to="/physical" title="Physical" subtitle="Steps" value={formatNumber(steps)} Icon={Activity} tone="primary" />
            <StatCard to="/physical" title="Physical" subtitle="Distance" value={formatDistance(distanceKm, units)} Icon={Activity} tone="accent" />
            <StatCard to="/physical" title="Physical" subtitle="Calories" value={`${calories} kcal`} Icon={Activity} tone="secondary" />

            <StatCard to="/digital" title="Digital" subtitle="Screen time" value={formatMinutesToHM(screenMin)} Icon={MonitorSmartphone} tone="alert" />
            <StatCard to="/digital" title="Digital" subtitle="Social" value={formatMinutesToHM(socialMin)} Icon={MonitorSmartphone} tone="secondary" />
            <StatCard to="/digital" title="Digital" subtitle="Productive" value={formatMinutesToHM(productiveMin)} Icon={MonitorSmartphone} tone="primary" />

            <StatCard to="/productivity" title="Productivity" subtitle="Focus minutes" value={`${focusMin} min`} Icon={Timer} tone="secondary" />
            <StatCard to="/productivity" title="Productivity" subtitle="Study sessions" value={`${studySessions}`} Icon={Timer} tone="accent" />

            <StatCard to="/environment" title="Environment" subtitle="Recycled items" value={`${recycledItems}`} Icon={Leaf} tone="primary" />
            <StatCard to="/environment" title="Environment" subtitle="Transport" value={transportMode} Icon={Leaf} tone="secondary" />

            <StatCard to="/mood" title="Mood" subtitle="Mood" value={moodEmoji} Icon={Smile} tone="accent" />
            <StatCard to="/mood" title="Mood" subtitle="Stress" value={`${stressScore}/5`} Icon={Smile} tone={stressScore >= 4 ? 'alert' : 'primary'} />
          </div>
        </div>
      </div>
    </div>
  )
}
