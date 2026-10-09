import { ArrowRight, Lightbulb, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { Insight, InsightStatus } from '../api/insights'
import { fetchInsights, fetchInsightStatus } from '../api/insights'
import { ComparisonBars } from './InsightCard'

/**
 * Dashboard card: the strongest insight, or — before there are any — how
 * close the user is to their first one. Also the way into the Insights page
 * on phones, where the side nav is hidden.
 */
export default function TopInsightCard() {
  const navigate = useNavigate()
  const [top, setTop] = useState<Insight | null>(null)
  const [status, setStatus] = useState<InsightStatus | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchInsights()
      .then(async (list) => {
        if (cancelled) return
        if (list.length > 0) {
          setTop(list[0])
        } else {
          const s = await fetchInsightStatus()
          if (!cancelled) setStatus(s)
        }
      })
      .catch(() => null) // the dashboard works without it
      .finally(() => { if (!cancelled) setLoaded(true) })
    return () => { cancelled = true }
  }, [])

  if (!loaded || (!top && !status)) return null

  const next = status?.nextUp[0]

  return (
    <button
      type="button"
      onClick={() => navigate('/insights')}
      className="w-full text-left rounded-3xl p-5 max-sm:p-4 transition hover:shadow-card group"
      style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(76,175,80,0.05) 100%)',
        border: '1px solid rgba(99,102,241,0.15)',
      }}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#6366F1]/15 flex items-center justify-center">
            {top ? <Lightbulb size={14} className="text-[#6366F1]" /> : <Sparkles size={14} className="text-[#6366F1]" />}
          </div>
          <span className="text-[10px] font-bold text-black/40 dark:text-white/35 uppercase tracking-wider">
            {top ? 'Top insight' : 'Insights'}
          </span>
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold text-[#6366F1]">
          {top ? 'See all' : 'See progress'}
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>

      {top ? (
        <div className="grid md:grid-cols-[1fr_260px] gap-4 items-center">
          <p className="text-sm leading-relaxed text-black/75 dark:text-white/80">{top.text}</p>
          <ComparisonBars comparison={top.comparison} />
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-black/60 dark:text-white/55">
          {next?.message ?? 'Looking for patterns in your data — nothing clear enough to show yet.'}
        </p>
      )}
    </button>
  )
}
