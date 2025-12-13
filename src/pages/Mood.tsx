import Card from '../components/Card'
import ChartCard from '../components/charts/ChartCard'
import MoodTimelineChart from '../components/charts/MoodTimelineChart'
import StressLineChart from '../components/charts/StressLineChart'
import { useAppData } from '../context/AppDataContext'
import type { MoodEmoji } from '../data/dummyData'

const EMOJIS: MoodEmoji[] = ['😄', '🙂', '😐', '😕', '😣']

export default function Mood() {
  const { data, setTodayMood, setTodayStress } = useAppData()

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <div className="text-lg font-bold text-lp-secondary">Mood</div>
        <div className="text-sm text-black/60">Emoji mood + stress (dummy data)</div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">Today’s Mood</div>
            <div className="text-xs text-black/55 mt-0.5">Tap an emoji to update local dummy state</div>

            <div className="mt-3 flex items-center gap-2">
              {EMOJIS.map((e) => {
                const active = data.mood.today.emoji === e
                return (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setTodayMood(e)}
                    className={
                      'h-11 w-11 rounded-xl border text-xl flex items-center justify-center transition ' +
                      (active
                        ? 'bg-lp-accent/15 border-lp-accent/30'
                        : 'bg-white border-black/10 hover:bg-black/5')
                    }
                    aria-label={`Set mood to ${e}`}
                  >
                    {e}
                  </button>
                )
              })}

              <div className="ml-2 text-sm text-black/60">
                Selected: <span className="font-semibold">{data.mood.today.emoji}</span>
              </div>
            </div>
          </div>

          <div className="min-w-[240px]">
            <div className="text-sm font-semibold">Stress</div>
            <div className="text-xs text-black/55 mt-0.5">1 (low) → 5 (high)</div>

            <div className="mt-3 flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={data.mood.today.stressScore}
                onChange={(e) => setTodayStress(Number(e.target.value))}
                className="w-full"
                aria-label="Stress level"
              />
              <div className={
                'h-10 w-12 rounded-xl flex items-center justify-center font-bold border ' +
                (data.mood.today.stressScore >= 4
                  ? 'bg-lp-alert/15 text-lp-alert border-lp-alert/30'
                  : 'bg-lp-primary/10 text-lp-secondary border-black/10')
              }>
                {data.mood.today.stressScore}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <ChartCard title="Mood Timeline" subtitle="Weekly mood emojis (tooltip)">
          <MoodTimelineChart data={data.mood.moodByDay} />
        </ChartCard>

        <ChartCard title="Stress Trend" subtitle="Line chart: stress score (1-5)">
          <StressLineChart data={data.mood.stressByDay} />
        </ChartCard>
      </div>

      <div className="text-xs text-black/55">
        Note: charts still display the original weekly dummy data; the “Today” controls update only today’s local state.
      </div>
    </div>
  )
}
