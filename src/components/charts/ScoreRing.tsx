import { useMemo } from 'react'
import { clamp } from '../../utils/format'

type Props = {
  value: number // 0-100
  size?: number
  strokeWidth?: number
}

export default function ScoreRing({ value, size = 140, strokeWidth = 12 }: Props) {
  const v = clamp(value, 0, 100)

  const { r, c, dashOffset } = useMemo(() => {
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference * (1 - v / 100)
    return { r: radius, c: circumference, dashOffset: offset }
  }, [size, strokeWidth, v])

  return (
    <div className="relative" style={{ width: size, height: size }} aria-label={`Life Footprint Score: ${v}/100`}>
      <svg width={size} height={size} className="block">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(0,0,0,0.08)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#4CAF50"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 900ms ease' }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold text-lp-secondary dark:text-white leading-none">{v}</div>
        <div className="text-xs font-semibold tracking-wide text-black/50 dark:text-white/55 mt-1">/ 100</div>
      </div>
    </div>
  )
}
