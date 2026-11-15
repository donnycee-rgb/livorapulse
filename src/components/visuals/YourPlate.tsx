import type { PlateSlice } from '../../lib/visualStories'

const LOOK = {
  carbs: { label: 'Starch', color: '#F5A623', hint: 'ugali, rice, chapati' },
  protein: { label: 'Protein', color: '#E5533D', hint: 'beans, eggs, fish, meat' },
  fat: { label: 'Fat', color: '#7CB342', hint: 'avocado, nuts, oil' },
} as const

/**
 * Today's food as a plate: each slice is that part's share of the day's
 * energy. Beside it, how each compares with a balanced plate.
 */
export default function YourPlate({ slices }: { slices: PlateSlice[] }) {
  const r = 52
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="flex items-center gap-6 max-sm:flex-col max-sm:items-start max-sm:gap-4">
      <div className="relative w-36 h-36 flex-shrink-0" aria-hidden>
        {/* the plate */}
        <div className="absolute inset-0 rounded-full bg-white dark:bg-white/[0.06] shadow-[inset_0_0_0_6px_rgba(0,0,0,0.04),0_6px_20px_rgba(16,24,40,0.08)]" />
        <svg viewBox="0 0 144 144" className="absolute inset-0 -rotate-90">
          {slices.map((s) => {
            const len = c * s.share
            const el = (
              <circle key={s.macro} cx="72" cy="72" r={r} fill="none" stroke={LOOK[s.macro].color} strokeWidth="30"
                strokeDasharray={`${Math.max(0, len - 2)} ${c}`} strokeDashoffset={-offset} />
            )
            offset += len
            return el
          })}
        </svg>
        <div className="absolute inset-[38%] rounded-full bg-white dark:bg-[#0d1526]" />
      </div>

      <ul className="flex-1 w-full space-y-2.5">
        {slices.map((s) => {
          const pct = Math.round(s.share * 100)
          const target = Math.round(s.guide * 100)
          const status = s.share / s.guide < 0.75 ? 'Add more' : s.share / s.guide > 1.35 ? 'Plenty' : 'Good'
          return (
            <li key={s.macro}>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-black/75 dark:text-white/80">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: LOOK[s.macro].color }} />
                  {LOOK[s.macro].label}
                  <span className="text-xs text-black/35 dark:text-white/35">{LOOK[s.macro].hint}</span>
                </span>
                <span className={status === 'Add more' ? 'text-xs font-semibold text-[#B45309] dark:text-[#F5C26B]' : 'text-xs text-black/45 dark:text-white/45'}>
                  {status}
                </span>
              </div>
              <div className="relative mt-1 h-1.5 rounded-full bg-black/[0.05] dark:bg-white/[0.08]">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: LOOK[s.macro].color }} />
                {/* the balanced-plate mark */}
                <div className="absolute -top-1 w-0.5 h-3.5 rounded bg-black/40 dark:bg-white/50" style={{ left: `${target}%` }}
                  title={`Balanced plate: about ${target}%`} />
              </div>
            </li>
          )
        })}
        <li className="text-[11px] text-black/40 dark:text-white/40 pt-0.5">The small line marks a balanced plate.</li>
      </ul>
    </div>
  )
}
