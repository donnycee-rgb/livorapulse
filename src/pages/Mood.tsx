import toast from 'react-hot-toast'

import Card from '../components/Card'
import PageHero from '../components/PageHero'
import ChartCard from '../components/charts/ChartCard'
import MoodTimelineChart from '../components/charts/MoodTimelineChart'
import StressLineChart from '../components/charts/StressLineChart'

import type { MoodEmoji } from '../data/types'
import { useAppStore } from '../store/useAppStore'

const EMOJIS: MoodEmoji[] = ['😄', '🙂', '😐', '😕', '😣']

export default function Mood() {
  const mood = useAppStore((s) => s.mood)
  const setMoodEmoji = useAppStore((s) => s.setMoodEmoji)
  const setStressScore = useAppStore((s) => s.setStressScore)

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHero title="Mood & Mindset" subtitle="Track mood and stress trends." />

      <Card className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-black/80 dark:text-white/85">Mood</div>
            <div className="text-xs text-black/55 dark:text-white/55 mt-0.5">Tap an emoji to log how you feel</div>

            <div className="mt-3 flex items-center gap-2">
              {EMOJIS.map((e) => {
                const active = mood.today.emoji === e
                return (
                  <button
                    key={e}
                    type="button"
                    onClick={() => {
                      setMoodEmoji(e)
                      toast.success('Mood updated')
                    }}
                    className={
                      'h-11 w-11 rounded-xl border text-xl flex items-center justify-center ' +
                      'transition-transform transition-colors duration-200 ease-out hover:-translate-y-px ' +
                      (active
                        ? 'bg-lp-accent/15 border-lp-accent/30 shadow-[0_10px_25px_rgba(0,188,212,0.12)]'
                        : 'bg-white dark:bg-slate-900 border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10')
                    }
                    aria-label={`Set mood to ${e}`}
                  >
                    {e}
                  </button>
                )
              })}

              <div className="ml-2 text-sm text-black/60 dark:text-white/60">
                Selected: <span className="font-semibold">{mood.today.emoji}</span>
              </div>
            </div>
          </div>

          <div className="min-w-[260px]">
            <div className="text-sm font-semibold text-black/80 dark:text-white/85">Stress</div>
            <div className="text-xs text-black/55 dark:text-white/55 mt-0.5">1 (low) → 5 (high)</div>

            <div className="mt-3 flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={mood.today.stressScore}
                onChange={(e) => setStressScore(Number(e.target.value))}
                className="w-full"
                aria-label="Stress level"
              />
              <div
                className={
                  'h-10 w-12 rounded-xl flex items-center justify-center font-bold border ' +
                  (mood.today.stressScore >= 4
                    ? 'bg-lp-alert/15 text-lp-alert border-lp-alert/30'
                    : 'bg-lp-primary/10 text-lp-secondary dark:text-white border-black/10 dark:border-white/10')
                }
              >
                {mood.today.stressScore}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <ChartCard title="Mood timeline" subtitle="Weekly mood (hover for emoji)">
          <MoodTimelineChart data={mood.moodByDay} />
        </ChartCard>

        <ChartCard title="Stress trend" subtitle="Weekly stress score">
          <StressLineChart data={mood.stressByDay} />
        </ChartCard>
      </div>
    </div>
  )
}
