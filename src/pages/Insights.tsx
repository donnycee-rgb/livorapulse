import { Lightbulb, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { ExperimentList } from '../api/experiments'
import { fetchExperiments } from '../api/experiments'
import type { Insight, InsightStatus } from '../api/insights'
import { fetchInsights, fetchInsightStatus } from '../api/insights'
import { ActiveExperimentCard, PastExperimentCard } from '../components/ExperimentCard'
import InsightCard from '../components/InsightCard'
import Skeleton from '../components/ui/Skeleton'

/** Shown until the first insights appear: what's been logged and what's still needed */
function ProgressPanel({ status }: { status: InsightStatus }) {
  const next = status.nextUp[0]
  const areas = status.areas.filter((a) => a.days > 0)

  return (
    <div
      className="rounded-3xl p-6 max-sm:p-4"
      style={{
        background: 'linear-gradient(135deg, rgba(76,175,80,0.10) 0%, rgba(0,188,212,0.05) 100%)',
        border: '1px solid rgba(76,175,80,0.18)',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-lp-primary/15 flex items-center justify-center flex-shrink-0">
          <Sparkles size={18} className="text-lp-primary" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-black/80 dark:text-white/85">
            {next ? 'Your first insights are on the way' : 'Looking for patterns'}
          </div>
          <p className="text-sm text-black/55 dark:text-white/50 mt-1 leading-relaxed">
            {next
              ? next.message
              : `You have enough data. Nothing stands out strongly enough yet — LivoraPulse only shows a pattern when it's clear in your last ${status.windowDays} days. Keep logging and check back.`}
          </p>
        </div>
      </div>

      {status.nextUp.length > 0 && (
        <div className="mt-5 space-y-3">
          {status.nextUp.map((n) => {
            const done = status.minDays - n.daysNeeded
            return (
              <div key={n.key}>
                <div className="flex items-baseline justify-between gap-3 text-xs mb-1">
                  <span className="text-black/55 dark:text-white/50">{n.label}</span>
                  <span className="font-semibold tabular-nums text-black/70 dark:text-white/75 flex-shrink-0">
                    {done} / {status.minDays} days
                  </span>
                </div>
                <div className="h-2 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
                  <div className="h-full rounded-full bg-lp-primary" style={{ width: `${(done / status.minDays) * 100}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {areas.length > 0 && (
        <div className="mt-5">
          <div className="text-[10px] font-bold text-black/35 dark:text-white/30 uppercase tracking-wider mb-2">
            Days logged in the last {status.windowDays} days
          </div>
          <div className="flex flex-wrap gap-2">
            {areas.map((a) => (
              <span key={a.area} className="text-xs rounded-full px-2.5 py-1 bg-black/[0.05] dark:bg-white/[0.07] text-black/60 dark:text-white/60">
                {a.label} · <span className="font-semibold tabular-nums">{a.days}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Insights() {
  const [insights, setInsights] = useState<Insight[] | null>(null)
  const [status, setStatus] = useState<InsightStatus | null>(null)
  const [failed, setFailed] = useState(false)
  const [experiments, setExperiments] = useState<ExperimentList>({ active: null, past: [] })

  useEffect(() => {
    let cancelled = false
    // Experiments are extra: if they fail to load, insights still show
    Promise.all([fetchInsights(), fetchInsightStatus(), fetchExperiments().catch((): ExperimentList => ({ active: null, past: [] }))])
      .then(([list, s, exps]) => {
        if (cancelled) return
        setInsights(list)
        setStatus(s)
        setExperiments(exps)
      })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [])

  const loading = insights === null && !failed

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-black/85 dark:text-white/90">Insights</h1>
        <p className="text-sm text-black/45 dark:text-white/40 mt-0.5 max-w-lg">
          Patterns found in your own data across sleep, mood, activity, screen time and more. Each one shows the numbers behind it.
        </p>
      </div>

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      )}

      {failed && (
        <div className="rounded-3xl p-5 border border-black/10 dark:border-white/10 text-sm text-black/60 dark:text-white/55">
          Couldn't load your insights. Check your connection and try again.
        </div>
      )}

      {experiments.active && <ActiveExperimentCard exp={experiments.active} onChange={setExperiments} />}

      {insights && insights.length === 0 && status && <ProgressPanel status={status} />}

      {insights && insights.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-4">
          {insights.map((i) => (
            <InsightCard
              key={i.id}
              insight={i}
              onDismissed={(id) => setInsights((list) => list?.filter((x) => x.id !== id) ?? null)}
              runningExperimentKey={experiments.active?.insightKey ?? null}
              onExperimentStarted={setExperiments}
            />
          ))}
        </div>
      )}

      {experiments.past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-black/70 dark:text-white/75">Past experiments</h2>
          {experiments.past.map((e) => <PastExperimentCard key={e.id} exp={e} />)}
        </div>
      )}

      {insights && insights.length > 0 && (
        <div className="flex items-start gap-2 text-xs text-black/40 dark:text-white/35 max-w-2xl">
          <Lightbulb size={14} className="flex-shrink-0 mt-0.5" />
          <span>
            These are links in your logs, not proven causes. Insights update every night. Tap "Not true for me" to hide one,
            or try a change for 14 days to see if it helps you.
          </span>
        </div>
      )}
    </div>
  )
}
