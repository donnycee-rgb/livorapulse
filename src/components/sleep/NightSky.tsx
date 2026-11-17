import { useId, type ReactNode } from 'react'
import clsx from 'clsx'

// The look shared by the sleep banner and the Sleep card: a deep night
// gradient, a crescent moon and a few stars that twinkle slowly (still when
// the person prefers reduced motion). Dark in both themes: it is night.

const STARS: Array<{ x: string; y: string; size: number; delay: string }> = [
  { x: '6%', y: '28%', size: 2, delay: '0s' },
  { x: '19%', y: '70%', size: 1.5, delay: '1.4s' },
  { x: '34%', y: '22%', size: 1.5, delay: '2.6s' },
  { x: '47%', y: '78%', size: 2, delay: '0.7s' },
  { x: '58%', y: '18%', size: 1.5, delay: '3.1s' },
  { x: '71%', y: '62%', size: 2, delay: '1.9s' },
  { x: '83%', y: '30%', size: 1.5, delay: '2.2s' },
  { x: '93%', y: '74%', size: 1.5, delay: '0.4s' },
]

export function Moon({ size = 28, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={clsx('lp-moon flex-shrink-0', className)} aria-hidden>
      <defs>
        <mask id={`crescent-${id}`}>
          <rect width="32" height="32" fill="white" />
          <circle cx="21" cy="11" r="10" fill="black" />
        </mask>
        <radialGradient id={`glow-${id}`} cx="40%" cy="60%" r="60%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="100%" stopColor="#FCD34D" />
        </radialGradient>
      </defs>
      <circle cx="15" cy="17" r="12" fill={`url(#glow-${id})`} mask={`url(#crescent-${id})`} />
    </svg>
  )
}

export function NightSky({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('relative overflow-hidden text-white', className)}
      style={{ background: 'linear-gradient(105deg, #0B1230 0%, #161A45 55%, #26215C 100%)' }}>
      {STARS.map((s, i) => (
        <span key={i} aria-hidden className="lp-twinkle absolute rounded-full bg-white pointer-events-none"
          style={{ left: s.x, top: s.y, width: s.size, height: s.size, animationDelay: s.delay }} />
      ))}
      {/* a faint horizon glow along the bottom edge */}
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(252, 211, 77, 0.35), transparent)' }} />
      <div className="relative">{children}</div>
    </div>
  )
}
