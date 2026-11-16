import { useEffect, useId, useState, type ReactNode } from 'react'
import clsx from 'clsx'

/**
 * A progress ring like the mockup's: a faint track, a coloured arc with a
 * soft gradient (and a glow in dark mode), and anything in the middle.
 * `value` is 0..1; it animates up once. `null` shows just the track.
 */
export default function RingGauge({ value, color, size = 120, stroke = 10, children, className, label }: {
  value: number | null
  color: string
  size?: number
  stroke?: number
  children?: ReactNode
  className?: string
  /** Read out by screen readers, e.g. "7,842 of 10,000 steps" */
  label?: string
}) {
  const id = useId().replace(/:/g, '')
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const target = value === null ? 0 : Math.max(0, Math.min(1, value))
  const [shown, setShown] = useState(0)

  useEffect(() => {
    // Respect "reduce motion": jump straight to the value
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setShown(target); return }
    let start: number | null = null
    let raf = 0
    const from = 0
    const step = (ts: number) => {
      if (start === null) start = ts
      const p = Math.min((ts - start) / 900, 1)
      setShown(from + (target - from) * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target])

  return (
    <div className={clsx('relative flex-shrink-0', className)} style={{ width: size, height: size }}
      role={label ? 'img' : undefined} aria-label={label}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90" aria-hidden>
        <defs>
          <linearGradient id={`ring-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.75" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          <filter id={`glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-ui-line/[0.07]" />
        {value !== null && shown > 0 && (
          <>
            {/* glow under the arc: only shows on dark backgrounds */}
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
              strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - shown)}
              filter={`url(#glow-${id})`} className="opacity-0 dark:opacity-60" />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#ring-${id})`} strokeWidth={stroke}
              strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - shown)} />
          </>
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}
