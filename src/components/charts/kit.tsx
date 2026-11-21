// ─── The chart kit: one look for every chart in the app ─────────────────────
// Smooth curves over soft gradients, gradient bars with rounded tops, donuts
// with rounded gradient segments and the headline number in the middle, one
// tooltip style, and every chart animates when it scrolls into view.
//
// Rules followed (the dataviz guidance): one value axis per chart (measures
// of different scale are indexed to a common base by the caller, e.g. % of
// goal), thin 2.5px lines, rounded data-ends anchored to the baseline, a 2px
// surface gap between donut segments, a legend whenever there are 2+ series,
// labels in text colours (never the series colour), and colours that passed
// the palette validator in light and dark (theme/chartColors.ts).
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { pick, type Duo } from '../../theme/chartColors'

// ── Theme and visibility ────────────────────────────────────────────────────

/** Follows the page's actual theme (html.dark), including "System" mode */
export function useIsDark(): boolean {
  const [dark, setDark] = useState(() => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'))
  useEffect(() => {
    const el = document.documentElement
    const obs = new MutationObserver(() => setDark(el.classList.contains('dark')))
    obs.observe(el, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return dark
}

function useInView<T extends Element>(): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    if (typeof IntersectionObserver === 'undefined') { setSeen(true); return }
    const obs = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setSeen(true); obs.disconnect() }
    }, { threshold: 0.25 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [seen])
  return [ref, seen]
}

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Draws the chart once it scrolls into view, so its animation is seen */
function InView({ children, className }: { children: ReactNode; className?: string }) {
  const [ref, seen] = useInView<HTMLDivElement>()
  return <div ref={ref} className={className ?? 'w-full h-full'}>{seen ? children : null}</div>
}

function chrome(dark: boolean) {
  return {
    grid: dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
    axis: dark ? 'rgba(232,238,246,0.55)' : 'rgba(15,23,42,0.50)',
    surface: dark ? '#0E1A2B' : '#FFFFFF',
    cursor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)',
  }
}

// ── Tooltip and legend ──────────────────────────────────────────────────────

type TipRow = { label: string; value: string; color: string }

function TooltipCard({ title, rows }: { title: string; rows: TipRow[] }) {
  return (
    <div className="rounded-2xl border border-ui-line/10 bg-ui-card/95 backdrop-blur px-3 py-2.5 shadow-lg min-w-[120px]">
      <div className="text-[11px] font-bold text-ui-muted mb-1">{title}</div>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2 text-[12.5px] py-0.5">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: r.color }} />
          <span className="text-ui-muted">{r.label}</span>
          <span className="ml-auto pl-3 font-bold text-ui-ink tabular-nums">{r.value}</span>
        </div>
      ))}
    </div>
  )
}

export function Legend({ items }: { items: Array<{ label: string; color: Duo }> }) {
  const dark = useIsDark()
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-ui-muted">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: pick(i.color, dark) }} /> {i.label}
        </span>
      ))}
    </div>
  )
}

// ── Area / line trend ───────────────────────────────────────────────────────

export type Series<D> = {
  key: string
  label: string
  color: Duo
  /** Words for the tooltip, from the row (e.g. "8,200 steps"); null hides the row */
  text: (row: D) => string | null
}

