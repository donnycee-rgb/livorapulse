import {
  Activity, ArrowRight, BookOpen, Briefcase, CalendarDays, Droplets, Footprints, Leaf, MessageCircle, Moon,
  Smartphone, Smile, Sparkles, Timer, Tv, UtensilsCrossed, type LucideIcon,
} from 'lucide-react'

import type { Insight, InsightComparison } from '../../api/insights'
import { HABIT } from '../../theme/habits'
import { formatMinutesToHM, formatNumber } from '../../utils/format'

// The pieces that make an insight readable at a glance: which habit links to
// which outcome (two icons), and how big the gap between the two groups of
// days is (two dots on a scale, the gap highlighted, the difference as a number).

type Meta = { label: string; Icon: LucideIcon; rgb: string; hex: string }
const m = (label: string, Icon: LucideIcon, h: { rgb: string; hex: string }): Meta => ({ label, Icon, ...h })

const FEATURE: Record<string, Meta> = {
  sleepMinutes: m('Sleep', Moon, HABIT.sleep),
  steps: m('Steps', Footprints, HABIT.steps),
  screenMinutes: m('Screen time', Smartphone, HABIT.screen),
  socialMinutes: m('Social media', MessageCircle, HABIT.screen),
  entertainmentMinutes: m('Entertainment', Tv, HABIT.screen),
  focusMinutes: m('Focus', Timer, HABIT.focus),
  studyMinutes: m('Study', BookOpen, HABIT.focus),
  workMinutes: m('Focus and study', Briefcase, HABIT.focus),
  moodValue: m('Mood', Smile, HABIT.mood),
  stressScore: m('Stress', Activity, HABIT.stress),
  caloriesIn: m('Food', UtensilsCrossed, HABIT.meals),
  waterGlasses: m('Water', Droplets, HABIT.water),
  ecoActions: m('Green habits', Leaf, HABIT.eco),
  cyclePhase: m('Cycle', CalendarDays, { hex: '#E11D48', rgb: '225 29 72' }),
}
export const featureMeta = (key: string): Meta => FEATURE[key] ?? m('Pattern', Sparkles, HABIT.focus)

/** "Sleep → Stress" as two tinted icons */
export function PairIcons({ insight }: { insight: Insight }) {
  const d = featureMeta(insight.driver)
  const o = featureMeta(insight.outcome)
  const tile = (x: Meta) => (
    <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `rgb(${x.rgb} / 0.15)`, color: x.hex }} title={x.label}>
      <x.Icon size={17} strokeWidth={2.2} />
    </span>
  )
  return (
    <div className="flex items-center gap-1.5" aria-label={`${d.label} and ${o.label}`}>
      {tile(d)}
      <ArrowRight size={14} className="text-ui-muted" aria-hidden />
      {tile(o)}
      <span className="ml-1.5 text-[12px] font-semibold text-ui-muted">{d.label} → {o.label}</span>
    </div>
  )
}

function fmt(v: number, c: InsightComparison): string {
  if (c.unit === 'minutes') return formatMinutesToHM(Math.round(v))
  if (c.unit === 'steps') return formatNumber(Math.round(v))
  return v.toFixed(1)
}
function fmtDiff(d: number, c: InsightComparison): string {
  const sign = d > 0 ? '+' : d < 0 ? '−' : ''
  const a = Math.abs(d)
  if (c.unit === 'minutes') return `${sign}${formatMinutesToHM(Math.round(a))}`
  if (c.unit === 'steps') return `${sign}${formatNumber(Math.round(a))}`
  return `${sign}${a.toFixed(1)}`
}

/**
 * The two groups of days on one scale: grey dot for one, the outcome's colour
 * for the other, the gap between them filled, and the difference in words.
 */
export function GapChart({ insight }: { insight: Insight }) {
  const c = insight.comparison
  const o = featureMeta(insight.outcome)
  const top = c.scaleMax ?? (Math.max(c.low.value, c.high.value) * 1.15 || 1)
  const lo = c.scaleMax ? 1 : 0
  const pct = (v: number) => Math.max(0, Math.min(100, ((v - lo) / (top - lo)) * 100))
  const a = pct(c.low.value)
  const b = pct(c.high.value)
  const diff = c.high.value - c.low.value
  const unitWord = c.unit === 'score' ? `${o.label.toLowerCase()} (out of ${c.scaleMax ?? 5})` : o.label.toLowerCase()

  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-[26px] font-black tabular-nums leading-none text-ui-ink">{fmtDiff(diff, c)}</span>
        <span className="text-[12.5px] text-ui-muted">{unitWord}, {c.high.label.toLowerCase()} vs {c.low.label.toLowerCase()}</span>
      </div>

      <div className="relative mt-4 mb-1 h-6" role="img"
        aria-label={`${c.low.label}: ${fmt(c.low.value, c)}. ${c.high.label}: ${fmt(c.high.value, c)}.`}>
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-ui-line/[0.09]" />
        <div className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full"
          style={{ left: `${Math.min(a, b)}%`, width: `${Math.abs(b - a)}%`, background: `rgb(${o.rgb} / 0.45)` }} />
        <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-ui-muted ring-2 ring-ui-card" style={{ left: `${a}%` }} />
        <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full ring-2 ring-ui-card" style={{ left: `${b}%`, background: o.hex }} />
      </div>

      <dl className="mt-2 grid grid-cols-2 gap-2 text-[12.5px]">
        {[{ g: c.low, dot: 'bg-ui-muted', style: undefined }, { g: c.high, dot: '', style: { background: o.hex } }].map(({ g, dot, style }) => (
          <div key={g.label} className="rounded-xl bg-ui-raised px-3 py-2 min-w-0">
            <dt className="flex items-center gap-1.5 text-ui-muted truncate">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} style={style} /> {g.label}
            </dt>
            <dd className="mt-0.5 text-[15px] font-bold text-ui-ink tabular-nums">{fmt(g.value, c)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
