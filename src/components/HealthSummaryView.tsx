import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

import type { HealthSummary, MetricKey, MetricSummary } from '../api/summary'
import { formatNumber } from '../utils/format'

// Renders a HealthSummary: the person's own preview and the public shared
// link both use this, so they show exactly the same thing, and it matches the
// PDF (livoraPulse_Backend/src/services/SummaryPdf.ts). Sentences come from
// the backend; this lays them out and draws the charts.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export function formatDateLong(key: string): string {
  const [y, m, d] = key.slice(0, 10).split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}
const shortDate = (key: string) => { const [, m, d] = key.slice(0, 10).split('-').map(Number); return `${d} ${MONTHS[m - 1]}` }
const addDays = (key: string, n: number) => new Date(Date.parse(`${key}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10)

/** One colour per measure; checked for colour-blind separation and contrast in light and dark */
const COLOR: Record<MetricKey, string> = { sleep: '#7C3AED', mood: '#DB2777', stress: '#EA580C', walks: '#16A34A' }
const CYCLE = '#E11D48'
const TITLE: Record<MetricKey, string> = { sleep: 'Sleep', mood: 'Mood', stress: 'Stress', walks: 'Walks' }
const UNIT: Record<MetricKey, string> = { sleep: 'average a night', mood: 'average, out of 5', stress: 'average, out of 5', walks: 'average on walk days' }
const NOTE: Partial<Record<MetricKey, string>> = {
  sleep: 'Shaded: the recommended 7–9 h for adults',
  mood: '1 = very low, 5 = very good',
  stress: '1 = very calm, 5 = very stressed',
}
const NOTABLE: Partial<Record<MetricKey, (n: number) => string>> = {
  sleep: (n) => `${n} night${n === 1 ? '' : 's'} under 6 h`,
  mood: (n) => `${n} low day${n === 1 ? '' : 's'} (2 or less)`,
  stress: (n) => `${n} high-stress day${n === 1 ? '' : 's'} (4 or more)`,
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

const TREND = {
  higher: { Icon: ArrowUpRight, word: 'Higher lately' },
  lower: { Icon: ArrowDownRight, word: 'Lower lately' },
  steady: { Icon: Minus, word: 'Steady' },
} as const

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-ui-line/[0.09] bg-ui-card ${className}`}>{children}</div>
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3">
      <h3 className="flex items-center gap-2 text-[15px] font-bold text-ui-ink">
        <span className="w-1 h-4 rounded-full bg-lp-primary" aria-hidden /> {title}
      </h3>
      {sub && <p className="text-[12.5px] text-ui-muted mt-0.5 ml-3">{sub}</p>}
    </div>
  )
}

// ── At a glance ─────────────────────────────────────────────────────────────

