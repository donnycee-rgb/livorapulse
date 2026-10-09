import { AlertTriangle, Activity, Heart, Moon, Smile } from 'lucide-react'
import type { ReactNode } from 'react'

import type { HealthSummary, MetricKey, MetricSummary } from '../api/summary'
import { formatNumber } from '../utils/format'

// Renders a HealthSummary. Used for the user's own preview and for the
// public shared link, so both show exactly the same thing. All sentences
// come from the backend; this only lays them out.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export function formatDateLong(key: string): string {
  const [y, m, d] = key.slice(0, 10).split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

const META: Record<MetricKey, { title: string; unit: string; color: string; Icon: typeof Moon }> = {
  sleep: { title: 'Sleep', unit: 'a night', color: '#6366F1', Icon: Moon },
  mood: { title: 'Mood', unit: 'out of 5', color: '#FFA500', Icon: Smile },
  stress: { title: 'Stress', unit: 'out of 5', color: '#FF6B6B', Icon: Heart },
  walks: { title: 'Walks', unit: 'on walk days', color: '#4CAF50', Icon: Activity },
}

/** Matches the backend's formatMinutes, so the big number reads the same as the sentence under it */
function formatSleep(min: number): string {
  const m = Math.round(min / 5) * 5
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest === 0 ? `${h}h` : `${h}h ${rest}m`
}

function formatValue(key: MetricKey, v: number): string {
  if (key === 'sleep') return formatSleep(v)
  if (key === 'walks') return `${formatNumber(Math.round(v / 100) * 100)} steps`
  return v.toFixed(1)
}

function MetricCard({ k, m }: { k: MetricKey; m: MetricSummary }) {
  const meta = META[k]
  const values = m.weekly.map((w) => w.value)
  const top = k === 'mood' || k === 'stress' ? 5 : Math.max(1, ...values.filter((v): v is number => v !== null))
  return (
    <div className="rounded-2xl p-4 border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-slate-950 break-inside-avoid">
      <div className="flex items-center gap-2 text-xs font-bold text-black/50 dark:text-white/45 uppercase tracking-wider">
        <meta.Icon size={14} style={{ color: meta.color }} /> {meta.title}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-black text-black/85 dark:text-white/90">{m.average === null ? '–' : formatValue(k, m.average)}</span>
        {m.average !== null && <span className="text-xs text-black/45 dark:text-white/40">{meta.unit}</span>}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-black/65 dark:text-white/60">{m.text}</p>
      <div className="mt-3">
        <div className="text-[10px] text-black/35 dark:text-white/30 mb-1">Weekly averages</div>
        <div className="flex items-end gap-1 h-8" aria-hidden>
          {values.map((v, i) => (
            <div key={i} className="flex-1 h-full rounded-sm bg-black/[0.05] dark:bg-white/[0.06] flex items-end overflow-hidden">
              {v !== null && <div className="w-full rounded-sm" style={{ height: `${Math.max(4, (v / top) * 100)}%`, backgroundColor: meta.color }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h3 className="text-sm font-bold text-black/80 dark:text-white/85 mb-1.5">{title}</h3>
      {children}
    </section>
  )
}

export default function HealthSummaryView({ summary }: { summary: HealthSummary }) {
  const s = summary
  const who = [s.person.name, s.person.age !== null ? `${s.person.age} years` : null, s.person.sex].filter(Boolean).join(' · ')

  return (
    <div className="space-y-5">
      <div>
        <div className="text-lg font-black text-black/85 dark:text-white/90">{who}</div>
        <div className="text-xs text-black/45 dark:text-white/40 mt-0.5">
          {formatDateLong(s.period.from)} – {formatDateLong(s.period.to)} ({s.period.days} days) · Generated {formatDateLong(s.generatedAt)}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200 text-sm font-semibold">
        <AlertTriangle size={15} className="flex-shrink-0" /> {s.disclaimer}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {(['sleep', 'mood', 'stress', 'walks'] as const).map((k) => <MetricCard key={k} k={k} m={s[k]} />)}
      </div>

      {s.cycle && (
        <Section title="Menstrual cycle">
          <p className="text-sm leading-relaxed text-black/70 dark:text-white/65">{s.cycle.text}</p>
        </Section>
      )}

      {s.flags.length > 0 && (
        <Section title="Worth discussing">
          <ul className="space-y-2">
            {s.flags.map((f) => (
              <li key={f.title} className="text-sm text-black/70 dark:text-white/65">
                <span className="font-semibold text-black/80 dark:text-white/80">{f.title}.</span> {f.detail}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {s.insights.length > 0 && (
        <Section title="Patterns in their own logs (links, not proven causes)">
          <ul className="list-disc pl-5 space-y-1">
            {s.insights.map((t) => <li key={t} className="text-sm leading-relaxed text-black/70 dark:text-white/65">{t}</li>)}
          </ul>
        </Section>
      )}

      {s.notes && s.notes.length > 0 && (
        <Section title="Notes written by the user">
          <ul className="space-y-2">
            {s.notes.map((n, i) => (
              <li key={i} className="text-sm text-black/70 dark:text-white/65">
                <span className="text-xs font-semibold text-black/45 dark:text-white/40">{formatDateLong(n.date)} · {n.area}</span>
                <div className="leading-relaxed">{n.text}</div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <p className="text-[11px] text-black/35 dark:text-white/30">
        Values are entered by the user in the LivoraPulse app and have not been clinically verified.
      </p>
    </div>
  )
}
