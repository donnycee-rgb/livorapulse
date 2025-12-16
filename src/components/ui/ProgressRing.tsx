import { useMemo } from 'react'

import { clamp } from '../../utils/format'

type Props = {
  value: number // 0-100
  label: string
  size?: number
  strokeWidth?: number
  color?: string
  trackColor?: string
  valueClassName?: string
  labelClassName?: string
  helperText?: string
}

export default function ProgressRing({
  value,
  label,
  size = 92,
  strokeWidth = 10,
  color = '#4CAF50',
  trackColor = 'rgba(0,0,0,0.08)',
  valueClassName = 'text-lp-secondary dark:text-white',
  labelClassName = 'text-black/85 dark:text-white/90',
  helperText = 'Weekly trend',
}: Props) {
  const v = clamp(value, 0, 100)

  const { r, c, dashOffset } = useMemo(() => {
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference * (1 - v / 100)
    return { r: radius, c: circumference, dashOffset: offset }
  }, [size, strokeWidth, v])

  return (
    <div className="flex items-center gap-4">
      <div className="relative" style={{ width: size, height: size }} aria-label={`${label}: ${v}%`}>
        <svg width={size} height={size} className="block">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
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
          <div className={`text-xl font-bold leading-none ${valueClassName}`}>{v}%</div>
        </div>
      </div>

      <div>
        <div className={`text-sm font-semibold ${labelClassName}`}>{label}</div>
        <div className="text-xs text-black/55 dark:text-white/55 mt-0.5">{helperText}</div>
      </div>
    </div>
  )
}
