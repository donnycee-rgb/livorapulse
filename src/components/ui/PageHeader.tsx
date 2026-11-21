import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/** Page title with its habit icon and one short line under it */
export function PageHeader({ icon: Icon, tint, title, subtitle }: {
  icon: LucideIcon
  /** "r g b" channels of the page's colour */
  tint: string
  title: string
  subtitle?: ReactNode
}) {
  return (
    <header className="flex items-center gap-3 px-0.5">
      <span className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: `rgb(${tint} / 0.16)`, color: `rgb(${tint})` }}>
        <Icon size={21} strokeWidth={2.2} />
      </span>
      <div className="min-w-0">
        <h1 className="text-[24px] max-sm:text-[22px] font-bold tracking-tight text-ui-ink leading-tight">{title}</h1>
        {subtitle && <p className="text-[13.5px] text-ui-muted mt-0.5 line-clamp-2">{subtitle}</p>}
      </div>
    </header>
  )
}

/** A small box under a hero ring: icon, one value, a label (like "328 kcal · Calories") */
export function MiniStat({ icon: Icon, tint, value, label }: {
  icon: LucideIcon
  tint: string
  value: string
  label: string
}) {
  return (
    <div className="min-w-0 pt-3 border-t border-ui-line/[0.1]">
      <div className="flex items-center gap-1.5 text-[11.5px] text-ui-muted min-w-0">
        <Icon size={14} strokeWidth={2.2} className="flex-shrink-0" style={{ color: `rgb(${tint})` }} aria-hidden />
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1 text-[17px] font-bold text-ui-ink leading-tight tabular-nums truncate">{value}</div>
    </div>
  )
}

/** Buttons under a hero: one green main action, quieter ones beside it */
export function ActionButton({ icon: Icon, children, onClick, primary = false }: {
  icon: LucideIcon
  children: ReactNode
  onClick: () => void
  primary?: boolean
}) {
  return (
    <button type="button" onClick={onClick}
      className={primary
        ? 'inline-flex items-center justify-center gap-2 h-11 px-5 rounded-2xl text-sm font-bold bg-lp-btn text-lp-btn-ink lp-glow active:scale-[0.98] transition-transform'
        : 'inline-flex items-center justify-center gap-2 h-11 px-4 rounded-2xl text-sm font-semibold bg-ui-raised text-ui-ink hover:bg-ui-line/[0.08] active:scale-[0.98] transition'}>
      <Icon size={16} strokeWidth={2.2} /> {children}
    </button>
  )
}