export function AreaTrend<D extends { day: string }>({
  data, series, yTicks, yFormat, domain, goal, goalLabel = 'Goal',
}: {
  data: D[]
  series: Series<D>[]
  yTicks?: number[]
  yFormat?: (v: number) => string
  domain?: [number | 'auto', number | 'auto']
  /** A dashed reference line (e.g. 100 for "goal reached") */
  goal?: number
  goalLabel?: string
}) {
  const dark = useIsDark()
  const c = chrome(dark)
  const uid = useId().replace(/:/g, '')
  const animate = !reducedMotion()

  return (
    <InView>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 10, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`a-${uid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={pick(s.color, dark)} stopOpacity={series.length > 1 ? 0.28 : 0.38} />
                <stop offset="100%" stopColor={pick(s.color, dark)} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke={c.grid} />
          <XAxis dataKey="day" tick={{ fill: c.axis, fontSize: 11 }} tickLine={false} axisLine={false} dy={6} />
          <YAxis tick={{ fill: c.axis, fontSize: 11 }} tickLine={false} axisLine={false} width={40}
            ticks={yTicks} tickFormatter={yFormat} domain={domain ?? [0, 'auto']} allowDecimals={false} />
          {goal !== undefined && (
            <ReferenceLine y={goal} stroke={c.axis} strokeOpacity={0.5} strokeDasharray="4 4"
              label={{ value: goalLabel, position: 'insideTopRight', fill: c.axis, fontSize: 10 }} />
          )}
          <Tooltip cursor={{ stroke: c.axis, strokeOpacity: 0.3, strokeDasharray: '3 3' }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const row = payload[0].payload as D
              const rows = series.flatMap((s) => { const t = s.text(row); return t === null ? [] : [{ label: s.label, value: t, color: pick(s.color, dark) }] })
              return rows.length ? <TooltipCard title={String(label)} rows={rows} /> : null
            }} />
          {series.map((s, i) => (
            <Area key={s.key} type="monotone" dataKey={s.key} name={s.label}
              stroke={pick(s.color, dark)} strokeWidth={2.5} fill={`url(#a-${uid}-${s.key})`}
              connectNulls={false}
              // A logged day between two unlogged ones has no line to sit on: draw it as a dot
              dot={(p: { key?: string; cx?: number; cy?: number; index?: number }) => {
                const at = (i: number) => (data[i] as Record<string, unknown> | undefined)?.[s.key]
                const i = p.index ?? -1
                const alone = at(i) != null && at(i - 1) == null && at(i + 1) == null
                return alone && p.cx != null && p.cy != null
                  ? <circle key={p.key} cx={p.cx} cy={p.cy} r={4} fill={pick(s.color, dark)} stroke={c.surface} strokeWidth={2} />
                  : <g key={p.key} />
              }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: c.surface, fill: pick(s.color, dark) }}
              isAnimationActive={animate} animationDuration={1100} animationBegin={i * 150} animationEasing="ease-out" />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </InView>
  )
}

// ── Bars ────────────────────────────────────────────────────────────────────

