import { useNavigate } from 'react-router-dom'
import { ArrowRight, Sun } from 'lucide-react'
import type { MoodModel } from '../api/ml'
import { describeEffect, describeForecast } from '../ml/moodWording'

/**
 * Today's mood outlook from the nightly model, plus the person's clearest
 * helpful habit as something to try. Shows nothing until there's a forecast.
 */
export default function TodayOutlookCard({ model }: { model: MoodModel | null }) {
  const navigate = useNavigate()
  if (!model?.forecast) return null

  const { title, body } = describeForecast(model.forecast.mean)
  const tip = model.effects
    .filter((e) => e.claim === 'personal')
    .map(describeEffect)
    .find((s) => s !== null)

  return (
    <section className="lp-card rounded-3xl p-5 flex items-start gap-4 max-sm:flex-col max-sm:gap-3">
      <span className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-500 flex items-center justify-center flex-shrink-0">
        <Sun size={18} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-black/40 dark:text-white/40">Today’s outlook</div>
        <h2 className="font-serif text-xl text-black/85 dark:text-white/90 leading-tight mt-0.5">{title}</h2>
        <p className="text-sm text-black/55 dark:text-white/55 mt-1 leading-relaxed">{body}</p>
        {tip && (
          <button type="button" onClick={() => navigate(tip.to)}
            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#2E7D32] dark:text-[#6FCF73] hover:underline text-left">
            {tip.tip} <ArrowRight size={14} className="flex-shrink-0" />
          </button>
        )}
      </div>
      <button type="button" onClick={() => navigate('/insights')}
        className="text-xs font-medium text-black/45 dark:text-white/45 hover:text-black/75 dark:hover:text-white/80 flex-shrink-0">
        What helps you
      </button>
    </section>
  )
}