function Glance({ s }: { s: HealthSummary }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
      {(['sleep', 'mood', 'stress', 'walks'] as const).map((k) => {
        const m = s[k]
        const t = m.trend ? TREND[m.trend] : null
        const frac = Math.min(1, m.daysLogged / s.period.days)
        return (
          <Card key={k} className="p-3.5 bg-ui-raised border-transparent">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ui-muted">
              <span className="w-2 h-2 rounded-full" style={{ background: COLOR[k] }} /> {TITLE[k]}
            </div>
            <div className="mt-1.5 text-[22px] max-sm:text-[19px] font-black text-ui-ink leading-tight tabular-nums truncate">
              {m.average === null ? '–' : formatValue(k, m.average)}
            </div>
            <div className="text-[11px] text-ui-muted">{UNIT[k]}</div>
            {t && (
              <div className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-ui-ink">
                <t.Icon size={13} /> {t.word}
              </div>
            )}
            <div className="mt-2.5">
              <div className="flex justify-between text-[10.5px] text-ui-muted mb-1">
                <span>Logged</span><span className="tabular-nums">{m.daysLogged}/{s.period.days} days</span>
              </div>
              <div className="h-1 rounded-full bg-ui-line/[0.1] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${frac * 100}%`, background: COLOR[k] }} />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// ── Day-by-day chart ────────────────────────────────────────────────────────

function useWidth<T extends HTMLElement>(): [React.RefObject<T>, number] {
  const ref = useRef<T>(null)
  const [w, setW] = useState(300)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(200, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

type Axis = { lo: number; hi: number; ticks: number[]; label: (v: number) => string; band?: [number, number] }
function axisFor(k: MetricKey, m: MetricSummary): Axis {
  if (k === 'mood' || k === 'stress') return { lo: 1, hi: 5, ticks: [1, 2, 3, 4, 5], label: String }
  const vals = [...(m.daily ?? []), ...m.weekly.map((w) => w.value)].filter((v): v is number => v !== null)
  if (k === 'sleep') {
    const lo = Math.min(240, Math.floor((Math.min(...vals, 240) - 30) / 60) * 60)
    const hi = Math.max(600, Math.ceil((Math.max(...vals, 600) + 30) / 60) * 60)
    const ticks: number[] = []
    for (let t = lo; t <= hi; t += 120) ticks.push(t)
    return { lo, hi, ticks, label: (v) => `${v / 60}h`, band: [420, 540] }
  }
  const top = Math.max(1000, ...vals)
  const step = top > 20000 ? 10000 : top > 8000 ? 5000 : 2000
  const hi = Math.ceil(top / step) * step
  const ticks: number[] = []
  for (let t = 0; t <= hi; t += step) ticks.push(t)
  return { lo: 0, hi, ticks, label: (v) => (v === 0 ? '0' : `${v / 1000}k`) }
}

function DayChart({ k, m, s }: { k: MetricKey; m: MetricSummary; s: HealthSummary }) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const H = 150
  const L = 30, R = 6, T = 8, B = 20
  const pw = width - L - R, ph = H - T - B
  const n = s.period.days
  const a = axisFor(k, m)
  const daily = m.daily ?? []
  const xOf = (i: number) => L + ((i + 0.5) / n) * pw
  const yOf = (v: number) => T + ph - ((Math.min(a.hi, Math.max(a.lo, v)) - a.lo) / (a.hi - a.lo)) * ph
  const weekPts = m.weekly.map((w, i) => (w.value === null ? null : { x: xOf(Math.min(n - 1, i * 7 + 3)), y: yOf(w.value) }))
  const segments: string[] = []
  let cur = ''
  for (const p of weekPts) {
    if (!p) { if (cur) segments.push(cur); cur = ''; continue }
    cur += `${cur ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`
  }
  if (cur) segments.push(cur)
  const every = m.weekly.length > 6 ? 2 : 1

  const pickDay = (clientX: number, el: SVGSVGElement) => {
    const x = clientX - el.getBoundingClientRect().left
    const i = Math.round(((x - L) / pw) * n - 0.5)
    setHover(i >= 0 && i < n ? i : null)
  }
  const hv = hover !== null ? daily[hover] ?? null : null
  const week = hover !== null ? m.weekly[Math.floor(hover / 7)]?.value ?? null : null

  return (
    <div ref={ref} className="relative">
      <svg width={width} height={H} role="img" className="block touch-pan-y"
        aria-label={`${TITLE[k]} each day, ${formatDateLong(s.period.from)} to ${formatDateLong(s.period.to)}. ${m.text}`}
        onPointerMove={(e) => pickDay(e.clientX, e.currentTarget)} onPointerDown={(e) => pickDay(e.clientX, e.currentTarget)}
        onPointerLeave={() => setHover(null)}>
        {a.band && <rect x={L} y={yOf(a.band[1])} width={pw} height={yOf(a.band[0]) - yOf(a.band[1])} fill={COLOR[k]} opacity={0.09} />}
        {a.ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={L + pw} y1={yOf(t)} y2={yOf(t)} className="stroke-ui-line/[0.12]" strokeWidth={1} />
            <text x={L - 6} y={yOf(t) + 3.5} textAnchor="end" className="fill-ui-muted" fontSize={10}>{a.label(t)}</text>
          </g>
        ))}
        {m.weekly.map((w, i) => i % every === 0 && (
          <text key={w.weekStart} x={xOf(Math.min(n - 1, i * 7))} y={H - 4} textAnchor="middle" className="fill-ui-muted" fontSize={10}>{shortDate(w.weekStart)}</text>
        ))}
        {hover !== null && <line x1={xOf(hover)} x2={xOf(hover)} y1={T} y2={T + ph} className="stroke-ui-muted/50" strokeDasharray="3 3" />}
        {daily.map((v, i) => v !== null && (
          <circle key={i} cx={xOf(i)} cy={yOf(v)} r={i === hover ? 4.5 : 2.6} fill={COLOR[k]} opacity={i === hover ? 1 : 0.32} />
        ))}
        {segments.map((d, i) => <path key={i} d={d} fill="none" stroke={COLOR[k]} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />)}
        {weekPts.map((p, i) => p && <circle key={i} cx={p.x} cy={p.y} r={3.6} fill={COLOR[k]} className="stroke-ui-card" strokeWidth={2} />)}
        {m.daysLogged === 0 && (
          <text x={L + pw / 2} y={T + ph / 2} textAnchor="middle" className="fill-ui-muted" fontSize={12}>
            {k === 'walks' ? 'No walks recorded in this period' : 'Not logged in this period'}
          </text>
        )}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute top-0 z-10 rounded-xl bg-ui-card shadow-lg border border-ui-line/[0.1] px-2.5 py-1.5 text-[11.5px] whitespace-nowrap"
          style={{ left: Math.min(Math.max(0, xOf(hover) - 70), width - 150) }}>
          <div className="font-semibold text-ui-ink">{formatDateLong(addDays(s.period.from, hover))}</div>
          <div className="text-ui-muted">{hv === null ? 'Not logged' : formatValue(k, hv)}{week !== null && ` · week ${formatValue(k, week)}`}</div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ k, s }: { k: MetricKey; s: HealthSummary }) {
  const m = s[k]
  const facts: string[] = []
  if (m.min !== null && m.max !== null) facts.push(`Lowest ${formatValue(k, m.min)} · Highest ${formatValue(k, m.max)}`)
  if (m.notableDays !== null && NOTABLE[k]) facts.push(NOTABLE[k]!(m.notableDays))
  return (
    <Card className="p-4 break-inside-avoid">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-center gap-2 text-[15px] font-bold text-ui-ink">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLOR[k] }} /> {TITLE[k]}
        </div>
        <span className="text-[15px] font-bold text-ui-ink tabular-nums">{m.average === null ? '–' : formatValue(k, m.average)}</span>
      </div>
      {NOTE[k] && <p className="text-[11.5px] text-ui-muted mt-0.5 ml-[18px]">{NOTE[k]}</p>}
      <div className="mt-2 -mx-1"><DayChart k={k} m={m} s={s} /></div>
      {facts.length > 0 && <p className="mt-2 text-[12.5px] font-semibold text-ui-ink">{facts.join(' · ')}</p>}
      <p className="mt-1 text-[12.5px] leading-relaxed text-ui-muted">{m.text}</p>
      {m.daysLogged > 0 && (
        <div className="mt-2 flex items-center gap-4 text-[11px] text-ui-muted" aria-hidden>
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full opacity-40" style={{ background: COLOR[k] }} /> each day</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-3.5 h-0.5 rounded-full" style={{ background: COLOR[k] }} /> weekly average</span>
        </div>
      )}
    </Card>
  )
}

// ── Cycle ───────────────────────────────────────────────────────────────────

const TYPICAL = { min: 21, max: 35 }

function CycleLengths({ lengths }: { lengths: number[] }) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const lo = 15, hi = 50, L = 8, R = 8
  const xOf = (d: number) => L + ((Math.min(hi, Math.max(lo, d)) - lo) / (hi - lo)) * (width - L - R)
  return (
    <div ref={ref}>
      <svg width={width} height={58} role="img" aria-label={`Cycle lengths: ${lengths.join(', ')} days. Typical is ${TYPICAL.min} to ${TYPICAL.max}.`}>
        <rect x={xOf(TYPICAL.min)} y={10} width={xOf(TYPICAL.max) - xOf(TYPICAL.min)} height={22} rx={4} className="fill-lp-primary/15" />
        <text x={xOf(TYPICAL.min) + 4} y={8} fontSize={10} className="fill-lp-primary">typical {TYPICAL.min}–{TYPICAL.max} days</text>
        <line x1={L} x2={width - R} y1={21} y2={21} className="stroke-ui-muted/40" />
        {[15, 20, 25, 30, 35, 40, 45, 50].map((t) => (
          <text key={t} x={xOf(t)} y={52} textAnchor="middle" fontSize={10} className="fill-ui-muted">{t}</text>
        ))}
        {lengths.map((d, i) => (
          <circle key={i} cx={xOf(d)} cy={21 + (i % 2 ? 1 : -1) * Math.min(5, Math.floor(i / 2) * 2)} r={5} fill={CYCLE} className="stroke-ui-card" strokeWidth={2}>
            <title>{d} days</title>
          </circle>
        ))}
      </svg>
    </div>
  )
}

function Bars({ title, items }: { title: string; items: { label: string; n: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.n))
  return (
    <div>
      <div className="text-[12.5px] font-semibold text-ui-ink mb-2">{title}</div>
      <div className="space-y-1.5">
        {items.map((it) => (
          <div key={it.label} className="grid grid-cols-[104px_1fr_24px] items-center gap-2 text-[12.5px]">
            <span className="text-ui-muted truncate">{it.label}</span>
            <span className="h-2 rounded-full bg-ui-line/[0.08] overflow-hidden">
              <span className="block h-full rounded-full" style={{ width: `${(it.n / max) * 100}%`, background: CYCLE, opacity: 0.8 }} />
            </span>
            <span className="text-ui-ink font-semibold tabular-nums text-right">{it.n}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CycleCard({ c }: { c: NonNullable<HealthSummary['cycle']> }) {
  const flow = ['spotting', 'light', 'medium', 'heavy'].filter((f) => c.flow[f]).map((f) => ({ label: f[0].toUpperCase() + f.slice(1), n: c.flow[f] }))
  const sym = c.symptoms.slice(0, 7).map((x) => ({ label: x.name, n: x.count }))
  const stats: Array<[string, string]> = [
    [String(c.periodsLogged), c.periodsLogged === 1 ? 'period logged' : 'periods logged'],
    [c.averageLength === null ? '–' : `${c.averageLength} days`, 'average cycle'],
    [String(c.outsideTypicalRange), `outside ${TYPICAL.min}–${TYPICAL.max} days`],
  ]
  return (
    <Card className="p-4">
      <div className="grid grid-cols-3 gap-2">
        {stats.map(([v, l]) => (
          <div key={l} className="rounded-xl bg-ui-raised p-3">
            <div className="text-[19px] max-sm:text-[15px] font-black text-ui-ink tabular-nums leading-tight whitespace-nowrap">{v}</div>
            <div className="text-[11px] text-ui-muted leading-snug">{l}</div>
          </div>
        ))}
      </div>
      {c.lengths.length > 0 && (
        <div className="mt-4">
          <div className="text-[12.5px] font-semibold text-ui-ink">Cycle lengths <span className="font-normal text-ui-muted">in days</span></div>
          <CycleLengths lengths={c.lengths} />
        </div>
      )}
      {(flow.length > 0 || sym.length > 0) && (
        <div className="mt-4 grid sm:grid-cols-2 gap-5">
          {flow.length > 0 && <Bars title="Heaviest flow, by period" items={flow} />}
          {sym.length > 0 && <Bars title="Symptoms, periods logged with" items={sym} />}
        </div>
      )}
      <p className="mt-4 text-[12.5px] leading-relaxed text-ui-muted">{c.text}</p>
    </Card>
  )
}

// ── Whole summary ───────────────────────────────────────────────────────────

export default function HealthSummaryView({ summary }: { summary: HealthSummary }) {
  const s = summary
  const who = [s.person.name, s.person.age !== null ? `${s.person.age} years` : null, s.person.sex].filter(Boolean).join(' · ')

  return (
    <div className="space-y-6">
      <div className="rounded-2xl px-5 py-4 bg-[#14532d] text-white">
        <div className="text-[11px] font-bold tracking-widest text-green-200">LIVORAPULSE HEALTH SUMMARY</div>
        <div className="mt-1 text-[20px] font-black leading-tight">{who}</div>
        <div className="text-[12.5px] text-green-100/90 mt-0.5">
          {formatDateLong(s.period.from)} – {formatDateLong(s.period.to)} · {s.period.days} days · generated {formatDateLong(s.generatedAt)}
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl px-3 py-2 bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200 text-[13px] font-medium">
        <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
        <span>{s.disclaimer} Values are entered by the person in the app and have not been clinically verified.</span>
      </div>

      <section>
        <SectionTitle title="At a glance" />
        <Glance s={s} />
      </section>

      <section>
        <SectionTitle title="Day by day" sub="Each dot is one day logged; the line joins the weekly averages. Tap or hover for a day." />
        <div className="grid lg:grid-cols-2 gap-3">
          {(['sleep', 'mood', 'stress', 'walks'] as const).map((k) => <MetricCard key={k} k={k} s={s} />)}
        </div>
      </section>

      {s.flags.length > 0 && (
        <section>
          <SectionTitle title="Worth discussing" sub="Patterns the app suggests getting checked. They are not a diagnosis." />
          <div className="space-y-2">
            {s.flags.map((f) => (
              <div key={f.title} className="rounded-xl border-l-[3px] border-amber-500 bg-amber-50 dark:bg-amber-500/10 px-4 py-3">
                <div className="text-[13.5px] font-bold text-ui-ink">{f.title}</div>
                <div className="text-[13px] text-ui-ink/80 mt-0.5 leading-relaxed">{f.detail}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {s.cycle && (
        <section>
          <SectionTitle title="Menstrual cycle" sub="From the days marked as period days." />
          <CycleCard c={s.cycle} />
        </section>
      )}

      {s.insights.length > 0 && (
        <section>
          <SectionTitle title="Patterns in their own logs" sub="Found by comparing good and bad days. Links, not proven causes." />
          <ol className="space-y-2">
            {s.insights.map((t, i) => (
              <li key={t} className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-lp-primary/15 text-lp-primary text-[12px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <span className="text-[13.5px] leading-relaxed text-ui-ink/85 pt-0.5">{t}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {s.notes && s.notes.length > 0 && (
        <section>
          <SectionTitle title="Notes written by the person" sub="Included because they chose to share them. Most recent first." />
          <ul className="space-y-3">
            {s.notes.map((n, i) => (
              <li key={i} className="border-l-2 border-ui-line/[0.15] pl-3">
                <div className="text-[11.5px] font-semibold text-ui-muted">{formatDateLong(n.date)} · {n.area}</div>
                <div className="text-[13.5px] leading-relaxed text-ui-ink/85">{n.text}</div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