export function BarTrend<D extends { day: string }>({
  data, dataKey, label, color, text, goal, goalLabel = 'Goal', highlight, yFormat, yTicks, domain, barColor,
}: {
  data: D[]
  dataKey: keyof D & string
  label: string
  color: Duo
  text: (row: D) => string
  goal?: number
  goalLabel?: string
  /** The day to emphasise (today); other bars are a little softer */
  highlight?: string
  yFormat?: (v: number) => string
  yTicks?: number[]
  domain?: [number | 'auto', number | 'auto']
  /** Optional colour per row (e.g. mood); defaults to `color` */
  barColor?: (row: D) => Duo
}) {
  const dark = useIsDark()
  const c = chrome(dark)
  const uid = useId().replace(/:/g, '')
  const animate = !reducedMotion()
  const colors = data.map((d) => pick(barColor ? barColor(d) : color, dark))
  const unique = [...new Set(colors)]

  return (
    <InView>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 8, top: 10, bottom: 0 }} barCategoryGap="28%">
          <defs>
            {unique.map((col, i) => (
              <linearGradient key={col} id={`b-${uid}-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={col} stopOpacity={1} />
                <stop offset="100%" stopColor={col} stopOpacity={0.45} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke={c.grid} />
          <XAxis dataKey="day" tick={{ fill: c.axis, fontSize: 11 }} tickLine={false} axisLine={false} dy={6} />
          <YAxis tick={{ fill: c.axis, fontSize: 11 }} tickLine={false} axisLine={false} width={40}
            ticks={yTicks} tickFormatter={yFormat} domain={domain ?? [0, 'auto']} allowDecimals={false} />
          {goal !== undefined && (
            <ReferenceLine y={goal} stroke={c.axis} strokeOpacity={0.5} strokeDasharray="4 4"
              label={{ value: goalLabel, position: 'insideTopRight', fill: c.axis, fontSize: 10 }} />
          )}
          <Tooltip cursor={{ fill: c.cursor, radius: 8 } as never}
            content={({ active, payload, label: day }) => {
              if (!active || !payload?.length) return null
              const row = payload[0].payload as D
              return <TooltipCard title={String(day)} rows={[{ label, value: text(row), color: colors[data.indexOf(row)] ?? pick(color, dark) }]} />
            }} />
          <Bar dataKey={dataKey} radius={[6, 6, 2, 2]} maxBarSize={30}
            isAnimationActive={animate} animationDuration={900} animationEasing="ease-out">
            {data.map((d, i) => (
              <Cell key={i} fill={`url(#b-${uid}-${unique.indexOf(colors[i])})`}
                fillOpacity={highlight && d.day !== highlight ? 0.75 : 1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </InView>
  )
}

// ── Donut ───────────────────────────────────────────────────────────────────

export type Slice = { label: string; value: number; color: Duo }

/**
 * A donut with rounded gradient segments that sweep in when scrolled into
 * view, the headline in the middle (by default the biggest share), and a
 * legend with each share underneath.
 */
export function Donut({ data, centerValue, centerLabel, format, height = 200 }: {
  data: Slice[]
  centerValue?: string
  centerLabel?: string
  /** Tooltip words for a value, e.g. minutes → "1h 20m" */
  format: (v: number) => string
  height?: number
}) {
  const dark = useIsDark()
  const c = chrome(dark)
  const uid = useId().replace(/:/g, '')
  const animate = !reducedMotion()
  const total = data.reduce((s, d) => s + d.value, 0)
  const shown = data.filter((d) => d.value > 0)
  const top = [...shown].sort((a, b) => b.value - a.value)[0]
  const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0)

  if (total <= 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center" style={{ height }}>
        <div className="w-28 h-28 rounded-full border-[10px] border-ui-line/[0.07]" />
        <div className="text-xs text-ui-muted mt-3">Nothing logged yet</div>
      </div>
    )
  }

  return (
    <div>
      <div className="relative" style={{ height }}>
        <InView>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {shown.map((d, i) => (
                  <linearGradient key={d.label} id={`d-${uid}-${i}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={pick(d.color, dark)} stopOpacity={0.7} />
                    <stop offset="100%" stopColor={pick(d.color, dark)} stopOpacity={1} />
                  </linearGradient>
                ))}
              </defs>
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload as Slice
                return <TooltipCard title={d.label} rows={[{ label: `${pct(d.value)}%`, value: format(d.value), color: pick(d.color, dark) }]} />
              }} />
              <Pie data={shown} dataKey="value" nameKey="label"
                innerRadius="68%" outerRadius="96%" cornerRadius={8} paddingAngle={shown.length > 1 ? 3 : 0}
                startAngle={90} endAngle={-270} stroke={c.surface} strokeWidth={2}
                isAnimationActive={animate} animationDuration={1100} animationEasing="ease-out">
                {shown.map((d, i) => <Cell key={d.label} fill={`url(#d-${uid}-${i})`} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </InView>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[11px] text-ui-muted">{centerLabel ?? top?.label}</span>
          <span className="text-[26px] font-extrabold text-ui-ink leading-tight tabular-nums">{centerValue ?? `${pct(top?.value ?? 0)}%`}</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[12px]">
        {data.map((d) => (
          <span key={d.label} className="inline-flex items-center gap-1.5 text-ui-muted">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: pick(d.color, dark) }} />
            {d.label} <b className="text-ui-ink font-semibold tabular-nums">{pct(d.value)}%</b>
          </span>
        ))}
      </div>
    </div>
  )
}
