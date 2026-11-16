import clsx from 'clsx'

/**
 * The pill tabs under a page title (Overview · Activity · Sleep …). Scrolls
 * sideways on small phones instead of wrapping.
 */
export default function PageTabs<T extends string>({ tabs, value, onChange, label }: {
  tabs: ReadonlyArray<{ key: T; label: string }>
  value: T
  onChange: (key: T) => void
  label: string
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
      {tabs.map((t) => {
        const active = t.key === value
        return (
          <button key={t.key} type="button" role="tab" aria-selected={active} onClick={() => onChange(t.key)}
            className={clsx('flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-colors',
              active
                ? 'bg-lp-btn text-lp-btn-ink lp-glow'
                : 'bg-ui-raised text-ui-muted hover:text-ui-ink')}>
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
