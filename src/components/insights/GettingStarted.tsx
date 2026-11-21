import { CheckCircle2, Clock } from 'lucide-react'
import type { ReactNode } from 'react'

import type { EarlyLook, Insight, InsightStatus } from '../../api/insights'
import type { MoodModel } from '../../api/ml'
import { formatMinutesToHM, formatNumber } from '../../utils/format'

// Before the Insights page has results, one card says what unlocks when,
// using the same numbers the server uses, so it never contradicts itself:
//   1. Patterns in your own days: tested once a pair has 14 days with both logged.
//   2. What helps you: the mood model. It needs 5 mood days from you, and it
//      learns from everyone's data, so it also waits for enough people.

type StepState = 'done' | 'waiting' | 'progress'

function Step({ n, state, title, children, progress }: {
  n: number
  state: StepState
  title: string
  children: ReactNode
  /** 0..1, shown while in progress */
  progress?: number
}) {
  return (
    <li className="flex gap-3.5">
      <span className="flex-shrink-0 mt-0.5">
        {state === 'done' ? <CheckCircle2 size={24} className="text-lp-primary" aria-label="Done" />
          : state === 'waiting' ? <Clock size={24} className="text-amber-500" aria-label="Waiting" />
          : <span className="w-6 h-6 rounded-full border-2 border-ui-line/25 text-[12px] font-bold text-ui-muted flex items-center justify-center" aria-hidden>{n}</span>}
      </span>
      <div className="min-w-0 flex-1 pb-5 border-b border-ui-line/[0.08] last:border-0 last:pb-0">
        <div className="text-[15px] font-semibold text-ui-ink">{title}</div>
        <div className="mt-0.5 text-[13.5px] leading-relaxed text-ui-muted">{children}</div>
        {state === 'progress' && progress !== undefined && (
          <div className="mt-2.5 h-1.5 rounded-full bg-ui-line/[0.08] overflow-hidden max-w-sm">
            <div className="h-full rounded-full bg-lp-primary transition-[width] duration-500" style={{ width: `${Math.round(Math.min(1, progress) * 100)}%` }} />
          </div>
        )}
      </div>
    </li>
  )
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function GettingStarted({ insights, status, model, early }: {
  insights: Insight[]
  status: InsightStatus | null
  model: MoodModel | null
  early: EarlyLook | null
}) {
  const patternsFound = insights.length
  const best = status?.nextUp[0]
  const minDays = status?.minDays ?? 14
  const moodReady = (model?.effects.length ?? 0) > 0
  const moodDays = model?.moodDays ?? 0
  const minMood = model?.minMoodDays ?? 5
  const waitingFor = model?.waitingFor ?? (moodReady ? null : moodDays < minMood ? 'you' : 'tonight')
  const areas = status?.areas.filter((a) => a.days > 0) ?? []

  return (
    <section className="lp-card rounded-3xl p-6 max-sm:p-5" aria-label="Getting started with insights">
      <h2 className="text-[17px] font-bold text-ui-ink">Getting to know your patterns</h2>
      <p className="text-[13.5px] text-ui-muted mt-1">
        {early && early.daysLogged > 0
          ? `You've logged on ${early.daysLogged} day${early.daysLogged === 1 ? '' : 's'} so far. Two things unlock as you keep going.`
          : 'Two things unlock as you log your days.'}
      </p>

      <ol className="mt-5 space-y-5">
        <Step n={1} title="Patterns in your own days"
          state={patternsFound > 0 ? 'done' : best ? 'progress' : 'waiting'}
          progress={best ? best.pairedDays / minDays : undefined}>
          {patternsFound > 0
            ? `Found ${patternsFound}. ${patternsFound === 1 ? "It's" : "They're"} below.`
            : best
              ? <>{best.label}: <b className="text-ui-ink tabular-nums">{best.pairedDays} of {minDays}</b> days with both logged. {best.message}</>
              : `You have enough days. Nothing stands out clearly yet. LivoraPulse checks again every night.`}
        </Step>

        <Step n={2} title="What helps you"
          state={moodReady ? 'done' : waitingFor === 'you' ? 'progress' : 'waiting'}
          progress={moodDays / minMood}>
          {moodReady
            ? "Ready. It's below."
            : waitingFor === 'you'
              ? <>Mood logged on <b className="text-ui-ink tabular-nums">{moodDays} of {minMood}</b> days. Log your mood on {minMood - moodDays} more day{minMood - moodDays === 1 ? '' : 's'}.</>
              : waitingFor === 'people'
                ? <>Your part is done: <b className="text-ui-ink tabular-nums">{moodDays}</b> mood days logged. This one compares your days with other people's, so it starts once more people are logging. It's checked every night.</>
                : <>Your part is done: <b className="text-ui-ink tabular-nums">{moodDays}</b> mood days logged. Your first results come after tonight's update.</>}
        </Step>
      </ol>

      {areas.length > 0 && (
        <div className="mt-6 pt-4 border-t border-ui-line/[0.08]">
          <div className="text-[12px] font-semibold text-ui-muted mb-2">Days logged in the last {status?.windowDays ?? 90} days</div>
          <dl className="flex flex-wrap gap-x-5 gap-y-1.5 text-[13px]">
            {areas.map((a) => (
              <div key={a.area} className="flex items-baseline gap-1.5">
                <dt className="text-ui-muted">{cap(a.label)}</dt>
                <dd className="font-semibold text-ui-ink tabular-nums">{a.days}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  )
}

/** "Your days so far": the person's own numbers, plainly, before anything is tested */
export function EarlyLookCard({ early }: { early: EarlyLook }) {
  const a = early.averages
  const tiles = [
    a.sleepMinutes && { label: 'Sleep', value: formatMinutesToHM(Math.round(a.sleepMinutes.value)), note: `average over ${a.sleepMinutes.days} nights` },
    a.mood && { label: 'Mood', value: `${a.mood.value.toFixed(1)} / 5`, note: `average over ${a.mood.days} days` },
    a.stress && { label: 'Stress', value: `${a.stress.value.toFixed(1)} / 5`, note: `average over ${a.stress.days} days` },
    a.steps && { label: 'Steps', value: formatNumber(Math.round(a.steps.value)), note: `average over ${a.steps.days} walk days` },
  ].filter(Boolean) as Array<{ label: string; value: string; note: string }>
  if (tiles.length === 0) return null

  return (
    <section className="lp-card rounded-3xl p-6 max-sm:p-5" aria-label="Your days so far">
      <h2 className="text-[17px] font-bold text-ui-ink">Your days so far</h2>
      <p className="text-[13px] text-ui-muted mt-1">Your own numbers, as logged. Nothing here is estimated.</p>

      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-x-6">
        {tiles.map((t) => (
          <div key={t.label} className="pt-3 pb-1 border-t border-ui-line/[0.1]">
            <div className="text-[12px] text-ui-muted">{t.label}</div>
            <div className="text-[19px] font-bold text-ui-ink tabular-nums leading-tight">{t.value}</div>
            <div className="text-[11.5px] text-ui-muted">{t.note}</div>
          </div>
        ))}
      </div>

      {early.comparisons.length > 0 && (
        <div className="mt-5 space-y-4">
          {early.comparisons.map((c) => {
            const max = 5
            return (
              <div key={c.key}>
                <div className="text-[13.5px] font-semibold text-ui-ink">{c.title}</div>
                <div className="mt-2 space-y-1.5">
                  {[c.b, c.a].map((g, i) => (
                    <div key={g.label} className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[220px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 text-[12.5px]">
                      <span className="text-ui-muted truncate">{g.label}</span>
                      <span className="hidden sm:block h-2 rounded-full bg-ui-line/[0.08] overflow-hidden">
                        <span className="block h-full rounded-full" style={{ width: `${(g.value / max) * 100}%`, background: i === 0 ? 'rgb(var(--lp-primary))' : 'rgb(var(--ui-muted) / 0.5)' }} />
                      </span>
                      <span className="text-ui-ink font-semibold tabular-nums text-right">{g.value.toFixed(1)} <span className="font-normal text-ui-muted">· {g.days} days</span></span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <p className="mt-5 text-[12px] text-ui-muted leading-relaxed">
        A handful of days can go either way. LivoraPulse only calls something a pattern once it holds up on {14} or more days of your logs.
      </p>
    </section>
  )
}
