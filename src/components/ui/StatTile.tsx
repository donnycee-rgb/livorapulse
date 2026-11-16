import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'

/**
 * A small tinted tile: icon, label, one value, a short note and an optional
 * progress bar. Tapping it opens that habit's page.
 */
export default function StatTile({ icon: Icon, label, value, note, tint, progress, onClick }: {
  icon: LucideIcon
  label: string
  value: string
  note?: string
  /** "r g b" channels of the habit colour (see theme/habits.ts) */
  tint: string
  /** 0..1, or omit for no bar */
  progress?: number
  onClick?: () => void
}) {
  const color = `rgb(${tint})`
  return (
    <button type="button" onClick={onClick}
      className="lp-tile rounded-2xl p-3.5 text-left w-full min-h-[118px] flex flex-col active:scale-[0.98] hover:-translate-y-0.5 transition-transform duration-200"
      style={{ ['--tint' as string]: tint }}>
      <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `rgb(${tint} / 0.18)`, color }}>
        <Icon size={17} strokeWidth={2.2} />
      </span>
      <span className="mt-2.5 text-[12px] font-medium text-ui-muted">{label}</span>
      <span className="text-[19px] font-bold leading-tight text-ui-ink tabular-nums truncate">{value}</span>
      {note && <span className="text-[11px] text-ui-muted truncate mt-0.5">{note}</span>}
      {progress !== undefined && (
        <span className="mt-auto pt-2 block">
          <span className="block h-1.5 rounded-full bg-ui-line/[0.08] overflow-hidden">
            <span className={clsx('block h-full rounded-full transition-[width] duration-700 ease-out')}
              style={{ width: `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%`, background: color }} />
          </span>
        </span>
      )}
    </button>
  )
}
